import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Monitor, 
  Keyboard, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Activity, 
  Timer, 
  Footprints,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { stepCounterSimulator, SimulatedStepData } from '@/lib/stepCounterSimulator';
import { cn } from '@/lib/utils';

export default function PCStepCounterTesting() {
  const [stepData, setStepData] = useState<SimulatedStepData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoWalkEnabled, setAutoWalkEnabled] = useState(false);
  const [walkingSpeed, setWalkingSpeed] = useState<'slow' | 'normal' | 'fast' | 'running'>('normal');
  const [simulationDuration, setSimulationDuration] = useState(5);
  const [manualSteps, setManualSteps] = useState(10);

  useEffect(() => {
    const initSimulator = async () => {
      await stepCounterSimulator.initialize();
      setIsInitialized(true);
      
      // Set up listener for step updates
      const handleStepUpdate = (data: SimulatedStepData) => {
        setStepData({ ...data });
      };
      
      stepCounterSimulator.addListener(handleStepUpdate);
      
      // Get initial data
      setStepData(stepCounterSimulator.getStepData());
      
      return () => {
        stepCounterSimulator.removeListener(handleStepUpdate);
        stepCounterSimulator.cleanup();
      };
    };

    initSimulator();
  }, []);

  const handleStart = async () => {
    await stepCounterSimulator.startCounting();
  };

  const handleStop = async () => {
    await stepCounterSimulator.stopCounting();
    setAutoWalkEnabled(false);
  };

  const handleReset = async () => {
    await stepCounterSimulator.resetStepCount();
  };

  const handleManualSteps = () => {
    // Simulate adding manual steps (equivalent to pressing spacebar multiple times)
    for (let i = 0; i < manualSteps; i++) {
      setTimeout(() => {
        // Simulate keypress
        const event = new KeyboardEvent('keydown', { key: ' ' });
        document.dispatchEvent(event);
      }, i * 50); // Stagger the steps
    }
  };

  const handleSimulateWalk = () => {
    stepCounterSimulator.simulateWalkingSession(simulationDuration, walkingSpeed);
  };

  const handleToggleAutoWalk = () => {
    // Simulate 'A' key press to toggle auto-walk
    const event = new KeyboardEvent('keydown', { key: 'A' });
    document.dispatchEvent(event);
    setAutoWalkEnabled(!autoWalkEnabled);
  };

  const getSpeedInfo = () => {
    const speeds = {
      slow: { steps: 50, emoji: '🐌', label: 'ゆっくり歩き' },
      normal: { steps: 75, emoji: '🚶', label: '普通の歩き' },
      fast: { steps: 100, emoji: '🚶‍♂️', label: '早歩き' },
      running: { steps: 150, emoji: '🏃', label: 'ランニング' }
    };
    return speeds[walkingSpeed];
  };

  const calculateCalories = () => {
    if (!stepData) return 0;
    return Math.round(stepData.steps * 0.045);
  };

  const calculateDistance = () => {
    if (!stepData) return 0;
    return Math.round(stepData.steps * 0.75); // meters
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-6 h-6 text-blue-600" />
            PC歩数カウンターテスト環境
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            PCでの開発・テスト用の歩数カウンターシミュレーター
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Stats */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stepData?.steps || 0}
              </div>
              <div className="text-sm text-muted-foreground">歩数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {calculateCalories()}
              </div>
              <div className="text-sm text-muted-foreground">カロリー</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {(calculateDistance() / 1000).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">距離 (km)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              基本操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleStart}
                disabled={!isInitialized || stepData?.isActive}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                開始
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isInitialized || !stepData?.isActive}
                variant="outline"
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                停止
              </Button>
              <Button
                onClick={handleReset}
                disabled={!isInitialized}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className={cn(
                  "w-4 h-4",
                  stepData?.isActive ? "text-green-600" : "text-gray-400"
                )} />
                <span className="text-sm font-medium">
                  {stepData?.isActive ? '計測中' : '停止中'}
                </span>
                {stepData?.isSimulated && (
                  <Badge variant="outline" className="text-xs">
                    シミュレーション
                  </Badge>
                )}
              </div>
              {stepData && stepData.sessionTime > 0 && (
                <div className="text-xs text-muted-foreground">
                  セッション時間: {Math.round(stepData.sessionTime)} 分 | 
                  平均: {Math.round(stepData.averageStepsPerMinute)} 歩/分
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              キーボード操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">SPACE</kbd>
                <span>1歩追加</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ENTER</kbd>
                <span>10歩追加</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd>
                <span>自動歩行</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd>
                <span>リセット</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd>
                <span>速度調整</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">D</kbd>
                <span>100歩追加</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 このページにフォーカスがある状態でキーボードショートカットが使用できます
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              手動操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">手動で歩数を追加</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(Number(e.target.value))}
                  min="1"
                  max="1000"
                  className="flex-1"
                />
                <Button onClick={handleManualSteps} disabled={!stepData?.isActive}>
                  <Footprints className="w-4 h-4 mr-2" />
                  追加
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">自動歩行</label>
                <Button
                  onClick={handleToggleAutoWalk}
                  disabled={!stepData?.isActive}
                  variant={autoWalkEnabled ? "default" : "outline"}
                  size="sm"
                >
                  {autoWalkEnabled ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      開始
                    </>
                  )}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {getSpeedInfo().emoji} {getSpeedInfo().label} - {getSpeedInfo().steps}歩/分
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              シミュレーション実行
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">歩行時間（分）</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[simulationDuration]}
                  onValueChange={(value) => setSimulationDuration(value[0])}
                  max={30}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{simulationDuration}分</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">歩行ペース</label>
              <div className="grid grid-cols-2 gap-2">
                {(['slow', 'normal', 'fast', 'running'] as const).map((speed) => (
                  <Button
                    key={speed}
                    onClick={() => setWalkingSpeed(speed)}
                    variant={walkingSpeed === speed ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {getSpeedInfo().emoji} {speed === walkingSpeed ? getSpeedInfo().label : speed}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSimulateWalk}
              disabled={!stepData?.isActive}
              className="w-full"
            >
              <Timer className="w-4 h-4 mr-2" />
              {simulationDuration}分間の{getSpeedInfo().label}を実行
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              予想歩数: {Math.round(simulationDuration * getSpeedInfo().steps)} 歩
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            クイックテストシナリオ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => {
                stepCounterSimulator.simulateWalkingSession(10, 'normal');
              }}
              disabled={!stepData?.isActive}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <TrendingUp className="w-6 h-6 mb-2 text-blue-600" />
              <span className="font-medium">朝の散歩</span>
              <span className="text-xs text-muted-foreground">10分 • 750歩</span>
            </Button>

            <Button
              onClick={() => {
                stepCounterSimulator.simulateWalkingSession(30, 'fast');
              }}
              disabled={!stepData?.isActive}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Activity className="w-6 h-6 mb-2 text-green-600" />
              <span className="font-medium">ランチウォーク</span>
              <span className="text-xs text-muted-foreground">30分 • 3000歩</span>
            </Button>

            <Button
              onClick={() => {
                stepCounterSimulator.simulateWalkingSession(45, 'running');
              }}
              disabled={!stepData?.isActive}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Zap className="w-6 h-6 mb-2 text-orange-600" />
              <span className="font-medium">ジョギング</span>
              <span className="text-xs text-muted-foreground">45分 • 6750歩</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
