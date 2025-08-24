import React from 'react';
import { ArrowLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PCStepCounterTesting from '@/components/PCStepCounterTesting';

export default function PCTesting() {
  const handleBack = () => {
    window.close();
    // Fallback if window.close() doesn't work
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  PC歩数カウンターテスト環境
                </h1>
                <p className="text-sm text-gray-600">
                  開発・デバッグ用の歩数カウンターシミュレーター
                </p>
              </div>
            </div>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </div>
        </div>

        {/* Testing Interface */}
        <PCStepCounterTesting />

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">📖 使用方法</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-600 mb-2">✅ 基本テスト手順</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>「開始」ボタンをクリックして計測を開始</li>
                <li>キーボードのSPACEキーを押して歩数を追加</li>
                <li>歩数、カロリー、距離が正しく表示されることを確認</li>
                <li>「自動歩行」ボタンで連続的な歩数追加をテスト</li>
                <li>各種シミュレーションで長時間の動作をテスト</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-blue-600 mb-2">🎮 キーボードショートカット</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">SPACE</kbd> - 1歩追加</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ENTER</kbd> - 10歩追加（ジョギング）</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">D</kbd> - 100歩追加（デバッグ）</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd> - 自動歩行オン/オフ</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd> - 歩行速度調整</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd> - リセット</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">S</kbd> - 開始/停止</div>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">🔧 開発者向け情報</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• この画面はPC環境でのみ表示されます</p>
            <p>• 実際のモバイルデバイスでは実際のセンサーが使用されます</p>
            <p>• シミュレーターデータはブラウザのローカルストレージに保存されます</p>
            <p>• コンソール（F12）でより詳細なログを確認できます</p>
            <p>• window.stepCounterSimulator でシミュレーターを直接操作できます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
