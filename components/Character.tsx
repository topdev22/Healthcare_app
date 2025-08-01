import React from 'react';
import { cn } from '@/lib/utils';
import CharacterFace from '@/components/CharacterFaces';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CharacterProps {
  mood: 'happy' | 'neutral' | 'sad' | 'sleeping';
  healthLevel: number; // 0-100
  isInteracting?: boolean;
  className?: string;
}

export default function Character({ mood, healthLevel, isInteracting = false, className }: CharacterProps) {
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
    return Math.floor(healthLevel / 25) + 1;
  };

  const getLevelProgress = () => {
    return (healthLevel % 25) * 4;
  };

  const healthStatus = getHealthStatus();
  const characterLevel = getCharacterLevel();
  const levelProgress = getLevelProgress();

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
              "animate-pulse",
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
        {/* Character Avatar with enhanced design */}
        <div className="relative">
          {/* Main character container */}
          <div className={cn(
            "relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 ease-out",
            "bg-gradient-to-br from-character-primary/30 via-character-primary/10 to-character-secondary/20",
            "border-4 border-character-primary/40 shadow-2xl",
            isInteracting && "scale-110 shadow-character-primary/40"
          )}>
            {/* Inner glow */}
            <div className={cn(
              "absolute inset-2 rounded-full",
              "bg-gradient-to-br from-white/20 to-transparent",
              "transition-opacity duration-500",
              isInteracting ? "opacity-100" : "opacity-50"
            )} />
            
            {/* Character face */}
            <CharacterFace
              mood={mood}
              size={100}
              className={cn("transition-all duration-500 z-10", getCharacterColor())}
            />

            {/* Interaction effects */}
            {isInteracting && (
              <>
                <div className="absolute inset-0 rounded-full bg-character-primary/20 animate-ping" />
                <div className="absolute inset-4 rounded-full bg-character-secondary/20 animate-pulse" />
              </>
            )}
          </div>

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
            Level {characterLevel}
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
              <div className="text-lg font-bold text-health-green">7</div>
              <div className="text-xs text-muted-foreground">連続日数</div>
            </div>
            <div className="text-center p-3 bg-character-primary/10 rounded-lg border border-character-primary/20">
              <div className="text-lg font-bold text-character-primary">{characterLevel}</div>
              <div className="text-xs text-muted-foreground">レベル</div>
            </div>
            <div className="text-center p-3 bg-wellness-amber/10 rounded-lg border border-wellness-amber/20">
              <div className="text-lg font-bold text-wellness-amber">2.1k</div>
              <div className="text-xs text-muted-foreground">経験値</div>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="text-center p-4 bg-muted/30 rounded-lg border border-muted/50 max-w-sm">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {healthLevel >= 80 
              ? "素晴らしい健康状態を保っていますね！この調子で続けましょう！💪"
              : healthLevel >= 60 
              ? "良いペースで健康管理ができています。もう少し頑張りましょう！🌟"
              : healthLevel >= 40 
              ? "健康への意識を持って取り組んでいますね。継続が大切です！📈"
              : "新しいスタートです！小さな一歩から始めましょう！🌱"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
