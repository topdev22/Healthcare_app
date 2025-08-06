import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Heart, Clock, Sparkles } from 'lucide-react';

interface QuickStatsCardsProps {
  healthLevel: number;
  streakDays?: number;
  todayCalories?: number;
  characterLevel?: number;
}

export default function QuickStatsCards({
  healthLevel,
  streakDays = 7,
  todayCalories = 2100,
  characterLevel = 3
}: QuickStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="card-hover">
        <CardContent className="p-3 sm:p-4 text-center">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-health-green mx-auto mb-1 sm:mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-health-green">{healthLevel}%</p>
          <p className="text-xs text-muted-foreground">健康レベル</p>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-3 sm:p-4 text-center">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1 sm:mb-2" />
          <p className="text-lg sm:text-2xl font-bold">{streakDays}</p>
          <p className="text-xs text-muted-foreground">連続記録日数</p>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-3 sm:p-4 text-center">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-health-blue mx-auto mb-1 sm:mb-2" />
          <p className="text-lg sm:text-2xl font-bold">{(todayCalories / 1000).toFixed(1)}k</p>
          <p className="text-xs text-muted-foreground">今日のカロリー</p>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-3 sm:p-4 text-center">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-character-primary mx-auto mb-1 sm:mb-2" />
          <p className="text-lg sm:text-2xl font-bold">レベル{characterLevel}</p>
          <p className="text-xs text-muted-foreground">バディ成長</p>
        </CardContent>
      </Card>
    </div>
  );
}