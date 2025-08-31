import React from 'react';
import { cn } from '@/lib/utils';
import LottieCharacter from '@/components/LottieCharacter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCharacterData } from '@/hooks/useCharacterData';
import { useAuth } from '@/contexts/AuthContext';

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
    return characterData.level || Math.floor(healthLevel / 25) + 1;
  };

  const getLevelProgress = () => {
    return characterData.experience || (healthLevel % 25) * 4;
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
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-character-primary/5 via-transparent to-character-secondary/5" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-2 h-2 bg-character-primary/20 rounded-full",
              "animate-bounce",
              i % 2 === 0 ? "float" : ""
            )}
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${10 + (i * 12)}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i * 0.5)}s`
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center p-8 space-y-6">
        {/* Lottie Character with Growth Stages */}
        <div className="relative">
          <LottieCharacter
            size={144}
            healthLevel={healthLevel}
            totalLogs={healthStats?.totalLogs || 0}
            streak={streakDays}
            recentMood={rawMood as any}
            isInteracting={isInteracting}
            className="transition-all duration-700 ease-out"
          />

          {/* Level badge */}
          <Badge 
            className={cn(
              "absolute -top-2 -right-2 text-white font-bold",
              "bg-gradient-to-r from-character-primary to-character-secondary",
              "shadow-lg border-2 border-white/50",
              "transition-transform duration-300",
              isInteracting && "scale-110"
            )}
          >
            レベル {characterLevel}
          </Badge>

          {/* Health status indicator */}
          {/* <div className={cn(
            "absolute -bottom-2 left-1/2 transform -translate-x-1/2",
            "px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg",
            healthStatus.color,
            "transition-all duration-300",
            isInteracting && "scale-105"
          )}>
            {healthStatus.emoji}
          </div> */}
        </div>

        {/* Health Information */}
        <div className="w-full max-w-sm space-y-4">
          {/* Health Level Display */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {healthStatus.text}
            </h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>健康レベル</span>
              <span className="font-medium">{healthLevel}%</span>
            </div>
          </div>

          {/* Health Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={healthLevel} 
              className="h-3 bg-muted/50"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">次のレベルまで</span>
              <span className="font-medium text-character-primary">{levelProgress}%</span>
            </div>
            <Progress 
              value={levelProgress} 
              className="h-2 bg-character-primary/10"
            />
          </div>

          {/* Character Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-health-green/10 rounded-lg border border-health-green/20">
              <div className="text-lg font-bold text-health-green">{streakDays}</div>
              <div className="text-xs text-muted-foreground">連続日数</div>
            </div>
            <div className="text-center p-3 bg-character-primary/10 rounded-lg border border-character-primary/20">
              <div className="text-lg font-bold text-character-primary">{characterLevel}</div>
              <div className="text-xs text-muted-foreground">レベル</div>
            </div>
            <div className="text-center p-3 bg-wellness-amber/10 rounded-lg border border-wellness-amber/20">
              <div className="text-lg font-bold text-wellness-amber">
                {experiencePoints > 1000 ? `${(experiencePoints / 1000).toFixed(1)}k` : experiencePoints}
              </div>
              <div className="text-xs text-muted-foreground">経験値</div>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="text-center p-4 bg-muted/30 rounded-lg border border-muted/50 max-w-sm">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getMotivationalMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
