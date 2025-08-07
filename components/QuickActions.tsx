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
    <Card className="glass">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          クイックアクション
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 card-hover touch-target"
            onClick={onLogHealth}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-health-green/20 flex items-center justify-center">
              <HealthIcons.Heart size={20} className="text-health-green sm:w-6 sm:h-6" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center">気分を記録</span>
            <Badge variant="secondary" className="text-xs">+5 XP</Badge>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 card-hover touch-target"
            onClick={onTakePhoto}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-health-blue/20 flex items-center justify-center">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-health-blue" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center">食事記録</span>
            <Badge variant="secondary" className="text-xs">+3 XP</Badge>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 card-hover touch-target"
            onClick={onProfileClick}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-character-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-character-primary" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center">プロフィール</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 card-hover touch-target"
            onClick={onStatsClick}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center">詳細統計</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}