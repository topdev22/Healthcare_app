/**
 * Mobile Step Counter Implementation
 * Handles real device motion sensors with proper permissions and error handling
 */

import { Motion } from '@capacitor/motion';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export interface MobileStepData {
  steps: number;
  startTime: number;
  lastUpdate: number;
  isActive: boolean;
  hasPermission: boolean;
  deviceSupported: boolean;
  sensorType: 'accelerometer' | 'pedometer' | 'none';
}

export interface AccelerometerReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

class MobileStepCounterService {
  private isRunning = false;
  private stepCount = 0;
  private sessionStartTime = Date.now();
  private listeners: Array<(data: MobileStepData) => void> = [];
  private hasPermission = false;
  private deviceSupported = false;
  private sensorType: 'accelerometer' | 'pedometer' | 'none' = 'none';

  // Step detection algorithm parameters
  private accelerometerBuffer: AccelerometerReading[] = [];
  private bufferSize = 20;
  private stepThreshold = 1.2;
  private minStepInterval = 300; // ms between steps
  private lastStepTime = 0;
  private peakThreshold = 10.5;
  private valleyThreshold = 9.5;
  private lastPeak = 0;
  private isWaitingForValley = false;

  // Motion listener reference
  private motionListener: any = null;

  constructor() {
    this.loadStoredData();
  }

  /**
   * Initialize the mobile step counter with proper permissions
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing mobile step counter...');
      
      // Check device capabilities
      const deviceInfo = await Device.getInfo();
      console.log('📱 Device info:', deviceInfo);

      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        return await this.initializeWebMotion();
      }

      // Check for motion sensor availability
      const hasMotionSensors = await this.checkMotionSensorAvailability();
      if (!hasMotionSensors) {
        console.warn('❌ No motion sensors available on this device');
        this.deviceSupported = false;
        return false;
      }

      this.deviceSupported = true;
      this.sensorType = 'accelerometer';

      // Request permissions
      const permissionGranted = await this.requestMotionPermissions();
      if (!permissionGranted) {
        console.warn('❌ Motion permissions denied');
        return false;
      }

      this.hasPermission = true;

      // Calibrate for device type
      await this.calibrateForDevice(deviceInfo);

      console.log('✅ Mobile step counter initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Mobile step counter initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize web-based motion detection
   */
  private async initializeWebMotion(): Promise<boolean> {
    try {
      // Check if DeviceMotionEvent is supported
      if (typeof DeviceMotionEvent === 'undefined') {
        console.warn('❌ DeviceMotionEvent not supported');
        return false;
      }

      // Request permission for iOS 13+ Safari
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          this.hasPermission = permission === 'granted';
          
          if (!this.hasPermission) {
            console.warn('❌ DeviceMotionEvent permission denied');
            return false;
          }
        } catch (error) {
          console.error('❌ Error requesting DeviceMotionEvent permission:', error);
          return false;
        }
      } else {
        this.hasPermission = true;
      }

      this.deviceSupported = true;
      this.sensorType = 'accelerometer';
      
