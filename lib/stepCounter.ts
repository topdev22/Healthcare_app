import { Motion } from '@capacitor/motion';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { stepCounterSimulator } from './stepCounterSimulator';
import { mobileStepCounter } from './mobileStepCounter';

export interface StepCounterData {
  steps: number;
  startTime: number;
  lastUpdate: number;
  isActive: boolean;
  calibrated: boolean;
}

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

class StepCounterService {
  private isRunning = false;
  private stepCount = 0;
  private lastAcceleration: AccelerometerData | null = null;
  private stepThreshold = 1.2; // Acceleration threshold for step detection
  private minStepInterval = 300; // Minimum milliseconds between steps
  private lastStepTime = 0;
  private accelerometerBuffer: AccelerometerData[] = [];
  private bufferSize = 20; // Keep last 20 readings for smoothing
  private listeners: Array<(data: StepCounterData) => void> = [];
  private sessionStartTime = Date.now();
  private permissionGranted = false;
  private webMotionHandler: ((event: DeviceMotionEvent) => void) | null = null;

  // Step detection algorithm parameters
  private peakThreshold = 10.5; // Minimum peak value
  private valleyThreshold = 9.5; // Maximum valley value
  private dynamicThreshold = true;
  private lastPeak = 0;
  private lastValley = 0;
  private isWaitingForValley = false;

  constructor() {
    this.loadStoredData();
  }

  /**
   * Check if running on PC/Desktop for development
   */
  private isPCEnvironment(): boolean {
    // Check if running in browser (not native mobile app)
    if (!Capacitor.isNativePlatform()) {
      // Check user agent for desktop patterns
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      return !isMobile;
    }
    return false;
  }

  /**
   * Check if running on mobile device (native or web mobile)
   */
  private isMobileEnvironment(): boolean {
    // Native mobile platforms
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    
    // Enhanced web mobile detection for iOS Safari
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Additional iOS detection for devices that may not be caught by user agent
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check for touch capability as additional mobile indicator
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || isIOSDevice || (hasTouchScreen && window.innerWidth <= 1024);
  }

  /**
   * Initialize the step counter with device permissions
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing step counter...');
      console.log('Platform info:', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        userAgent: navigator.userAgent,
        hasDeviceMotion: typeof DeviceMotionEvent !== 'undefined'
      });

      // Check if running on PC for development/testing
      if (this.isPCEnvironment()) {
        console.log('🖥️ PC environment detected, using step counter simulator');
        return await stepCounterSimulator.initialize();
      }

      // Check if running on mobile device
      if (this.isMobileEnvironment()) {
        console.log('📱 Mobile environment detected, using mobile step counter');
        return await mobileStepCounter.initialize();
      }

      // Fallback for unsupported platforms
      console.warn('⚠️ Unsupported platform for step counting');
      return false;

      // Request motion permissions if on native platform
      if (Capacitor.isNativePlatform()) {
        try {
          // Capacitor Motion doesn't require explicit permission request
          this.permissionGranted = true;
        } catch (error) {
          console.error('Motion permission denied:', error);
          return false;
        }
      } else {
        // For web, check if DeviceMotionEvent is supported
        if (typeof DeviceMotionEvent !== 'undefined') {
          // Request permission for iOS 13+ Safari
          if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            const permission = await (DeviceMotionEvent as any).requestPermission();
            this.permissionGranted = permission === 'granted';
          } else {
            this.permissionGranted = true;
          }
        }
      }

      // Calibrate step detection for device
      await this.calibrateStepDetection();
      
      return this.permissionGranted;
    } catch (error) {
      console.error('Step counter initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if motion API is supported in browser
   */
  private isMotionAPISupported(): boolean {
    return typeof DeviceMotionEvent !== 'undefined' && 
           typeof DeviceOrientationEvent !== 'undefined';
  }

  /**
   * Calibrate step detection based on device characteristics
   */
  private async calibrateStepDetection(): Promise<void> {
    try {
      const deviceInfo = await Device.getInfo();
      
      // Adjust thresholds based on device platform
      if (deviceInfo.platform === 'ios') {
        this.stepThreshold = 1.1;
        this.peakThreshold = 10.2;
        this.valleyThreshold = 9.8;
      } else if (deviceInfo.platform === 'android') {
        this.stepThreshold = 1.3;
        this.peakThreshold = 10.7;
        this.valleyThreshold = 9.3;
      } else {
        // Web platform - more conservative settings
        this.stepThreshold = 1.4;
        this.peakThreshold = 11.0;
        this.valleyThreshold = 9.0;
      }
      
      console.log(`Step counter calibrated for ${deviceInfo.platform}`);
    } catch (error) {
      console.error('Calibration failed:', error);
    }
  }

