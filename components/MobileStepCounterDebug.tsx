import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Settings,
  Zap,
  Shield
} from 'lucide-react';
import { mobileStepCounter } from '@/lib/mobileStepCounter';
import { cn } from '@/lib/utils';

export default function MobileStepCounterDebug() {
  const [stepData, setStepData] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<string>('初期化中...');
  const [error, setError] = useState<string | null>(null);

  // Initialize mobile step counter
  useEffect(() => {
    const initMobile = async () => {
      try {
        setStatus('モバイル歩数カウンターを初期化中...');
        
        const success = await mobileStepCounter.initialize();
        setIsInitialized(success);
        
        if (success) {
          setStatus('初期化完了 - 歩数カウンター準備完了');
          
          // Add listener for updates
          const handleUpdate = (data: any) => {
            setStepData({ ...data });
          };
          
          mobileStepCounter.addListener(handleUpdate);
          
          // Get initial data
          setStepData(mobileStepCounter.getStepData());
          updateDiagnostics();
          
          return () => {
            mobileStepCounter.removeListener(handleUpdate);
          };
        } else {
          setStatus('初期化失敗 - デバイスまたは権限の問題');
          setError('歩数カウンターの初期化に失敗しました');
        }
      } catch (err) {
        console.error('Mobile step counter debug initialization error:', err);
        setStatus('エラーが発生しました');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initMobile();
  }, []);

  const updateDiagnostics = () => {
    const diag = mobileStepCounter.getDiagnostics();
    setDiagnostics(diag);
  };

  const handleStart = async () => {
    setStatus('歩数カウント開始中...');
    const success = await mobileStepCounter.startCounting();
    if (success) {
      setStatus('歩数カウント開始 - デバイスを持って歩いてください');
    } else {
      setStatus('歩数カウントの開始に失敗しました');
      setError('権限またはセンサーの問題');
    }
    updateDiagnostics();
  };

  const handleStop = async () => {
    setStatus('歩数カウント停止中...');
    await mobileStepCounter.stopCounting();
    setStatus('歩数カウント停止');
    updateDiagnostics();
  };

  const handleReset = async () => {
    await mobileStepCounter.resetStepCount();
    setStatus('歩数リセット完了');
    updateDiagnostics();
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (!isInitialized) return 'text-yellow-600';
    if (stepData?.isActive) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (!isInitialized) return <RefreshCw className="w-4 h-4 animate-spin text-yellow-600" />;
    if (stepData?.isActive) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Activity className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            モバイル歩数カウンターデバッグ
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            モバイルデバイスでの歩数カウンター動作確認とデバッグ
          </p>
        </CardHeader>
        <CardContent>
          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            {getStatusIcon()}
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {status}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800 font-medium">エラー</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Current Data */}
          {stepData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stepData.steps || 0}
                </div>
                <div className="text-sm text-muted-foreground">歩数</div>
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
                <div className="text-sm text-muted-foreground mt-1">状態</div>
              </div>
              <div className="text-center">
                <Badge className={cn(
                  "text-xs",
                  stepData.hasPermission 
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                )}>
                  {stepData.hasPermission ? '許可済み' : '未許可'}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">権限</div>
              </div>
              <div className="text-center">
                <Badge className={cn(
                  "text-xs",
                  stepData.deviceSupported 
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                )}>
                  {stepData.deviceSupported ? '対応' : '非対応'}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">デバイス</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              制御
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
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={updateDiagnostics}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              診断情報を更新
            </Button>

            {/* Sensor Type */}
            {stepData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    センサータイプ: {stepData.sensorType}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              診断情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">プラットフォーム:</span>
                    <span className="ml-2">{diagnostics.platform}</span>
                  </div>
                  <div>
                    <span className="font-medium">実行中:</span>
                    <span className="ml-2">{diagnostics.isRunning ? 'はい' : 'いいえ'}</span>
                  </div>
                  <div>
                    <span className="font-medium">権限:</span>
                    <span className="ml-2">{diagnostics.hasPermission ? 'あり' : 'なし'}</span>
                  </div>
                  <div>
                    <span className="font-medium">デバイス対応:</span>
                    <span className="ml-2">{diagnostics.deviceSupported ? 'はい' : 'いいえ'}</span>
                  </div>
                  <div>
                    <span className="font-medium">バッファサイズ:</span>
                    <span className="ml-2">{diagnostics.bufferSize}</span>
                  </div>
                  <div>
                    <span className="font-medium">閾値:</span>
                    <span className="ml-2">{diagnostics.stepThreshold}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                診断情報を読み込み中...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            トラブルシューティング
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ 正常な状態</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>権限: 許可済み</li>
                <li>デバイス: 対応</li>
                <li>状態: 計測中</li>
                <li>歩数: デバイスを持って歩くと増加</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-600 mb-2">❌ 問題がある場合</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><strong>権限未許可:</strong> ブラウザ設定でモーションセンサーを有効化</li>
                <li><strong>デバイス非対応:</strong> 加速度センサーが搭載されていない可能性</li>
                <li><strong>歩数が増えない:</strong> センサー感度の問題、デバイスを振ってテスト</li>
                <li><strong>初期化失敗:</strong> アプリを再起動してやり直し</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> iOSデバイスではHTTPS接続が必要です。
                ローカル開発時はHTTPSを使用してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
