import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Target, Activity } from 'lucide-react';
import { MoodIcons } from '@/components/CharacterFaces';

interface HealthStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: Array<{
    _id?: string;
    type?: string;
    title?: string;
    data?: any;
    weight?: number;
    mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
    calories?: number;
    date: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

type TimePeriod = '7days' | '30days' | '90days';

export default function HealthStatsModal({ isOpen, onClose, healthData }: HealthStatsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');

  const getPeriodData = (period: TimePeriod) => {
    if (!healthData || !Array.isArray(healthData)) {
      return [];
    }
    
    const now = new Date();
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return healthData.filter(entry => {
      if (!entry || !entry.date) return false;
      try {
        return new Date(entry.date) >= cutoffDate;
      } catch {
        return false;
      }
    });
  };

  const filteredData = useMemo(() => getPeriodData(selectedPeriod), [selectedPeriod, healthData]);

  const statistics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        weightStats: null,
        calorieStats: null,
        moodCounts: {},
        mostCommonMood: 'neutral',
        totalEntries: 0,
        daysWithData: 0,
        consistency: 0
      };
    }

    // Extract weight data - check both direct weight field and data.weight
    const weights = filteredData
      .map(d => d.weight || (d.data?.weight) || (d.type === 'weight' ? d.data?.amount : null))
      .filter(w => w != null && typeof w === 'number') as number[];
    
    // Extract calorie data - check both direct calories field and data.calories
    const calories = filteredData
      .map(d => d.calories || (d.data?.calories) || (d.type === 'food' ? d.data?.calories : null))
      .filter(c => c != null && typeof c === 'number') as number[];
    
    // 体重統計
    const weightStats = weights.length > 0 ? {
      average: weights.reduce((a, b) => a + b, 0) / weights.length,
      min: Math.min(...weights),
      max: Math.max(...weights),
      trend: weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0
    } : null;

    // カロリー統計
    const calorieStats = calories.length > 0 ? {
      average: calories.reduce((a, b) => a + b, 0) / calories.length,
      min: Math.min(...calories),
      max: Math.max(...calories),
      total: calories.reduce((a, b) => a + b, 0)
    } : null;

    // 気分統計 - handle mood from different sources
    const moodCounts = filteredData.reduce((acc, entry) => {
      let mood = entry.mood || (entry.data?.mood) || (entry.type === 'mood' ? entry.data?.mood : null);
      if (mood && typeof mood === 'string') {
        acc[mood] = (acc[mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const moodEntries = Object.entries(moodCounts);
    const mostCommonMood = moodEntries.length > 0 
      ? moodEntries.reduce((a, b) => moodCounts[a[0]] > moodCounts[b[0]] ? a : b, ['neutral', 0])
      : ['neutral', 0];

    return {
      weightStats,
      calorieStats,
      moodCounts,
      mostCommonMood: String(mostCommonMood[0]), // Ensure it's a string
      totalEntries: filteredData.length,
      daysWithData: filteredData.length,
      consistency: (filteredData.length / (selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90)) * 100
    };
  }, [filteredData, selectedPeriod]);

  const getMoodName = (mood: string) => {
    const names = {
      happy: 'Happy',
      excited: 'Excited',
      neutral: 'Neutral',
      anxious: 'Anxious',
      sad: 'Sad'
    };
    return names[mood as keyof typeof names] || mood;
  };

  const getPeriodName = (period: TimePeriod) => {
    return period === '7days' ? '7 Days' : period === '30days' ? '30 Days' : '90 Days';
  };

  // 簡易チャート用のデータ
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }
    
    const last7Days = filteredData.slice(-7);
    return last7Days.map((entry, index) => ({
      day: index + 1,
      weight: entry.weight || (entry.data?.weight) || (entry.type === 'weight' ? entry.data?.amount : null),
      calories: entry.calories || (entry.data?.calories) || (entry.type === 'food' ? entry.data?.calories : null),
      mood: entry.mood || (entry.data?.mood) || (entry.type === 'mood' ? entry.data?.mood : null)
    }));
  }, [filteredData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-health-blue" />
            Health Statistics
          </DialogTitle>
          <DialogDescription>
            View detailed analysis and trends of your health data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Time Period:</span>
            <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="mood">Mood</TabsTrigger>
              <TabsTrigger value="calories">Calories</TabsTrigger>
            </TabsList>

            {/* 概要タブ */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Recording Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{statistics.daysWithData}</div>
                        <div className="text-xs text-muted-foreground">Days Recorded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{statistics.consistency.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Consistency</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-health-green" />
                      Main Mood
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="flex justify-center">
                        {statistics.mostCommonMood && MoodIcons[statistics.mostCommonMood as keyof typeof MoodIcons] 
                          ? React.createElement(MoodIcons[statistics.mostCommonMood as keyof typeof MoodIcons], { size: 32 })
                          : <div className="text-2xl">😐</div>
                        }
                      </div>
                      <div className="font-semibold">{getMoodName(statistics.mostCommonMood)}</div>
                      <div className="text-xs text-muted-foreground">
                        Most common mood in {getPeriodName(selectedPeriod)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-health-blue" />
                      Averages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {statistics.weightStats && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Weight</span>
                          <span className="text-sm font-medium">{statistics.weightStats.average.toFixed(1)}kg</span>
                        </div>
                      )}
                      {statistics.calorieStats && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Calories</span>
                          <span className="text-sm font-medium">{Math.round(statistics.calorieStats.average)}kcal</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 簡易チャート */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent 7-Day Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 体重チャート */}
                    {statistics.weightStats && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Weight Changes</h4>
                        <div className="flex items-end gap-2 h-20">
                          {chartData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div className="w-full bg-muted rounded-t">
                                {data.weight && (
                                  <div
                                    className="bg-health-blue rounded-t transition-all duration-300"
                                    style={{
                                      height: `${((data.weight - statistics.weightStats!.min) / (statistics.weightStats!.max - statistics.weightStats!.min)) * 60 + 10}px`
                                    }}
                                  />
                                )}
                              </div>
                              <div className="text-xs mt-1">{index + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 体重タブ */}
            <TabsContent value="weight" className="space-y-4">
              {statistics.weightStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Weight Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{statistics.weightStats.average.toFixed(1)}kg</div>
                          <div className="text-xs text-muted-foreground">Average Weight</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold flex items-center justify-center gap-1">
                            {statistics.weightStats.trend > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : statistics.weightStats.trend < 0 ? (
                              <TrendingDown className="w-4 h-4 text-health-green" />
                            ) : null}
                            {Math.abs(statistics.weightStats.trend).toFixed(1)}kg
                          </div>
                          <div className="text-xs text-muted-foreground">Change</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Maximum</span>
                          <span className="font-medium">{statistics.weightStats.max}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Minimum</span>
                          <span className="font-medium">{statistics.weightStats.min}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Range</span>
                          <span className="font-medium">{(statistics.weightStats.max - statistics.weightStats.min).toFixed(1)}kg</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Goal Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-4xl">🎯</div>
                        <p className="text-sm text-muted-foreground">
                          Set a target weight in your profile settings<br />
                          to see progress tracking here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-muted-foreground">
                      No weight data has been recorded yet.<br />
                      Try recording your weight in the health log!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 気分タブ */}
            <TabsContent value="mood" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mood Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.moodCounts).map(([mood, count]) => (
                      <div key={mood} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {mood && MoodIcons[mood as keyof typeof MoodIcons] 
                            ? React.createElement(MoodIcons[mood as keyof typeof MoodIcons], { size: 20 })
                            : <span className="text-lg">😐</span>
                          }
                          <span className="text-sm">{getMoodName(mood)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{count} times</Badge>
                          <div className="text-xs text-muted-foreground">
                            {statistics.totalEntries > 0 ? ((count / statistics.totalEntries) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* カロリータブ */}
            <TabsContent value="calories" className="space-y-4">
              {statistics.calorieStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calorie Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{Math.round(statistics.calorieStats.average)}</div>
                          <div className="text-xs text-muted-foreground">Avg kcal/day</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{statistics.calorieStats.total.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Total kcal</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Max Intake</span>
                          <span className="font-medium">{statistics.calorieStats.max}kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Min Intake</span>
                          <span className="font-medium">{statistics.calorieStats.min}kcal</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calorie Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-4xl">🔥</div>
                        <p className="text-sm text-muted-foreground">
                          Set a target calorie goal in your profile settings<br />
                          to see progress tracking here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">🍽️</div>
                    <p className="text-muted-foreground">
                      No calorie data has been recorded yet.<br />
                      Try recording calories from your meal logs!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
