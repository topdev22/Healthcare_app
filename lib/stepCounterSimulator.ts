/**
 * Step Counter Simulator for PC Testing
 * This provides a simulation environment for testing step counting functionality on PC
 * where no actual motion sensors are available.
 */

import { Preferences } from '@capacitor/preferences';

export interface SimulatedStepData {
  steps: number;
  startTime: number;
  lastUpdate: number;
  isActive: boolean;
  isSimulated: true;
  sessionTime: number;
  averageStepsPerMinute: number;
}

export interface SimulationSettings {
  autoStepInterval: number; // milliseconds between auto steps
  stepsPerKeypress: number; // steps to add per manual trigger
  enableKeyboardControls: boolean;
  enableAutoWalk: boolean;
  walkingSpeed: 'slow' | 'normal' | 'fast' | 'running';
}

class StepCounterSimulator {
  private isRunning = false;
  private stepCount = 0;
  private sessionStartTime = Date.now();
  private listeners: Array<(data: SimulatedStepData) => void> = [];
  private autoStepInterval: NodeJS.Timeout | null = null;
  private keyboardListener: ((event: KeyboardEvent) => void) | null = null;

  private settings: SimulationSettings = {
    autoStepInterval: 800, // Default: step every 800ms (moderate walking pace)
    stepsPerKeypress: 1,
    enableKeyboardControls: true,
    enableAutoWalk: false,
    walkingSpeed: 'normal'
  };

  constructor() {
    this.loadStoredData();
    this.setupKeyboardControls();
  }

  /**
   * Initialize the simulator
   */
  async initialize(): Promise<boolean> {
    console.log('🖥️ Step Counter Simulator initialized for PC testing');
    this.displayKeyboardInstructions();
    return true;
  }

