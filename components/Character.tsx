import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCharacterData } from '@/hooks/useCharacterData';
import { useAuth } from '@/contexts/AuthContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface CharacterProps {
  className?: string;
  // Optional props to override data (for testing or specific scenarios)
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
  healthLevel?: number;
  isInteracting?: boolean;
}

// Character growth stages based on health logs and consistency
type CharacterStage = 'egg' | 'child1' | 'child2' | 'child3' | 'adult1' | 'adult2' | 'blank';

// Character files mapping
const CHARACTER_FILES: Record<CharacterStage, string> = {
  egg: '/charactor/tamago.json',
  child1: '/charactor/kodomo1.json',
  child2: '/charactor/kodomo2.json', 
  child3: '/charactor/kodomo3.json',
  adult1: '/charactor/otona1.json',
  adult2: '/charactor/otona2.json', // blank expression for poor consistency
  blank: '/charactor/otona2.json'
};

export default function Character({ className, mood: overrideMood, healthLevel: overrideHealthLevel, isInteracting: overrideInteracting }: CharacterProps) {
  const { currentUser } = useAuth();
  const { characterData, healthStats, userProfile, loading, error } = useCharacterData(currentUser);

  // Determine character growth stage based on health data and consistency
  const getCharacterStage = useMemo((): CharacterStage => {
    if (!healthStats) return 'egg';

    const { totalLogs, weeklyLogs } = healthStats;
    const streak = characterData.streak;
    const { healthLevel: currentHealthLevel } = characterData;

    // Check for poor consistency or no activity (blank expression)
    if (streak === 0 && totalLogs < 3) {
      return 'blank';
    }

    // Growth progression based on total logs and consistency
    // Egg stage: 0-5 logs
    if (totalLogs <= 5) {
      return 'egg';
    }

    // Child stages: 6-30 logs with progression based on consistency and health
    if (totalLogs <= 15) {
      return 'child1';
    } else if (totalLogs <= 25) {
      return 'child2';
    } else if (totalLogs <= 35) {
      return 'child3';
    }

    // Adult stages: 35+ logs
    // Adult1 for good consistency and health
    if (streak >= 7 && currentHealthLevel >= 70) {
      return 'adult1';
    }
    
    // Adult2 for poor consistency or low health (blank expression)
    if (streak < 3 || currentHealthLevel < 50) {
      return 'adult2'; // This will use otona2.json with blank expression
    }

    // Default adult stage
    return 'adult1';
  }, [healthStats, characterData]);

  // Get the appropriate Lottie file path
  const getLottieFile = useMemo(() => {
    return CHARACTER_FILES[getCharacterStage];
  }, [getCharacterStage]);

  // Get character stage description for display
  const getStageDescription = (stage: CharacterStage): string => {
    switch (stage) {
      case 'egg':
        return 'たまご';
      case 'child1':
        return 'こども（初期）';
      case 'child2':
        return 'こども（成長中）';
      case 'child3':
        return 'こども（成熟）';
      case 'adult1':
        return 'おとな（健康）';
      case 'adult2':
      case 'blank':
        return 'おとな（無表情）';
      default:
        return 'たまご';
    }
  };

  // Use override props or real data
  const rawMood = overrideMood || characterData.mood || 'happy';
  const healthLevel = overrideHealthLevel !== undefined ? overrideHealthLevel : characterData.healthLevel;
  const isInteracting = overrideInteracting !== undefined ? overrideInteracting : characterData.isInteracting || false;
  const currentStage = getCharacterStage;
  const getCharacterColor = () => {
    if (healthLevel >= 80) return 'text-health-green';
    if (healthLevel >= 60) return 'text-wellness-amber';
    if (healthLevel >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthStatus = () => {
    if (healthLevel >= 80) return { text: "とても元気です！", emoji: "✨", color: "bg-health-green" };
    if (healthLevel >= 60) return { text: "調子は良好です！", emoji: "😊", color: "bg-wellness-amber" };
    if (healthLevel >= 40) return { text: "もう少し気をつけましょう", emoji: "😐", color: "bg-orange-500" };
    return { text: "もっとケアが必要です", emoji: "😞", color: "bg-red-500" };
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
        return `${userName}、${streakDays}日連続で記録を続けています！素晴らしい習慣ですね！💪✨`;
      }
      return `${userName}、とても良い健康状態を保っていますね！この調子で続けましょう！💪`;
    } else if (healthLevel >= 60) {
      if (totalLogs >= 10) {
        return `${userName}、健康記録が${totalLogs}件になりました！良いペースですね！🌟`;
      }
      return `${userName}、良いペースで健康管理ができています。もう少し頑張りましょう！🌟`;
    } else if (healthLevel >= 40) {
      if (streakDays > 0) {
        return `${userName}、${streakDays}日続けて頑張っていますね！継続が力になります！📈`;
      }
      return `${userName}、健康への意識を持って取り組んでいますね。継続が大切です！📈`;
    } else {
      if (totalLogs > 0) {
        return `${userName}、記録を始めてくれてありがとう！小さな一歩が大きな変化の始まりです！🌱`;
      }
      return `${userName}、新しいスタートです！今日から健康記録を始めてみませんか？🌱`;
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
        {/* Character Avatar with Lottie Animation */}
        <div className="relative">
          {/* Main character container */}
          <div className={cn(
            "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ease-out",
            "bg-gradient-to-br from-character-primary/20 via-character-primary/5 to-character-secondary/10",
            "border-4 border-character-primary/30 shadow-2xl overflow-hidden",
            isInteracting && "scale-110 shadow-character-primary/50"
          )}>
            {/* Inner glow */}
            <div className={cn(
              "absolute inset-2 rounded-full",
              "bg-gradient-to-br from-white/10 to-transparent",
              "transition-opacity duration-500",
              isInteracting ? "opacity-100" : "opacity-30"
            )} />
            
            {/* Lottie Character Animation */}
            <div className="relative w-40 h-40 z-10">
              <DotLottieReact
                src={getLottieFile}
                loop
                autoplay
                className={cn(
                  "w-full h-full transition-all duration-500",
                  isInteracting && "scale-105"
                )}
              />
            </div>

            {/* Interaction effects */}
            {isInteracting && (
              <>
                <div className="absolute inset-0 rounded-full bg-character-primary/15 animate-ping" />
                <div className="absolute inset-4 rounded-full bg-character-secondary/15 animate-pulse" />
              </>
            )}
          </div>

          {/* Character Stage badge */}
          <Badge 
            className={cn(
              "absolute -top-2 -right-2 text-white font-bold text-xs",
              "bg-gradient-to-r from-character-primary to-character-secondary",
              "shadow-lg border-2 border-white/50",
              "transition-transform duration-300",
              isInteracting && "scale-110"
            )}
          >
            {getStageDescription(currentStage)}
          </Badge>

          {/* Health status indicator */}
          <div className={cn(
            "absolute -bottom-2 left-1/2 transform -translate-x-1/2",
            "px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg",
            healthStatus.color,
            "transition-all duration-300",
            isInteracting && "scale-105"
          )}>
            {healthStatus.emoji}
          </div>
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
                {healthStats?.totalLogs || 0}
              </div>
              <div className="text-xs text-muted-foreground">記録数</div>
            </div>
          </div>

          {/* Character Growth Information */}
          <div className="w-full max-w-sm mt-4 p-4 bg-gradient-to-r from-character-primary/5 to-character-secondary/5 rounded-lg border border-character-primary/20">
            <div className="text-center space-y-2">
              <h4 className="text-sm font-semibold text-character-primary">
                キャラクター成長段階
              </h4>
              <div className="text-xs text-muted-foreground">
                {currentStage === 'blank' || currentStage === 'adult2' ? (
                  <span className="text-orange-600">
                    継続的な記録で表情が戻ります
                  </span>
                ) : currentStage === 'egg' ? (
                  <span className="text-blue-600">
                    健康記録を続けて成長させましょう
                  </span>
                ) : currentStage.startsWith('child') ? (
                  <span className="text-green-600">
                    順調に成長しています！
                  </span>
                ) : (
                  <span className="text-purple-600">
                    立派に成長しました！
                  </span>
                )}
              </div>
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