      console.log('✅ Web motion API initialized');
      return true;

    } catch (error) {
      console.error('❌ Web motion initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if device has motion sensors
   */
  private async checkMotionSensorAvailability(): Promise<boolean> {
    try {
      // Try to add a temporary listener to check if sensors work
      const testListener = await Motion.addListener('accel', () => {});
      await Motion.removeAllListeners();
      
      return true;
    } catch (error) {
      console.warn('Motion sensors not available:', error);
      return false;
    }
  }

  /**
   * Request motion permissions for mobile devices
   */
  private async requestMotionPermissions(): Promise<boolean> {
    try {
      const deviceInfo = await Device.getInfo();
      
      // iOS requires explicit permission request
      if (deviceInfo.platform === 'ios') {
        // Permission is handled at the web layer for iOS
        return true;
      }

      // Android permissions are handled via manifest
      return true;
      
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Calibrate step detection parameters for specific device
   */
  private async calibrateForDevice(deviceInfo: any): Promise<void> {
    try {
      console.log('🎯 Calibrating for device:', deviceInfo.platform);
      
      switch (deviceInfo.platform) {
        case 'ios':
          this.stepThreshold = 1.1;
          this.peakThreshold = 10.2;
          this.valleyThreshold = 9.8;
          this.minStepInterval = 250;
          break;
          
        case 'android':
          this.stepThreshold = 1.3;
          this.peakThreshold = 10.7;
          this.valleyThreshold = 9.3;
          this.minStepInterval = 300;
          break;
          
        default:
          // Default web settings
          this.stepThreshold = 1.4;
          this.peakThreshold = 11.0;
          this.valleyThreshold = 9.0;
          this.minStepInterval = 350;
      }
      
      console.log('✅ Calibration complete for', deviceInfo.platform);
    } catch (error) {
      console.error('Calibration failed:', error);
    }
  }

  /**
   * Start step counting
   */
  async startCounting(): Promise<boolean> {
    if (this.isRunning) {
      console.log('⚠️ Step counting already running');
      return true;
    }

    if (!this.hasPermission || !this.deviceSupported) {
      console.warn('❌ Cannot start: missing permissions or device support');
      return false;
    }

    try {
      console.log('▶️ Starting step counting...');
      
      this.isRunning = true;
      this.sessionStartTime = Date.now();

      if (Capacitor.isNativePlatform()) {
        await this.startNativeMotionDetection();
      } else {
        await this.startWebMotionDetection();
      }

      console.log('✅ Step counting started successfully');
      this.notifyListeners();
      return true;

    } catch (error) {
      console.error('❌ Failed to start step counting:', error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Start native motion detection using Capacitor Motion
   */
  private async startNativeMotionDetection(): Promise<void> {
    try {
      // Add motion listener
      this.motionListener = await Motion.addListener('accel', (event) => {
        if (!this.isRunning) return;

        const reading: AccelerometerReading = {
          x: event.accelerationIncludingGravity?.x || 0,
          y: event.accelerationIncludingGravity?.y || 0,
          z: event.accelerationIncludingGravity?.z || 0,
          timestamp: Date.now()
        };

        this.processAccelerometerReading(reading);
      });

      console.log('✅ Native motion detection started');
    } catch (error) {
      console.error('❌ Failed to start native motion detection:', error);
      throw error;
    }
  }

  /**
   * Start web motion detection using DeviceMotionEvent
   */
  private async startWebMotionDetection(): Promise<void> {
    try {
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        if (!this.isRunning || !event.accelerationIncludingGravity) return;

        const reading: AccelerometerReading = {
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0,
          z: event.accelerationIncludingGravity.z || 0,
          timestamp: Date.now()
        };

        this.processAccelerometerReading(reading);
      };

      window.addEventListener('devicemotion', handleDeviceMotion);
      this.motionListener = handleDeviceMotion;

      console.log('✅ Web motion detection started');
    } catch (error) {
      console.error('❌ Failed to start web motion detection:', error);
      throw error;
    }
  }

  /**
   * Process accelerometer reading for step detection
   */
  private processAccelerometerReading(reading: AccelerometerReading): void {
    // Add to buffer
    this.accelerometerBuffer.push(reading);
    if (this.accelerometerBuffer.length > this.bufferSize) {
      this.accelerometerBuffer.shift();
    }

    // Calculate magnitude
    const magnitude = Math.sqrt(
      reading.x * reading.x + 
      reading.y * reading.y + 
      reading.z * reading.z
    );

    // Apply smoothing
    const smoothedMagnitude = this.applySmoothingFilter();
    
    // Detect steps
    this.detectStep(smoothedMagnitude, reading.timestamp);
  }

  /**
   * Apply smoothing filter to reduce noise
   */
  private applySmoothingFilter(): number {
    if (this.accelerometerBuffer.length < 3) {
      return 0;
    }

    // Calculate magnitudes for last 3 readings
    const magnitudes = this.accelerometerBuffer
      .slice(-3)
      .map(reading => Math.sqrt(
        reading.x * reading.x + 
        reading.y * reading.y + 
        reading.z * reading.z
      ));

    // Return moving average
    return magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
  }

  /**
   * Detect steps using peak-valley algorithm
   */
  private detectStep(magnitude: number, timestamp: number): void {
    // Peak detection
    if (!this.isWaitingForValley && magnitude > this.peakThreshold) {
      this.lastPeak = magnitude;
      this.isWaitingForValley = true;
    }
    
    // Valley detection and step counting
    if (this.isWaitingForValley && magnitude < this.valleyThreshold) {
      const timeSinceLastStep = timestamp - this.lastStepTime;
      const peakValleyDiff = this.lastPeak - magnitude;
      
      // Validate step
      if (timeSinceLastStep > this.minStepInterval && 
          peakValleyDiff > this.stepThreshold) {
        
        this.recordStep(timestamp);
      }
    }
  }

  /**
   * Record a detected step
   */
  private recordStep(timestamp: number): void {
    this.stepCount++;
    this.lastStepTime = timestamp;
    this.isWaitingForValley = false;
    
    console.log(`👟 Step detected! Total: ${this.stepCount}`);
    
    // Save and notify
    this.saveStepData();
    this.notifyListeners();
  }

  /**
   * Stop step counting
   */
  async stopCounting(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('⏹️ Stopping step counting...');
      
      this.isRunning = false;

      // Remove listeners
      if (Capacitor.isNativePlatform()) {
        await Motion.removeAllListeners();
      } else {
        if (this.motionListener) {
          window.removeEventListener('devicemotion', this.motionListener);
          this.motionListener = null;
        }
      }

      await this.saveStepData();
      console.log('✅ Step counting stopped');
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Error stopping step counting:', error);
    }
  }

  /**
   * Reset step count
   */
  async resetStepCount(): Promise<void> {
    console.log('🔄 Resetting step count...');
    
    this.stepCount = 0;
    this.sessionStartTime = Date.now();
    this.accelerometerBuffer = [];
    this.lastStepTime = 0;
    this.isWaitingForValley = false;
    
    await this.saveStepData();
    this.notifyListeners();
    
    console.log('✅ Step count reset');
  }

  /**
   * Get current step data
   */
  getStepData(): MobileStepData {
    return {
      steps: this.stepCount,
      startTime: this.sessionStartTime,
      lastUpdate: Date.now(),
      isActive: this.isRunning,
      hasPermission: this.hasPermission,
      deviceSupported: this.deviceSupported,
      sensorType: this.sensorType
    };
  }

  /**
   * Add listener for step updates
   */
  addListener(callback: (data: MobileStepData) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (data: MobileStepData) => void): void {
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
        console.error('Error notifying listener:', error);
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
        key: 'mobileStepData',
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
      const { value } = await Preferences.get({ key: 'mobileStepData' });
      if (value) {
        const data: MobileStepData = JSON.parse(value);
        
        // Check if data is from today
        const today = new Date().toDateString();
        const dataDate = new Date(data.startTime).toDateString();
        
        if (today === dataDate) {
          this.stepCount = data.steps;
          this.sessionStartTime = data.startTime;
          console.log('📂 Loaded stored step data:', data.steps, 'steps');
        } else {
          console.log('🗓️ New day detected, resetting step count');
          await this.resetStepCount();
        }
      }
    } catch (error) {
      console.error('Failed to load stored step data:', error);
    }
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics() {
    return {
      isRunning: this.isRunning,
      hasPermission: this.hasPermission,
      deviceSupported: this.deviceSupported,
      sensorType: this.sensorType,
      stepCount: this.stepCount,
      bufferSize: this.accelerometerBuffer.length,
      stepThreshold: this.stepThreshold,
      minStepInterval: this.minStepInterval,
      platform: Capacitor.getPlatform()
    };
  }
}

// Export singleton instance
export const mobileStepCounter = new MobileStepCounterService();

export { MobileStepCounterService };
