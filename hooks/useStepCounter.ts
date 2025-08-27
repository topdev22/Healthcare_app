import { useState, useEffect, useCallback } from 'react';
import { stepCounter, StepCounterData } from '@/lib/stepCounter';

export interface UseStepCounterReturn {
  stepData: StepCounterData | null;
  isSupported: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  startCounting: () => Promise<boolean>;
  stopCounting: () => Promise<void>;
  resetSteps: () => Promise<void>;
  refresh: () => void;
}

export function useStepCounter(): UseStepCounterReturn {
  const [stepData, setStepData] = useState<StepCounterData | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          setError('このデバイスでは歩数カウントがサポートされていません');
        }
      } catch (err) {
        console.error('Step counter initialization error:', err);
        if (mounted) {
          setError('歩数カウンターの初期化に失敗しました');
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
    startCounting,
    stopCounting,
    resetSteps,
    refresh
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
