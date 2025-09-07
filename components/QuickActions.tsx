import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Camera, User, BarChart3 } from 'lucide-react';
import { HealthIcons } from '@/components/CharacterFaces';

interface QuickActionsProps {
  onLogHealth: () => void;
  onTakePhoto: () => void;
  onProfileClick: () => void;
  onStatsClick: () => void;
}

export default function QuickActions({
  onLogHealth,
  onTakePhoto,
  onProfileClick,
  onStatsClick
}: QuickActionsProps) {
  return (
    <Card className="glass border border-white/30 shadow-lg">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-health-green" />
          その他のアクション
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 glass border-health-green/30 hover:border-health-green/50 hover:bg-health-green/10 transition-all duration-300 hover:scale-105 touch-target"
            onClick={onLogHealth}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-health-green/20 to-health-green/10 flex items-center justify-center shadow-inner">
              <HealthIcons.Heart size={20} className="text-health-green sm:w-6 sm:h-6" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">健康記録</span>
            <Badge variant="secondary" className="text-xs bg-health-green/20 text-health-green border-health-green/30">+5 XP</Badge>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 glass border-health-blue/30 hover:border-health-blue/50 hover:bg-health-blue/10 transition-all duration-300 hover:scale-105 touch-target"
            onClick={onTakePhoto}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-health-blue/20 to-health-blue/10 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-health-blue" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">食事記録</span>
            <Badge variant="secondary" className="text-xs bg-health-blue/20 text-health-blue border-health-blue/30">+3 XP</Badge>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 glass border-character-primary/30 hover:border-character-primary/50 hover:bg-character-primary/10 transition-all duration-300 hover:scale-105 touch-target"
            onClick={onProfileClick}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-character-primary/20 to-character-primary/10 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-character-primary" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">プロフィール</span>
            <Badge variant="outline" className="text-xs border-character-primary/30 text-character-primary">設定</Badge>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 glass border-wellness-amber/30 hover:border-wellness-amber/50 hover:bg-wellness-amber/10 transition-all duration-300 hover:scale-105 touch-target"
            onClick={onStatsClick}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-wellness-amber/20 to-wellness-amber/10 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-wellness-amber" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">詳細統計</span>
            <Badge variant="outline" className="text-xs border-wellness-amber/30 text-wellness-amber">分析</Badge>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}