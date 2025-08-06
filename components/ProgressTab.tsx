import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MessageCircle, Camera } from 'lucide-react';
import { HealthIcons } from '@/components/CharacterFaces';

interface ProgressTabProps {
  healthLevel: number;
}

export default function ProgressTab({ healthLevel }: ProgressTabProps) {
  const currentLevel = 3;
  const experiencePoints = (healthLevel % 25) * 4;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Character Growth Card */}
      <Card className="glass">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-character-primary" />
            キャラクター成長
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="relative">
              <div className="text-4xl sm:text-6xl float">
                <HealthIcons.Sparkles size={48} className="text-character-primary mx-auto sm:w-16 sm:h-16" />
              </div>
              <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-character-primary to-character-secondary text-xs sm:text-sm">
                レベル {currentLevel}
              </Badge>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">健康サポーター</h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                健康データを記録し続けて、キャラクターを成長させましょう！
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>経験値</span>
                <span>{experiencePoints}/100</span>
              </div>
              <div className="bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-character-primary to-character-secondary transition-all duration-500 smooth-transition"
                  style={{ width: `${experiencePoints}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                次のレベルまで健康ログ{Math.floor(25 - (healthLevel % 25))}回！
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="glass">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">最近の達成項目</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 sm:h-64">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-health-green/10 rounded-lg border border-health-green/20 card-hover">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-health-green/20 rounded-full flex items-center justify-center">
                  <HealthIcons.Trophy size={16} className="text-health-green sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium">7日連続記録！</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">7日間連続で健康データを記録しました</p>
                </div>
                <Badge variant="outline" className="bg-health-green/10 text-health-green border-health-green/20 text-xs">
                  +10 XP
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-character-primary/10 rounded-lg border border-character-primary/20 card-hover">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-character-primary/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-character-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium">おしゃべり好き</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">健康バディと10回の会話をしました</p>
                </div>
                <Badge variant="outline" className="bg-character-primary/10 text-character-primary border-character-primary/20 text-xs">
                  +5 XP
                </Badge>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-health-blue/10 rounded-lg border border-health-blue/20 card-hover">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-health-blue/20 rounded-full flex items-center justify-center">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-health-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium">フードロガー</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">5回の食事記録を完了しました</p>
                </div>
                <Badge variant="outline" className="bg-health-blue/10 text-health-blue border-health-blue/20 text-xs">
                  +3 XP
                </Badge>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}