  /**
   * Start step counting
   */
  async startCounting(): Promise<boolean> {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      return await stepCounterSimulator.startCounting();
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      return await mobileStepCounter.startCounting();
    }

    if (this.isRunning) {
      return true;
    }

    if (!this.permissionGranted) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      this.isRunning = true;
      this.sessionStartTime = Date.now();
      
      // Start listening to accelerometer
      if (Capacitor.isNativePlatform()) {
        await this.startNativeStepCounting();
      } else {
        await this.startWebStepCounting();
      }

      console.log('Step counter started');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to start step counting:', error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Start step counting on native platforms using Capacitor Motion
   */
  private async startNativeStepCounting(): Promise<void> {
    // Listen to accelerometer events
    await Motion.addListener('accel', (event: any) => {
      if (!this.isRunning) return;

      const data: AccelerometerData = {
        x: event.accelerationIncludingGravity?.x || 0,
        y: event.accelerationIncludingGravity?.y || 0,
        z: event.accelerationIncludingGravity?.z || 0,
        timestamp: Date.now()
      };

      this.processAccelerometerData(data);
    });

    // Start accelerometer monitoring
    // Note: Capacitor Motion API may not have startAccel method
    // We'll rely on the listener being active
  }

  /**
   * Start step counting on web platforms using DeviceMotionEvent
   */
  private async startWebStepCounting(): Promise<void> {
    if (typeof DeviceMotionEvent === 'undefined') {
      throw new Error('DeviceMotionEvent not supported');
    }

    this.webMotionHandler = (event: DeviceMotionEvent) => {
      if (!this.isRunning || !event.accelerationIncludingGravity) return;

      const data: AccelerometerData = {
        x: event.accelerationIncludingGravity.x || 0,
        y: event.accelerationIncludingGravity.y || 0,
        z: event.accelerationIncludingGravity.z || 0,
        timestamp: Date.now()
      };

      this.processAccelerometerData(data);
    };

    window.addEventListener('devicemotion', this.webMotionHandler);
  }

  /**
   * Process accelerometer data for step detection
   */
  private processAccelerometerData(data: AccelerometerData): void {
    // Add to buffer
    this.accelerometerBuffer.push(data);
    if (this.accelerometerBuffer.length > this.bufferSize) {
      this.accelerometerBuffer.shift();
    }

    // Calculate magnitude of acceleration vector
    const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // Apply smoothing filter
    const smoothedMagnitude = this.applySmoothingFilter(magnitude);
    
    // Detect steps using peak and valley detection
    this.detectStep(smoothedMagnitude, data.timestamp);
  }

  /**
   * Apply smoothing filter to reduce noise
   */
  private applySmoothingFilter(magnitude: number): number {
    if (this.accelerometerBuffer.length < 3) {
      return magnitude;
    }

    // Simple moving average of last 3 readings
    const recentMagnitudes = this.accelerometerBuffer
      .slice(-3)
      .map(data => Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z));
    
