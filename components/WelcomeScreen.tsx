import React from 'react';
import { Button } from '@/components/ui/button';
import { HealthIcons } from '@/components/CharacterFaces';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="container mx-auto px-4 py-16 text-center safe-area-bottom">
      <div className="max-w-md mx-auto space-y-6">
        <div className="float w-full flex justify-center">
          <img src="/images/logo.jpg" alt="Health Buddy Logo" className="w-24 h-24 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-lg" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-3">ヘルスバディへようこそ</h2>
          <p className="text-muted-foreground text-lg">
            あなた専用の健康管理パートナーです。<br />
            ログインして健康な生活を始めましょう！
          </p>
        </div>
        <Button 
          onClick={onGetStarted} 
          size="lg" 
          className="w-full touch-target bg-gradient-to-r from-health-green to-health-blue hover:scale-105 transition-transform"
        >
          今すぐ始める
        </Button>
      </div>
    </div>
  );
}