  /**
   * Display keyboard instructions in console
   */
  private displayKeyboardInstructions(): void {
    console.log(`
🎮 PC Step Counter Testing - Keyboard Controls:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPACEBAR    - Add ${this.settings.stepsPerKeypress} step(s)
ENTER       - Add 10 steps (fast walking)
ARROW UP    - Increase walking speed
ARROW DOWN  - Decrease walking speed
A           - Toggle auto-walk mode
R           - Reset step count
S           - Start/Stop tracking
D           - Add 100 steps (debug mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  /**
   * Setup keyboard controls for step simulation
   */
  private setupKeyboardControls(): void {
    if (!this.settings.enableKeyboardControls) return;

    this.keyboardListener = (event: KeyboardEvent) => {
      if (!this.isRunning) return;

      // Prevent default for our control keys
      const controlKeys = [' ', 'Enter', 'ArrowUp', 'ArrowDown', 'a', 'A', 'r', 'R', 's', 'S', 'd', 'D'];
      if (controlKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case ' ': // Spacebar - add single step
          this.addSteps(this.settings.stepsPerKeypress);
          break;
        case 'Enter': // Enter - add multiple steps (jogging)
          this.addSteps(10);
          console.log('🏃 Added 10 steps (jogging pace)');
          break;
        case 'ArrowUp': // Increase speed
          this.increaseWalkingSpeed();
          break;
        case 'ArrowDown': // Decrease speed
          this.decreaseWalkingSpeed();
          break;
        case 'a':
        case 'A': // Toggle auto-walk
          this.toggleAutoWalk();
          break;
        case 'r':
        case 'R': // Reset
          this.resetStepCount();
          break;
        case 's':
        case 'S': // Start/Stop
          if (this.isRunning) {
            this.stopCounting();
          } else {
            this.startCounting();
          }
          break;
        case 'd':
        case 'D': // Debug - add many steps
          this.addSteps(100);
          console.log('🔧 Debug: Added 100 steps');
          break;
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', this.keyboardListener);
    
    // Focus the document to ensure key events are captured
    document.body.tabIndex = -1;
    document.body.focus();
  }

  /**
   * Start step counting simulation
   */
  async startCounting(): Promise<boolean> {
    if (this.isRunning) return true;

    this.isRunning = true;
    this.sessionStartTime = Date.now();
    
    console.log('▶️ Step counter simulation started');
    console.log('💡 Press SPACEBAR to simulate steps, or A to enable auto-walk');
    
    this.notifyListeners();
    this.saveStepData();
    return true;
  }

  /**
   * Stop step counting simulation
   */
  async stopCounting(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.autoStepInterval) {
      clearInterval(this.autoStepInterval);
      this.autoStepInterval = null;
    }

    console.log('⏹️ Step counter simulation stopped');
    await this.saveStepData();
    this.notifyListeners();
  }

  /**
   * Add steps manually
   */
  private addSteps(count: number): void {
    if (!this.isRunning) return;

    this.stepCount += count;
    console.log(`👟 +${count} steps (Total: ${this.stepCount})`);
    
    this.notifyListeners();
    this.saveStepData();
  }

  /**
   * Toggle auto-walk simulation
   */
  private toggleAutoWalk(): void {
    this.settings.enableAutoWalk = !this.settings.enableAutoWalk;
    
    if (this.settings.enableAutoWalk) {
      this.startAutoWalk();
      console.log('🚶 Auto-walk enabled:', this.getWalkingSpeedDescription());
    } else {
      this.stopAutoWalk();
      console.log('⏸️ Auto-walk disabled');
    }
  }

  /**
   * Start automatic step generation
   */
  private startAutoWalk(): void {
    if (this.autoStepInterval) {
      clearInterval(this.autoStepInterval);
    }

    const interval = this.getWalkingInterval();
    this.autoStepInterval = setInterval(() => {
      if (this.isRunning && this.settings.enableAutoWalk) {
        this.addSteps(1);
      }
    }, interval);
  }

  /**
   * Stop automatic step generation
   */
  private stopAutoWalk(): void {
    if (this.autoStepInterval) {
      clearInterval(this.autoStepInterval);
      this.autoStepInterval = null;
    }
  }

  /**
   * Get walking interval based on speed setting
   */
  private getWalkingInterval(): number {
    switch (this.settings.walkingSpeed) {
      case 'slow': return 1200; // 50 steps/min
      case 'normal': return 800; // 75 steps/min
      case 'fast': return 600; // 100 steps/min
      case 'running': return 400; // 150 steps/min
      default: return 800;
    }
  }

  /**
   * Get walking speed description
   */
  private getWalkingSpeedDescription(): string {
    const speeds = {
      slow: '🐌 Slow walk (50 steps/min)',
      normal: '🚶 Normal walk (75 steps/min)',
      fast: '🚶‍♂️ Fast walk (100 steps/min)',
      running: '🏃 Running (150 steps/min)'
    };
    return speeds[this.settings.walkingSpeed];
  }

  /**
   * Increase walking speed
   */
  private increaseWalkingSpeed(): void {
    const speeds: Array<'slow' | 'normal' | 'fast' | 'running'> = ['slow', 'normal', 'fast', 'running'];
    const currentIndex = speeds.indexOf(this.settings.walkingSpeed);
    
    if (currentIndex < speeds.length - 1) {
      this.settings.walkingSpeed = speeds[currentIndex + 1];
      console.log('⬆️ Speed increased:', this.getWalkingSpeedDescription());
      
      if (this.settings.enableAutoWalk) {
        this.startAutoWalk(); // Restart with new interval
      }
    }
  }

  /**
   * Decrease walking speed
   */
  private decreaseWalkingSpeed(): void {
    const speeds: Array<'slow' | 'normal' | 'fast' | 'running'> = ['slow', 'normal', 'fast', 'running'];
    const currentIndex = speeds.indexOf(this.settings.walkingSpeed);
    
    if (currentIndex > 0) {
      this.settings.walkingSpeed = speeds[currentIndex - 1];
      console.log('⬇️ Speed decreased:', this.getWalkingSpeedDescription());
      
      if (this.settings.enableAutoWalk) {
        this.startAutoWalk(); // Restart with new interval
      }
    }
  }

  /**
   * Reset step count
   */
  async resetStepCount(): Promise<void> {
    this.stepCount = 0;
    this.sessionStartTime = Date.now();
    console.log('🔄 Step count reset');
    
    await this.saveStepData();
    this.notifyListeners();
  }

  /**
   * Get current step data
   */
  getStepData(): SimulatedStepData {
    const now = Date.now();
    const sessionTime = (now - this.sessionStartTime) / (1000 * 60); // in minutes
    const averageStepsPerMinute = sessionTime > 0 ? this.stepCount / sessionTime : 0;

    return {
      steps: this.stepCount,
      startTime: this.sessionStartTime,
      lastUpdate: now,
      isActive: this.isRunning,
      isSimulated: true,
      sessionTime,
      averageStepsPerMinute
    };
  }

  /**
   * Add listener for step count updates
   */
  addListener(callback: (data: SimulatedStepData) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (data: SimulatedStepData) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const data = this.getStepData();
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying simulator listener:', error);
      }
    });
  }

  /**
   * Save step data to storage
   */
  private async saveStepData(): Promise<void> {
    try {
      const data = this.getStepData();
      await Preferences.set({
        key: 'simulatedStepData',
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to save simulated step data:', error);
    }
  }

  /**
   * Load stored step data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'simulatedStepData' });
      if (value) {
        const data: SimulatedStepData = JSON.parse(value);
        
        // Check if data is from today
        const today = new Date().toDateString();
        const dataDate = new Date(data.startTime).toDateString();
        
        if (today === dataDate) {
          this.stepCount = data.steps;
          this.sessionStartTime = data.startTime;
        } else {
          // Reset for new day
          this.resetStepCount();
        }
      }
    } catch (error) {
      console.error('Failed to load simulated step data:', error);
    }
  }

  /**
   * Generate realistic walking pattern simulation
   */
  simulateWalkingSession(durationMinutes: number, pace: 'slow' | 'normal' | 'fast' | 'running' = 'normal'): void {
    const stepsPerMinute = {
      slow: 50,
      normal: 75,
      fast: 100,
      running: 150
    };

    const totalSteps = Math.round(durationMinutes * stepsPerMinute[pace]);
    const intervalMs = (durationMinutes * 60 * 1000) / totalSteps;

    console.log(`🎯 Simulating ${durationMinutes}-minute ${pace} walk (${totalSteps} steps)`);

    let stepsAdded = 0;
    const simulationInterval = setInterval(() => {
      if (stepsAdded >= totalSteps) {
        clearInterval(simulationInterval);
        console.log(`✅ Walking simulation complete: ${totalSteps} steps in ${durationMinutes} minutes`);
        return;
      }

      this.addSteps(1);
      stepsAdded++;
    }, intervalMs);
  }

  /**
   * Cleanup when component unmounts
   */
  cleanup(): void {
    this.stopAutoWalk();
    
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = null;
    }
  }
}

// Export singleton instance for PC testing
export const stepCounterSimulator = new StepCounterSimulator();

// Expose to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).stepCounterSimulator = stepCounterSimulator;
}
