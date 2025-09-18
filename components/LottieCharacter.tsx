import React, { useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';


interface LottieCharacterProps {
  className?: string;
  size?: number;
  // Health data for determining growth stage and expression
  healthLevel: number;
  totalLogs: number;
  streak: number;
  recentMood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
  isInteracting?: boolean;
}

// Character growth stages based on health logs and consistency
const getCharacterStage = (totalLogs: number, streak: number, healthLevel: number) => {
  // Poor health management - show blank expression adult
  if (streak === 0 && totalLogs < 5 && healthLevel < 40) {
    return 'otona2'; // Blank expression adult
  }
  
  // Growth progression: egg -> child -> adult
  if (totalLogs < 10 || healthLevel < 30) {
    return 'tamago'; // Egg stage - beginner
  } else if (totalLogs < 50 || healthLevel < 70) {
    // Child stage - use numerical order (kodomo1, kodomo2, kodomo3)
    if (totalLogs < 20) return 'kodomo1';
    if (totalLogs < 35) return 'kodomo2';
    return 'kodomo3';
  } else {
    // Adult stage - healthy and consistent
    return 'otona1'; // Healthy adult with expressions
  }
};

const banzai = "banzai";
const folldown = "folldown";
const greeting = "greeting";
const jump = "jump";
const pose = "pose";
const pose1 = "pose1";
const shark = "shark";
const sit = "sit";
const sit1 = "sit1";
const tilt = "tild";
const turn = "turn";

// Map mood to appropriate character expression
const getCharacterExpression = (stage: string, mood: string) => {
  // For otona2 (blank expression), always return the same file
  if (stage === 'otona2') {
    return '/charactor/neutral/otona2.json';
  }
  
  // For other stages, use the base animation
  // In a more advanced implementation, you could have different expression files
  // For now, we'll use the single animation file per stage
  switch (stage) {
    case 'tamago':
      return '/charactor/neutral/tamago.json';
    case 'kodomo1':
      return `/charactor/${mood}/kodomo1.json`;
    case 'kodomo2':
      return `/charactor/${mood}/kodomo2.json`;
    case 'kodomo3':
      return `/charactor/${mood}/kodomo3.json`;
    case 'otona1':
      return '/charactor/neutral/otona1.json';
    default:
      return '/charactor/neutral/tamago.json';
  }
};

export default function LottieCharacter({
  className,
  size = 200,
  healthLevel,
  totalLogs,
  streak,
  recentMood,
  isInteracting = false
}: LottieCharacterProps) {
  const characterStage = useMemo(() => 
    getCharacterStage(totalLogs, streak, healthLevel), 
    [totalLogs, streak, healthLevel]
  );

  console.log("recentmood======", recentMood)

  const animationSrc = useMemo(() => 
    getCharacterExpression(characterStage, recentMood),
    [characterStage, recentMood]
  );

  // Get character info for display
  const getCharacterInfo = () => {
    switch (characterStage) {
      case 'tamago':
        return {
          name: 'たまご',
          description: '新しい健康習慣の始まり',
          stage: '卵',
          color: 'text-yellow-600'
        };
      case 'kodomo1':
        return {
          name: 'こども（初期）',
          description: '健康意識が芽生えています',
          stage: '幼児期',
          color: 'text-green-500'
        };
      case 'kodomo2':
        return {
          name: 'こども（成長期）',
          description: '順調に成長しています',
          stage: '成長期',
          color: 'text-green-600'
        };
      case 'kodomo3':
        return {
          name: 'こども（後期）',
          description: 'もうすぐ大人になります',
          stage: '後期',
          color: 'text-blue-500'
        };
      case 'otona1':
        return {
          name: 'おとな（健康）',
          description: '素晴らしい健康習慣です',
          stage: '成人',
          color: 'text-blue-600'
        };
      case 'otona2':
        return {
          name: 'おとな（無表情）',
          description: 'もう少し頑張りましょう',
          stage: '停滞期',
          color: 'text-gray-500'
        };
      default:
        return {
          name: 'たまご',
          description: '新しいスタート',
          stage: '卵',
          color: 'text-yellow-600'
        };
    }
  };

  const characterInfo = getCharacterInfo();

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Character Animation */}
      <div 
        className={cn(
          "relative transition-all duration-700 ease-out",
          "rounded-full flex items-center justify-center",
          isInteracting && "scale-110"
        )}
        style={{ width: size, height: size }}
      >
        {/* Interaction effects */}
        {isInteracting && (
          <>
            <div className="absolute inset-0 rounded-full bg-character-primary/20 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-character-secondary/20 animate-pulse" />
          </>
        )}
        
        {/* Lottie Animation */}
        <DotLottieReact
          src={animationSrc}
          loop
          autoplay
          className="w-full h-full"
        />
      </div>

      {/* Character Info */}
      <div className="mt-4 text-center space-y-1">
        <h3 className={cn("font-medium text-sm", characterInfo.color)}>
          {characterInfo.name}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          {characterInfo.description}
        </p>
      </div>
    </div>
  );
}

// Export character stage calculation for external use
export { getCharacterStage };