    return recentMagnitudes.reduce((sum, val) => sum + val, 0) / recentMagnitudes.length;
  }

  /**
   * Detect steps using improved peak-valley algorithm
   */
  private detectStep(magnitude: number, timestamp: number): void {
    // Dynamic threshold adjustment
    if (this.dynamicThreshold && this.accelerometerBuffer.length >= this.bufferSize) {
      this.adjustDynamicThresholds();
    }

    // Peak detection
    if (!this.isWaitingForValley && magnitude > this.peakThreshold) {
      this.lastPeak = magnitude;
      this.isWaitingForValley = true;
    }
    
    // Valley detection and step counting
    if (this.isWaitingForValley && magnitude < this.valleyThreshold) {
      const timeSinceLastStep = timestamp - this.lastStepTime;
      
      // Check if enough time has passed and we have a significant peak-valley difference
      if (timeSinceLastStep > this.minStepInterval && 
          (this.lastPeak - magnitude) > this.stepThreshold) {
        
        this.stepCount++;
        this.lastStepTime = timestamp;
        this.isWaitingForValley = false;
        
        // Save step count periodically
        this.saveStepData();
        this.notifyListeners();
        
        console.log(`Step detected! Total: ${this.stepCount}`);
      }
    }
  }

  /**
   * Dynamically adjust thresholds based on recent activity
   */
  private adjustDynamicThresholds(): void {
    const recentMagnitudes = this.accelerometerBuffer
      .map(data => Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z));
    
    const avg = recentMagnitudes.reduce((sum, val) => sum + val, 0) / recentMagnitudes.length;
    const variance = recentMagnitudes.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recentMagnitudes.length;
    const stdDev = Math.sqrt(variance);
    
    // Adjust thresholds based on activity level
    this.peakThreshold = avg + stdDev * 0.5;
    this.valleyThreshold = avg - stdDev * 0.5;
  }

  /**
   * Stop step counting
   */
  async stopCounting(): Promise<void> {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      return await stepCounterSimulator.stopCounting();
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      return await mobileStepCounter.stopCounting();
    }

    if (!this.isRunning) return;

    try {
      this.isRunning = false;
      
      if (Capacitor.isNativePlatform()) {
        await Motion.removeAllListeners();
      } else {
        // Remove web event listeners
        if (this.webMotionHandler) {
          window.removeEventListener('devicemotion', this.webMotionHandler);
          this.webMotionHandler = null;
        }
      }

      await this.saveStepData();
      console.log('Step counter stopped');
    } catch (error) {
      console.error('Error stopping step counter:', error);
    }
  }

  /**
   * Get current step count data
   */
  getStepData(): StepCounterData {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      const simData = stepCounterSimulator.getStepData();
      return {
        steps: simData.steps,
        startTime: simData.startTime,
        lastUpdate: simData.lastUpdate,
        isActive: simData.isActive,
        calibrated: true
      };
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      const mobileData = mobileStepCounter.getStepData();
      return {
        steps: mobileData.steps,
        startTime: mobileData.startTime,
        lastUpdate: mobileData.lastUpdate,
        isActive: mobileData.isActive,
        calibrated: mobileData.hasPermission
      };
    }

    return {
      steps: this.stepCount,
      startTime: this.sessionStartTime,
      lastUpdate: Date.now(),
      isActive: this.isRunning,
      calibrated: this.permissionGranted
    };
  }

  /**
   * Reset step count
   */
  async resetStepCount(): Promise<void> {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      return await stepCounterSimulator.resetStepCount();
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      return await mobileStepCounter.resetStepCount();
    }

    this.stepCount = 0;
    this.sessionStartTime = Date.now();
    await this.saveStepData();
    this.notifyListeners();
  }

  /**
   * Add listener for step count updates
   */
  addListener(callback: (data: StepCounterData) => void): void {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      stepCounterSimulator.addListener((simData) => {
        callback({
          steps: simData.steps,
          startTime: simData.startTime,
          lastUpdate: simData.lastUpdate,
          isActive: simData.isActive,
          calibrated: true
        });
      });
      return;
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      mobileStepCounter.addListener((mobileData) => {
        callback({
          steps: mobileData.steps,
          startTime: mobileData.startTime,
          lastUpdate: mobileData.lastUpdate,
          isActive: mobileData.isActive,
          calibrated: mobileData.hasPermission
        });
      });
      return;
    }

    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (data: StepCounterData) => void): void {
    // Use simulator on PC
    if (this.isPCEnvironment()) {
      // For simplicity in PC mode, we'll handle this in the simulator
      return;
    }

    // Use mobile counter on mobile devices
    if (this.isMobileEnvironment()) {
      // For simplicity in mobile mode, we'll handle this in the mobile counter
      return;
    }

    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of step count changes
   */
  private notifyListeners(): void {
    const data = this.getStepData();
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying step counter listener:', error);
      }
    });
  }

  /**
   * Save step data to device storage
   */
  private async saveStepData(): Promise<void> {
    try {
      const data = this.getStepData();
      await Preferences.set({
        key: 'stepCounterData',
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to save step data:', error);
    }
  }

  /**
   * Load stored step data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'stepCounterData' });
      if (value) {
        const data: StepCounterData = JSON.parse(value);
        
        // Check if data is from today
        const today = new Date().toDateString();
        const dataDate = new Date(data.startTime).toDateString();
        
        if (today === dataDate) {
          this.stepCount = data.steps;
          this.sessionStartTime = data.startTime;
        } else {
          // Reset for new day
          await this.resetStepCount();
        }
      }
    } catch (error) {
      console.error('Failed to load stored step data:', error);
    }
  }
}

// Export singleton instance
export const stepCounter = new StepCounterService();

// Export types and service class
export { StepCounterService };
