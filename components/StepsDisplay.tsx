import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Footprints, Flame, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStepCounterWithGoals } from '@/hooks/useStepCounter';

interface StepsDisplayProps {
  dailySteps?: number; // Fallback for compatibility
  stepsGoal?: number;  // Fallback for compatibility
  className?: string;
  enableRealTimeTracking?: boolean;
}

export default function StepsDisplay({ 
  dailySteps: fallbackSteps = 0, 
  stepsGoal: fallbackGoal = 10000,
  className,
  enableRealTimeTracking = true
}: StepsDisplayProps) {
  
  // Use real device step counter if enabled
  const {
    stepData,
    stats,
    isSupported,
    isInitialized,
    isLoading,
    error,
    startCounting,
    stopCounting,
    resetSteps
  } = useStepCounterWithGoals({
    dailyGoal: fallbackGoal,
    enableNotifications: true,
    autoStart: enableRealTimeTracking
  });

  // Determine which data to use
  const isUsingRealData = enableRealTimeTracking && isSupported && stepData;
  const dailySteps = isUsingRealData ? stepData.steps : fallbackSteps;
  const stepsGoal = fallbackGoal;
  const isActive = isUsingRealData ? stepData.isActive : false;
  
  // Calculate progress percentage
  const progress = stepsGoal > 0 ? Math.min((dailySteps / stepsGoal) * 100, 100) : 0;
  
  // Use stats if available, otherwise calculate manually
  const totalCaloriesBurned = stats ? stats.caloriesBurned : Math.round(dailySteps * 0.045);
  const caloriesPerStep = 0.045;
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  // Get badge color based on progress
  const getBadgeColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Handle control button clicks
  const handleStartStop = async () => {
    if (isActive) {
      await stopCounting();
    } else {
      await startCounting();
    }
  };

  const handleReset = async () => {
    if (confirm('歩数をリセットしますか？')) {
      await resetSteps();
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-blue-600" />
            歩数トラッカー
            {isUsingRealData && isActive && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          
          {/* Control buttons for real-time tracking */}
          {enableRealTimeTracking && isSupported && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartStop}
                disabled={isLoading}
                className="h-8 px-2"
              >
                {isActive ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
                className="h-8 px-2"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error or loading state */}
        {isLoading && enableRealTimeTracking && (
          <div className="text-center text-sm text-muted-foreground py-2">
            歩数カウンターを初期化中...
          </div>
        )}
        
        {error && enableRealTimeTracking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{error}</span>
            </div>
          </div>
        )}

        {!isSupported && enableRealTimeTracking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              このデバイスでは歩数の自動計測がサポートされていません。手動でデータを入力してください。
            </div>
          </div>
        )}

        {/* Device status indicator */}
        {enableRealTimeTracking && isSupported && (
          <div className="text-xs text-muted-foreground text-center">
            {isUsingRealData ? (
              <span className="flex items-center justify-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-green-500" : "bg-gray-400"
                )} />
                {isActive ? 'リアルタイム計測中' : '計測停止中'}
              </span>
            ) : (
              '手動モード'
            )}
          </div>
        )}

        {/* Main steps display */}
        <div className="text-center space-y-2">
          <div className={cn("text-3xl font-bold", getProgressColor(progress))}>
            {formatNumber(dailySteps)}
          </div>
          <div className="text-sm text-muted-foreground">
            目標: {formatNumber(stepsGoal)} 歩
          </div>
          
          {/* Progress badge */}
          <Badge className={cn("text-xs", getBadgeColor(progress))}>
            {progress.toFixed(1)}% 達成
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{formatNumber(stepsGoal)}</span>
          </div>
        </div>

        {/* Calories burned section */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">消費カロリー</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                {totalCaloriesBurned} cal
              </div>
              <div className="text-xs text-orange-600">
                1歩あたり {caloriesPerStep} cal
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced statistics from real device */}
        {stats && isUsingRealData && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-medium text-gray-900">{Math.round(stats.distanceWalked / 1000 * 100) / 100} km</div>
              <div className="text-xs text-gray-600">歩行距離</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-medium text-gray-900">{Math.round(stats.activeTime)} 分</div>
              <div className="text-xs text-gray-600">活動時間</div>
            </div>
          </div>
        )}

        {/* Activity level indicator */}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            活動レベル: {
              dailySteps >= 12000 ? '非常に活発' :
              dailySteps >= 10000 ? '活発' :
              dailySteps >= 7500 ? '普通' :
              dailySteps >= 5000 ? 'やや低い' : '低い'
            }
          </span>
        </div>

        {/* Motivational message */}
        {progress < 100 && (
          <div className="text-center text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2">
            あと {formatNumber(stepsGoal - dailySteps)} 歩で目標達成！
          </div>
        )}
        
        {progress >= 100 && (
          <div className="text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
            🎉 目標達成おめでとうございます！
          </div>
        )}
      </CardContent>
    </Card>
  );
}
