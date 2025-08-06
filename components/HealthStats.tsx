import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Scale, Smile, Camera } from 'lucide-react';
import { MoodIcons } from '@/components/CharacterFaces';
import { cn } from '@/lib/utils';

interface HealthData {
  weight?: number;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  calories?: number;
  date: string;
}

interface HealthStatsProps {
  recentData: HealthData[];
  onLogHealth: () => void;
  onTakePhoto: () => void;
}

export default function HealthStats({ recentData, onLogHealth, onTakePhoto }: HealthStatsProps) {
  // Ensure recentData is always an array
  const safeRecentData = Array.isArray(recentData) ? recentData : [];
  const today = safeRecentData[0];
  const weekAvg = safeRecentData.slice(0, 7).reduce((acc, day) => acc + (day.weight || 0), 0) / Math.max(safeRecentData.slice(0, 7).filter(d => d.weight).length, 1);
  
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <MoodIcons.happy size={16} />;
      case 'neutral': return <MoodIcons.neutral size={16} />;
      case 'sad': return <MoodIcons.sad size={16} />;
      case 'anxious': return <MoodIcons.anxious size={16} />;
      case 'excited': return <MoodIcons.excited size={16} />;
      default: return <MoodIcons.neutral size={16} />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-health-green text-white';
      case 'excited': return 'bg-wellness-amber text-white';
      case 'neutral': return 'bg-gray-500 text-white';
      case 'anxious': return 'bg-orange-500 text-white';
      case 'sad': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Today's Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-health-green" />
            今日の健康状態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">気分</span>
            <Badge className={cn("flex items-center gap-1", getMoodColor(today?.mood || 'neutral'))}>
              {getMoodIcon(today?.mood || 'neutral')} {today?.mood === 'happy' ? '幸せ' : today?.mood === 'sad' ? '悲しい' : today?.mood === 'excited' ? '興奮' : today?.mood === 'anxious' ? '不安' : today?.mood || '未記録'}
            </Badge>
          </div>
          
          {today?.weight && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">体重</span>
              <div className="flex items-center gap-1">
                <Scale className="w-4 h-4 text-health-blue" />
                <span className="font-medium">{today.weight}kg</span>
              </div>
            </div>
          )}
          
          {today?.calories && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">カロリー</span>
              <span className="font-medium">{today.calories} cal</span>
            </div>
          )}
          
          <button
            onClick={onLogHealth}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            健康データを記録
          </button>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smile className="w-5 h-5 text-character-primary" />
            今週の記録
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">平均体重</span>
            <span className="font-medium">{isNaN(weekAvg) ? '--' : weekAvg.toFixed(1)}kg</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">記録日数</span>
            <span className="font-medium">{safeRecentData.slice(0, 7).length}/7</span>
          </div>
          
          <div>
            <span className="text-sm text-muted-foreground mb-2 block">最近の気分</span>
            <div className="flex gap-2">
              {safeRecentData.slice(0, 5).map((day, i) => (
                <div key={i} className="flex items-center justify-center w-6 h-6">
                  {getMoodIcon(day.mood)}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onTakePhoto}
            className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            食事写真を記録
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
