import { useState, useEffect, useCallback } from 'react';
import { stepCounter, StepCounterData } from '@/lib/stepCounter';

export interface UseStepCounterReturn {
  stepData: StepCounterData | null;
  isSupported: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  needsPermission: boolean;
  isIOSDevice: boolean;
  startCounting: () => Promise<boolean>;
  stopCounting: () => Promise<void>;
  resetSteps: () => Promise<void>;
  refresh: () => void;
  requestPermissions: () => Promise<boolean>;
}

export function useStepCounter(): UseStepCounterReturn {
  const [stepData, setStepData] = useState<StepCounterData | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [isIOSDevice, setIsIOSDevice] = useState<boolean>(false);

  // Detect iOS device
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOSDevice(isIOS);
  }, []);

  // Initialize step counter on mount
  useEffect(() => {
    let mounted = true;

    const initializeStepCounter = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if step counting is supported
        const supported = await stepCounter.initialize();
        
        if (!mounted) return;

        setIsSupported(supported);
        setIsInitialized(supported);

        if (supported) {
          // Get initial step data
          const initialData = stepCounter.getStepData();
          setStepData(initialData);

          // Set up listener for step updates
          const handleStepUpdate = (data: StepCounterData) => {
            if (mounted) {
              setStepData({ ...data });
            }
          };

          stepCounter.addListener(handleStepUpdate);

          // Start counting if not already running
          if (!initialData.isActive) {
            const started = await stepCounter.startCounting();
            if (!started && mounted) {
              setError('歩数カウントを開始できませんでした');
            }
          }

          // Cleanup listener on unmount
          return () => {
            stepCounter.removeListener(handleStepUpdate);
          };
        } else {
          if (isIOSDevice && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            setError('歩数カウントには動作センサーへのアクセス許可が必要です。「許可をリクエスト」ボタンをタップしてください。');
            setNeedsPermission(true);
          } else {
            setError('このデバイスでは歩数カウントがサポートされていません');
          }
        }
      } catch (err) {
        console.error('Step counter initialization error:', err);
        if (mounted) {
          if (isIOSDevice && err instanceof Error && err.message.includes('permission')) {
            setError('動作センサーへのアクセス許可が拒否されました。設定 > Safari > モーションとオリエンテーションのアクセス を有効にしてください。');
            setNeedsPermission(true);
          } else {
            setError('歩数カウンターの初期化に失敗しました');
          }
          setIsSupported(false);
          setIsInitialized(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeStepCounter();

    return () => {
      mounted = false;
    };
  }, []);

  // Start step counting
  const startCounting = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      setError('歩数カウンターが初期化されていません');
      return false;
    }

    try {
      setError(null);
      const success = await stepCounter.startCounting();
      
      if (!success) {
        setError('歩数カウントの開始に失敗しました');
      } else {
        // Update step data
        setStepData(stepCounter.getStepData());
      }
      
      return success;
    } catch (err) {
      console.error('Error starting step counter:', err);
      setError('歩数カウントの開始中にエラーが発生しました');
      return false;
    }
  }, [isInitialized]);

  // Stop step counting
  const stopCounting = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      return;
    }

    try {
      setError(null);
      await stepCounter.stopCounting();
      
      // Update step data
      setStepData(stepCounter.getStepData());
    } catch (err) {
      console.error('Error stopping step counter:', err);
      setError('歩数カウントの停止中にエラーが発生しました');
    }
  }, [isInitialized]);

  // Reset step count
  const resetSteps = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      return;
    }

    try {
      setError(null);
      await stepCounter.resetStepCount();
      
      // Update step data
      setStepData(stepCounter.getStepData());
    } catch (err) {
      console.error('Error resetting step counter:', err);
      setError('歩数リセット中にエラーが発生しました');
    }
  }, [isInitialized]);

  // Request permissions (for iOS)
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isIOSDevice) {
      return true; // Non-iOS devices don't need explicit permission
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Try to initialize again with permission request
      const success = await stepCounter.initialize();
      
      if (success) {
        setIsSupported(true);
        setIsInitialized(true);
        setNeedsPermission(false);
        
        // Get initial step data
        const initialData = stepCounter.getStepData();
        setStepData(initialData);
        
        return true;
      } else {
        setError('動作センサーへのアクセス許可が必要です。設定 > Safari > モーションとオリエンテーションのアクセス を有効にしてください。');
        setNeedsPermission(true);
        return false;
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setError('許可のリクエストに失敗しました。設定から手動で有効にしてください。');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isIOSDevice]);

  // Refresh step data
  const refresh = useCallback(() => {
    if (isInitialized) {
      setStepData(stepCounter.getStepData());
    }
  }, [isInitialized]);

  return {
    stepData,
    isSupported,
    isInitialized,
    isLoading,
    error,
    needsPermission,
    isIOSDevice,
    startCounting,
    stopCounting,
    resetSteps,
    refresh,
    requestPermissions
  };
}

// Enhanced hook with additional features
export interface UseStepCounterWithGoalsOptions {
  dailyGoal?: number;
  enableNotifications?: boolean;
  autoStart?: boolean;
}

export interface StepCounterStats {
  dailySteps: number;
  goalProgress: number;
  goalReached: boolean;
  caloriesBurned: number;
  distanceWalked: number; // in meters
  activeTime: number; // in minutes
  averageStepsPerMinute: number;
}

export function useStepCounterWithGoals(
  options: UseStepCounterWithGoalsOptions = {}
): UseStepCounterReturn & { stats: StepCounterStats | null } {
  const {
    dailyGoal = 10000,
    enableNotifications = false,
    autoStart = true
  } = options;

  const stepCounterHook = useStepCounter();
  const [stats, setStats] = useState<StepCounterStats | null>(null);

  // Calculate enhanced statistics
  useEffect(() => {
    if (!stepCounterHook.stepData) {
      setStats(null);
      return;
    }

    const { steps, startTime, lastUpdate } = stepCounterHook.stepData;
    
    // Calculate statistics
    const goalProgress = Math.min((steps / dailyGoal) * 100, 100);
    const goalReached = steps >= dailyGoal;
    
    // Estimate calories burned (0.04-0.05 calories per step for average person)
    const caloriesBurned = Math.round(steps * 0.045);
    
    // Estimate distance (average step length: 0.7-0.8 meters)
    const distanceWalked = Math.round(steps * 0.75); // in meters
    
    // Calculate active time
    const totalTime = (lastUpdate - startTime) / (1000 * 60); // in minutes
    const activeTime = Math.max(totalTime, 0);
    
    // Calculate average steps per minute
    const averageStepsPerMinute = activeTime > 0 ? steps / activeTime : 0;

    const newStats: StepCounterStats = {
      dailySteps: steps,
      goalProgress,
      goalReached,
      caloriesBurned,
      distanceWalked,
      activeTime,
      averageStepsPerMinute
    };

    setStats(newStats);

    // Show notification when goal is reached
    if (enableNotifications && goalReached && !stepCounterHook.stepData?.isActive) {
      // You can implement notification logic here
      console.log('🎉 Daily step goal reached!');
    }
  }, [stepCounterHook.stepData, dailyGoal, enableNotifications]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && stepCounterHook.isInitialized && stepCounterHook.stepData && !stepCounterHook.stepData.isActive) {
      stepCounterHook.startCounting();
    }
  }, [autoStart, stepCounterHook.isInitialized, stepCounterHook.stepData, stepCounterHook.startCounting]);

  return {
    ...stepCounterHook,
    stats
  };
}
