import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Heart, Clock, Sparkles } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface QuickStatsCardsProps {
  // Optional props to override data (for testing or specific scenarios)
  healthLevel?: number;
  streakDays?: number;
  todayCalories?: number;
  characterLevel?: number;
}

export default function QuickStatsCards({
  healthLevel: overrideHealthLevel,
  streakDays: overrideStreakDays,
  todayCalories: overrideTodayCalories,
  characterLevel: overrideCharacterLevel
}: QuickStatsCardsProps) {
  const { currentUser } = useAuth();
  const { quickStats, loading } = useDashboard(currentUser);

  // Use override props or real data
  const healthLevel = overrideHealthLevel !== undefined ? overrideHealthLevel : (quickStats?.healthLevel || 50);
  const streakDays = overrideStreakDays !== undefined ? overrideStreakDays : (quickStats?.streakDays || 0);
  const todayCalories = overrideTodayCalories !== undefined ? overrideTodayCalories : (quickStats?.todayCalories || 0);
  const characterLevel = overrideCharacterLevel !== undefined ? overrideCharacterLevel : (quickStats?.characterLevel || 1);

  if (loading && !quickStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-hover">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted rounded mx-auto mb-1 sm:mb-2 animate-pulse" />
              <div className="h-6 sm:h-8 bg-muted rounded mb-1 animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
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