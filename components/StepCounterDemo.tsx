import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { stepCounter } from '@/lib/stepCounter';
import { cn } from '@/lib/utils';

export default function StepCounterDemo() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [stepData, setStepData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<string>('初期化中...');

  useEffect(() => {
    const initDemo = async () => {
      try {
        setStatus('デバイス機能をチェック中...');
        const supported = await stepCounter.initialize();
        setIsSupported(supported);
        setIsInitialized(true);

        if (supported) {
          setStatus('歩数カウンター準備完了');
          
          // Add listener for step updates
          const handleStepUpdate = (data: any) => {
            setStepData({ ...data });
          };
          
          stepCounter.addListener(handleStepUpdate);
          
          // Get initial data
          setStepData(stepCounter.getStepData());
          
          return () => {
            stepCounter.removeListener(handleStepUpdate);
          };
        } else {
          setStatus('このデバイスでは歩数カウントがサポートされていません');
        }
      } catch (error) {
        console.error('Demo initialization error:', error);
        setStatus('初期化エラーが発生しました');
      }
    };

    initDemo();
  }, []);

  const handleStart = async () => {
    setStatus('歩数カウント開始中...');
    const success = await stepCounter.startCounting();
    if (success) {
      setStatus('歩数カウント中 - デバイスを持って歩いてください');
    } else {
      setStatus('歩数カウントの開始に失敗しました');
    }
  };

  const handleStop = async () => {
    setStatus('歩数カウント停止中...');
    await stepCounter.stopCounting();
    setStatus('歩数カウント停止');
  };

  const handleReset = async () => {
    await stepCounter.resetStepCount();
    setStatus('歩数リセット完了');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          デバイス歩数カウンターテスト
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Status */}
        <div className="flex items-center gap-2">
          {isSupported === null ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">チェック中...</span>
            </div>
          ) : isSupported ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">デバイス対応</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">デバイス非対応</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">{status}</p>
        </div>

        {/* Step Data */}
        {stepData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stepData.steps || 0}
              </div>
              <div className="text-xs text-gray-600">歩数</div>
            </div>
            <div className="text-center">
              <Badge className={cn(
                "text-xs",
                stepData.isActive 
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              )}>
                {stepData.isActive ? '計測中' : '停止中'}
              </Badge>
            </div>
          </div>
        )}

        {/* Controls */}
        {isSupported && (
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={!isInitialized || stepData?.isActive}
              size="sm"
              className="flex-1"
            >
              開始
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isInitialized || !stepData?.isActive}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              停止
            </Button>
            <Button
              onClick={handleReset}
              disabled={!isInitialized}
              variant="outline"
              size="sm"
            >
              リセット
            </Button>
          </div>
        )}

        {/* Instructions */}
        {isSupported && stepData?.isActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">テスト方法:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>デバイスを手に持つまたはポケットに入れる</li>
                  <li>普通に歩く（10歩程度）</li>
                  <li>歩数が自動的に増加するか確認</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
