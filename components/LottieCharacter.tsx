import React, { useMemo, useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

// Animation constants with corrected names
const ANIMATIONS = {
  banzai: "banzai",    // Energetic cheer
  folddown: "folddown", // Corrected from "folldown"; dejected or folding pose
  greeting: "greeting",
  jump: "jump",
  pose: "pose",
  pose1: "pose1",
  shark: "shark",      // Fun or aggressive pose
  sit: "sit",
  sit1: "sit1",
  tilt: "tilt",        // Corrected from "tild"
  turn: "turn"
} as const;

type AnimationKey = keyof typeof ANIMATIONS;

interface LottieCharacterProps {
  className?: string;
  size?: number;
  // Health data for determining growth stage and expression
  healthLevel: number;
  totalLogs: number;
  streak: number;
  recentMood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
  isInteracting?: boolean;
  // New prop for dynamic animation control
  animationKey?: AnimationKey;
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

// Map mood to appropriate character expression
const getCharacterExpression = (stage: string, mood: string) => {
  // For otona2 (blank expression), always return the same file
  if (stage === 'otona2') {
    return '/character/neutral/otona2.json';
  }
  
  // For other stages, use the base animation
  // In a more advanced implementation, you could have different expression files
  // For now, we'll use the single animation file per stage
  switch (stage) {
    case 'tamago':
      return '/character/neutral/tamago.json';
    case 'kodomo1':
      return `/character/${mood}/kodomo1.json`;
    case 'kodomo2':
      return `/character/${mood}/kodomo2.json`;
    case 'kodomo3':
      return `/character/${mood}/kodomo3.json`;
    case 'otona1':
      return '/character/neutral/otona1.json';
    default:
      return '/character/neutral/tamago.json';
  }
};

// New function to get character expression based on animation key and character progression
const getCharacterExpressionByAnimation = (animationKey: AnimationKey, characterStage: string = 'kodomo1'): string => {
  console.log("animationKey======", animationKey, "characterStage======", characterStage);
  
  // Map character stages to their appropriate character names for animations
  const getCharacterNameForAnimation = (stage: string): string => {
    switch (stage) {
      case 'tamago':
        return 'tamago'; // Egg stage
      case 'kodomo1':
        return '1'; // Early child stage
      case 'kodomo2':
        return '2'; // Mid child stage
      case 'kodomo3':
        return '3'; // Late child stage
      case 'otona1':
        return 'otona1'; // Healthy adult
      case 'otona2':
        return 'otona2'; // Blank expression adult
      default:
        return '1'; // Default fallback
    }
  };

  const characterName = getCharacterNameForAnimation(characterStage);
  const animationName = ANIMATIONS[animationKey];
  
  // Construct the path: /character/{animation}/{characterName}.json
  if(characterName === 'tamago') {
    return `/charactor/neutral/tamago.json`;
  }
  if(characterName === 'kodomo1') {
    return `/charactor/happy/kodomo1.json`;
  }
  if(characterName === 'otona1') {
    return `/charactor/neutral/otona1.json`;
  }
  if(characterName === 'otona2') {
    return `/charactor/neutral/otona2.json`;
  }
  return `/templates/${animationName}/${characterName}.json`;
};

export default function LottieCharacter({
  className,
  size = 200,
  healthLevel,
  totalLogs,
  streak,
  recentMood,
  isInteracting = false,
  animationKey
}: LottieCharacterProps) {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationKey>('greeting');
  const [isLoading, setIsLoading] = useState(false);
  
  const characterStage = useMemo(() => 
    getCharacterStage(totalLogs, streak, healthLevel), 
    [totalLogs, streak, healthLevel]
  );

  console.log("recentmood======", recentMood)

  // Update animation when animationKey prop changes
  useEffect(() => {
    if (animationKey && animationKey !== currentAnimation) {
      setIsLoading(true);
      setCurrentAnimation(animationKey);
      // Reset loading state after a brief delay to allow animation to load
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animationKey, currentAnimation]);

  const animationSrc = useMemo(() => {
    // If we have a specific animation key, use it; otherwise fall back to mood-based system
    if (animationKey) {
      return getCharacterExpressionByAnimation(animationKey, characterStage);
    }
    return getCharacterExpression(characterStage, recentMood || 'neutral');
  }, [animationKey, characterStage, recentMood]);
  console.log("animationSrc======", animationSrc)

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

  // Get animation description for accessibility
  const getAnimationDescription = (animationKey: AnimationKey): string => {
    const descriptions = {
      banzai: "Character cheering energetically",
      folddown: "Character looking dejected",
      greeting: "Character waving hello",
      jump: "Character jumping with excitement",
      pose: "Character striking a confident pose",
      pose1: "Character in a different pose",
      shark: "Character in a fun or playful pose",
      sit: "Character sitting down",
      sit1: "Character in a different sitting position",
      tilt: "Character tilting head curiously",
      turn: "Character turning around"
    };
    return descriptions[animationKey] || "Character animation";
  };

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
        role="img"
        aria-label={getAnimationDescription(currentAnimation)}
      >
        {/* Interaction effects */}
        {isInteracting && (
          <>
            <div className="absolute inset-0 rounded-full bg-character-primary/20 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-character-secondary/20 animate-pulse" />
          </>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 rounded-full">
            <div className="w-8 h-8 border-2 border-character-primary border-t-transparent rounded-full animate-spin" />
          </div>
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

// Export character stage calculation and animation types for external use
export { getCharacterStage, ANIMATIONS, type AnimationKey };
