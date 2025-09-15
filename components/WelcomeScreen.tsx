import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 text-center safe-area-bottom min-h-screen flex items-center justify-center">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="float w-full flex justify-center relative">
            <div className="relative">
              <img
                src="/images/logo.jpg"
                alt="Health Buddy Logo"
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl shadow-2xl ring-4 ring-health-green/20"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-health-green to-health-blue rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-health-green via-health-blue to-character-primary bg-clip-text text-transparent">
              ヘルスバディ
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              健康管理の新しいスタイル
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              AIパートナーと一緒に、楽しく健康習慣を身につけませんか？<br />
              毎日の記録があなたの健康を支えます。
            </p>
          </div>
        </div>

        {/* Features Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="glass p-4 rounded-xl border border-white/30 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-health-green/20 to-health-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-health-green" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">健康記録</h3>
            <p className="text-muted-foreground">体重・気分・食事を簡単記録</p>
          </div>
          
          <div className="glass p-4 rounded-xl border border-white/30 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-character-primary/20 to-character-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-character-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">AIチャット</h3>
            <p className="text-muted-foreground">24時間健康相談</p>
          </div>
          
          <div className="glass p-4 rounded-xl border border-white/30 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-wellness-amber/20 to-wellness-amber/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-wellness-amber" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">成長記録</h3>
            <p className="text-muted-foreground">継続で育つキャラクター</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="w-full touch-target bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 py-4 text-lg font-semibold"
          >
            今すぐ健康管理を始める
          </Button>
          
          <p className="text-xs text-muted-foreground">
            無料で始められます • データは安全に保護されます
          </p>
        </div>
      </div>
    </div>
  );
}