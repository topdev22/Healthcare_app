import React from 'react';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileStepCounterDebug from '@/components/MobileStepCounterDebug';

export default function MobileDebug() {
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
              <Smartphone className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  モバイル歩数カウンターデバッグ
                </h1>
                <p className="text-sm text-gray-600">
                  モバイルデバイスでの歩数カウンター動作確認とトラブルシューティング
                </p>
              </div>
            </div>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </div>
        </div>

        {/* Debug Interface */}
        <MobileStepCounterDebug />

        {/* Troubleshooting Guide */}
        <div className="mt-8 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">🔧 トラブルシューティングガイド</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-red-600 mb-3">❌ よくある問題と解決方法</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">1. 歩数が増えない</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>デバイスを手に持って明確に歩く</li>
                    <li>アプリを再起動してやり直す</li>
                    <li>ブラウザの権限設定を確認</li>
                    <li>HTTPSで接続されているか確認</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">2. 権限エラー</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>ブラウザ設定でモーションセンサーを許可</li>
                    <li>プライベートモードを無効化</li>
                    <li>サイトの設定をリセット</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">3. デバイス非対応</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>加速度センサーが搭載されていない</li>
                    <li>古いブラウザを使用している</li>
                    <li>ネイティブアプリでの使用を推奨</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-green-600 mb-3">✅ 推奨設定と環境</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">iOS (iPhone/iPad)</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>iOS 13.0 以降</li>
                    <li>Safari または Chrome</li>
                    <li>HTTPS必須</li>
                    <li>モーションと方向へのアクセス許可</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Android</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>Android 5.0 以降</li>
                    <li>Chrome、Firefox、Edge</li>
                    <li>位置情報とセンサーアクセス許可</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">最適な使用方法</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>デバイスを手に持つまたはポケットに入れる</li>
                    <li>自然な歩行パターンを維持</li>
                    <li>急激な動きや振動を避ける</li>
                    <li>定期的にアプリをフォアグラウンドに</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">🔬 技術情報</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• このデバッグ画面はモバイルデバイスでのみ表示されます</p>
            <p>• 歩数検出にはデバイスの加速度センサーを使用します</p>
            <p>• ピーク・バレー検出アルゴリズムで歩行パターンを認識</p>
            <p>• データはデバイスのローカルストレージに保存されます</p>
            <p>• 詳細なログはブラウザの開発者ツール(Console)で確認できます</p>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">📞 サポート</h3>
          <p className="text-sm text-yellow-700">
            問題が解決しない場合は、デバッグ情報のスクリーンショットと併せて
            開発チームまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
