import React from 'react';
import { cn } from '@/lib/utils';
import CharacterFace from '@/components/CharacterFaces';

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



  const getHealthBar = () => {
    const segments = 5;
    const filledSegments = Math.ceil((healthLevel / 100) * segments);
    
    return (
      <div className="flex gap-1 mt-2">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-1.5 rounded-full transition-all duration-300",
              i < filledSegments 
                ? healthLevel >= 80 ? 'bg-health-green' 
                  : healthLevel >= 60 ? 'bg-wellness-amber'
                  : healthLevel >= 40 ? 'bg-orange-500'
                  : 'bg-red-500'
                : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col items-center p-6", className)}>
      {/* Character Avatar */}
      <div className={cn(
        "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
        "bg-gradient-to-br from-character-primary/20 to-character-secondary/20",
        "border-4 border-character-primary/30",
        isInteracting && "scale-110 animate-pulse"
      )}>
        <CharacterFace
          mood={mood}
          size={96}
          className={cn("transition-all duration-300", getCharacterColor())}
        />

        {/* Glow effect when interacting */}
        {isInteracting && (
          <div className="absolute inset-0 rounded-full bg-character-primary/10 animate-ping" />
        )}
      </div>

      {/* Health Bar */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">健康レベル</p>
        {getHealthBar()}
        <p className="text-xs text-muted-foreground mt-1">{healthLevel}%</p>
      </div>

      {/* Status Message */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium">
          {healthLevel >= 80 ? "とても元気です！✨"
           : healthLevel >= 60 ? "調子は良好です！😊"
           : healthLevel >= 40 ? "もう少し気をつけましょう... 😐"
           : "もっとケアが必要です... 😞"}
        </p>
      </div>
    </div>
  );
}
