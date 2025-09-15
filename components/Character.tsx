import React from 'react';
import { cn } from '@/lib/utils';
import LottieCharacter from '@/components/LottieCharacter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, Sparkles, TrendingUp, MessageCircle } from 'lucide-react';
import { useCharacterData } from '@/hooks/useCharacterData';
import { useAuth } from '@/contexts/AuthContext';
import { calculateCharacterLevel, calculateLevelProgress } from '@/lib/healthHelpers';

interface CharacterProps {
  className?: string;
  // Optional props to override data (for testing or specific scenarios)
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
  healthLevel?: number;
  isInteracting?: boolean;
}

export default function Character({ className, mood: overrideMood, healthLevel: overrideHealthLevel, isInteracting: overrideInteracting }: CharacterProps) {
  const { currentUser } = useAuth();
  const { characterData, healthStats, userProfile, loading, error } = useCharacterData(currentUser);

  // Use override props or real data
  const rawMood = overrideMood || characterData.mood || 'happy';
  const healthLevel = overrideHealthLevel !== undefined ? overrideHealthLevel : characterData.healthLevel;
  const isInteracting = overrideInteracting !== undefined ? overrideInteracting : characterData.isInteracting || false;

  const getHealthStatus = () => {
    if (healthLevel >= 80) return { text: "とても素晴らしい状態です！", emoji: "✨", color: "bg-health-green" };
    if (healthLevel >= 60) return { text: "良いペースで頑張っていらっしゃいますね！", emoji: "😊", color: "bg-wellness-amber" };
    if (healthLevel >= 40) return { text: "一緒に健康を目指しましょう", emoji: "😊", color: "bg-orange-500" };
    return { text: "新しいスタートを応援します", emoji: "🌱", color: "bg-blue-500" };
  };

  const getCharacterLevel = () => {
    return characterData.level
    // return calculateCharacterLevel(healthLevel);
  };

  const getLevelProgress = () => {
    return characterData.experience || calculateLevelProgress(healthLevel);
  };

  const getStreakDays = () => {
    return characterData.streak || 0;
  };

  const getExperiencePoints = () => {
    const baseExp = (healthStats?.totalLogs || 0) * 10;
    const streakBonus = getStreakDays() * 20;
    return baseExp + streakBonus;
  };

  const getMotivationalMessage = () => {
    const userName = userProfile?.displayName ? `${userProfile.displayName}さん` : 'あなた';
    const totalLogs = healthStats?.totalLogs || 0;
    
    if (healthLevel >= 80) {
      if (streakDays >= 7) {
        return `${userName}、${streakDays}日連続で記録を続けていらっしゃいます！本当に素晴らしい習慣ですね！💪✨`;
      }
      return `${userName}、とても良い健康状態を保っていらっしゃいますね！この調子で無理なく続けていきましょう！💪`;
    } else if (healthLevel >= 60) {
      if (totalLogs >= 10) {
        return `${userName}、健康記録が${totalLogs}件になりました！素晴らしいペースで取り組んでいらっしゃいますね！🌟`;
      }
      return `${userName}、良いペースで健康管理に取り組んでいらっしゃいますね。一緒に頑張りましょう！🌟`;
    } else if (healthLevel >= 40) {
      if (streakDays > 0) {
        return `${userName}、${streakDays}日続けて取り組んでいらっしゃいますね！継続は必ず力になります！📈`;
      }
      return `${userName}、健康への意識を持って取り組んでいらっしゃることが素晴らしいです。一歩ずつ進んでいきましょう！📈`;
    } else {
      if (totalLogs > 0) {
        return `${userName}、記録を始めてくださってありがとうございます！小さな一歩が大きな変化の始まりです！🌱`;
      }
      return `${userName}、新しいスタートを切りましょう！今日から一緒に健康記録を始めませんか？🌱`;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className="flex flex-col items-center p-8 space-y-6">
          <div className="w-36 h-36 rounded-full bg-muted animate-pulse" />
          <div className="w-full max-w-sm space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className="flex flex-col items-center p-8 space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">デフォルトデータを表示しています</p>
          </div>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus();
  const characterLevel = getCharacterLevel();
  const levelProgress = getLevelProgress();
  const streakDays = getStreakDays();
  const experiencePoints = getExperiencePoints();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-character-primary/8 via-character-secondary/5 to-health-green/5 rounded-2xl" />
      
      {/* Animated Health Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full",
              i % 3 === 0 ? "w-3 h-3 bg-health-green/20" :
              i % 3 === 1 ? "w-2 h-2 bg-character-primary/20" :
              "w-2.5 h-2.5 bg-wellness-amber/20",
              "float"
            )}
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${5 + (i * 8)}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + (i * 0.3)}s`
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center p-6 sm:p-8 space-y-6">
        {/* Character Display with Enhanced Effects */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-character-primary/20 to-character-secondary/20 blur-xl"></div>
          
          <LottieCharacter
            size={160}
            healthLevel={healthLevel}
            totalLogs={healthStats?.totalLogs || 0}
            streak={streakDays}
            recentMood={rawMood as any}
            isInteracting={isInteracting}
            className="transition-all duration-700 ease-out relative z-10"
          />

          {/* Enhanced Level Badge */}
          <Badge
            className={cn(
              "absolute -top-3 -right-3 text-white font-bold text-sm px-3 py-1",
              "bg-gradient-to-r from-character-primary to-character-secondary",
              "shadow-xl border-2 border-white/70 backdrop-blur-sm",
              "transition-all duration-300",
              isInteracting && "scale-110 shadow-2xl"
            )}
          >
            Lv.{characterLevel}
          </Badge>

          {/* Health Status Ring */}
          {/* <div className={cn(
            "absolute -bottom-3 left-1/2 transform -translate-x-1/2",
            "px-4 py-2 rounded-full text-xs font-medium text-white shadow-xl backdrop-blur-sm",
            "bg-gradient-to-r",
            healthLevel >= 80 ? "from-health-green to-health-green/80" :
            healthLevel >= 60 ? "from-wellness-amber to-wellness-amber/80" :
            healthLevel >= 40 ? "from-orange-500 to-orange-400" :
            "from-blue-500 to-blue-400",
            "transition-all duration-300",
            isInteracting && "scale-105"
          )}>
            {healthStatus.emoji} {healthLevel}%
          </div> */}
        </div>

        {/* Enhanced Health Information */}
        <div className="w-full max-w-sm space-y-5">
          {/* Health Status Message */}
          <div className="text-center glass rounded-xl p-4 border border-white/30 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {healthStatus.text}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-health-green" />
              <span>健康レベル {healthLevel}%</span>
            </div>
          </div>

          {/* Enhanced Progress Bars */}
          <div className="space-y-4">
            {/* Health Level Progress */}
            <div className="glass rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">健康レベル</span>
                <span className="font-bold text-health-green">{healthLevel}%</span>
              </div>
              <div className="relative">
                <Progress
                  value={healthLevel}
                  className="h-3 bg-muted/30"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-health-green/20 to-health-blue/20 pointer-events-none"></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>開始</span>
                <span>目標</span>
                <span>達成</span>
              </div>
            </div>

            {/* Character Level Progress */}
            <div className="glass rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">次のレベルまで</span>
                <span className="font-bold text-character-primary">{levelProgress}%</span>
              </div>
              <Progress
                value={levelProgress}
                className="h-2 bg-character-primary/10"
              />
            </div>
          </div>

          {/* Enhanced Character Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass border border-health-green/30 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 rounded-full bg-health-green/20 flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-4 h-4 text-health-green" />
                </div>
                <div className="text-lg font-bold text-health-green">{streakDays}</div>
                <div className="text-xs text-muted-foreground font-medium">連続日数</div>
              </CardContent>
            </Card>
            
            <Card className="glass border border-character-primary/30 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 rounded-full bg-character-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-4 h-4 text-character-primary" />
                </div>
                <div className="text-lg font-bold text-character-primary">{characterLevel}</div>
                <div className="text-xs text-muted-foreground font-medium">レベル</div>
              </CardContent>
            </Card>
            
            <Card className="glass border border-wellness-amber/30 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 rounded-full bg-wellness-amber/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-wellness-amber" />
                </div>
                <div className="text-lg font-bold text-wellness-amber">
                  {experiencePoints > 1000 ? `${(experiencePoints / 1000).toFixed(1)}k` : experiencePoints}
                </div>
                <div className="text-xs text-muted-foreground font-medium">経験値</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Motivational Message */}
        <Card className="glass border border-white/30 shadow-lg w-full max-w-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-character-primary" />
              <span className="font-medium text-character-primary">ヘルスバディからのメッセージ</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getMotivationalMessage()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
