import React, { useState } from 'react';
import LottieCharacter, { getCharacterStage } from '@/components/LottieCharacter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

export default function CharacterGrowthDemo() {
  const [healthLevel, setHealthLevel] = useState([75]);
  const [totalLogs, setTotalLogs] = useState([25]);
  const [streak, setStreak] = useState([5]);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | 'excited' | 'anxious'>('happy');
  const [isInteracting, setIsInteracting] = useState(false);

  const currentStage = getCharacterStage(totalLogs[0], streak[0], healthLevel[0]);

  // Predefined scenarios for quick testing
  const scenarios = [
    {
      name: 'たまご（初心者）',
      healthLevel: 25,
      totalLogs: 3,
      streak: 1,
      mood: 'neutral' as const
    },
    {
      name: 'こども1（成長開始）',
      healthLevel: 45,
      totalLogs: 15,
      streak: 3,
      mood: 'happy' as const
    },
    {
      name: 'こども2（順調な成長）',
      healthLevel: 65,
      totalLogs: 25,
      streak: 7,
      mood: 'excited' as const
    },
    {
      name: 'こども3（もうすぐ大人）',
      healthLevel: 75,
      totalLogs: 40,
      streak: 12,
      mood: 'happy' as const
    },
    {
      name: 'おとな1（健康な大人）',
      healthLevel: 85,
      totalLogs: 60,
      streak: 20,
      mood: 'excited' as const
    },
    {
      name: 'おとな2（無表情・停滞）',
      healthLevel: 35,
      totalLogs: 3,
      streak: 0,
      mood: 'sad' as const
    }
  ];

  const applyScenario = (scenario: typeof scenarios[0]) => {
    setHealthLevel([scenario.healthLevel]);
    setTotalLogs([scenario.totalLogs]);
    setStreak([scenario.streak]);
    setMood(scenario.mood);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>キャラクター成長デモ</CardTitle>
          <CardDescription>
            健康ログの記録数、連続日数、健康レベルによってキャラクターが成長します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Character Display */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <LottieCharacter
                size={200}
                healthLevel={healthLevel[0]}
                totalLogs={totalLogs[0]}
                streak={streak[0]}
                recentMood={mood}
                isInteracting={isInteracting}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  現在のステージ: <span className="font-medium">{currentStage}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Health Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">健康レベル: {healthLevel[0]}%</label>
              <Slider
                value={healthLevel}
                onValueChange={setHealthLevel}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Total Logs */}
            <div className="space-y-2">
              <label className="text-sm font-medium">記録総数: {totalLogs[0]}件</label>
              <Slider
                value={totalLogs}
                onValueChange={setTotalLogs}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Streak */}
            <div className="space-y-2">
              <label className="text-sm font-medium">連続日数: {streak[0]}日</label>
              <Slider
                value={streak}
                onValueChange={setStreak}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <label className="text-sm font-medium">気分</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="happy">幸せ</option>
                <option value="excited">興奮</option>
                <option value="neutral">普通</option>
                <option value="anxious">不安</option>
                <option value="sad">悲しい</option>
              </select>
            </div>
          </div>

          {/* Interaction Toggle */}
          <div className="flex justify-center mb-6">
            <Button
              variant={isInteracting ? "default" : "outline"}
              onClick={() => setIsInteracting(!isInteracting)}
            >
              {isInteracting ? 'インタラクション中' : 'インタラクションを開始'}
            </Button>
          </div>

          {/* Quick Scenarios */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">クイックシナリオ</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {scenarios.map((scenario, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyScenario(scenario)}
                  className="text-xs"
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Growth Logic Explanation */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">成長ロジック</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>たまご</strong>: 記録数 &lt; 10件 または 健康レベル &lt; 30%</li>
              <li>• <strong>こども1</strong>: 記録数 &lt; 20件</li>
              <li>• <strong>こども2</strong>: 記録数 &lt; 35件</li>
              <li>• <strong>こども3</strong>: 記録数 &lt; 50件 または 健康レベル &lt; 70%</li>
              <li>• <strong>おとな1</strong>: 記録数 ≥ 50件 かつ 健康レベル ≥ 70%</li>
              <li>• <strong>おとな2（無表情）</strong>: 連続日数 = 0 かつ 記録数 &lt; 5件 かつ 健康レベル &lt; 40%</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
