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
    weight?: number;
    mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
    calories?: number;
    date: string;
  }>;
}

type TimePeriod = '7days' | '30days' | '90days';

export default function HealthStatsModal({ isOpen, onClose, healthData }: HealthStatsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');

  const getPeriodData = (period: TimePeriod) => {
    const now = new Date();
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return healthData.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const filteredData = useMemo(() => getPeriodData(selectedPeriod), [selectedPeriod, healthData]);

  const statistics = useMemo(() => {
    const weights = filteredData.filter(d => d.weight).map(d => d.weight!);
    const calories = filteredData.filter(d => d.calories).map(d => d.calories!);
    
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

    // 気分統計
    const moodCounts = filteredData.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b, ['neutral', 0]
    );

    return {
      weightStats,
      calorieStats,
      moodCounts,
      mostCommonMood: mostCommonMood[0],
      totalEntries: filteredData.length,
      daysWithData: filteredData.length,
      consistency: (filteredData.length / (selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90)) * 100
    };
  }, [filteredData, selectedPeriod]);

  const getMoodName = (mood: string) => {
    const names = {
      happy: '幸せ',
      excited: '興奮',
      neutral: '普通',
      anxious: '不安',
      sad: '悲しい'
    };
    return names[mood as keyof typeof names] || mood;
  };

  const getPeriodName = (period: TimePeriod) => {
    return period === '7days' ? '7日間' : period === '30days' ? '30日間' : '90日間';
  };

  // 簡易チャート用のデータ
  const chartData = useMemo(() => {
    const last7Days = filteredData.slice(-7);
    return last7Days.map((entry, index) => ({
      day: index + 1,
      weight: entry.weight || null,
      calories: entry.calories || null,
      mood: entry.mood
    }));
  }, [filteredData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-health-blue" />
            健康統計データ
          </DialogTitle>
          <DialogDescription>
            あなたの健康データの詳細な分析と傾向を確認できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 期間選択 */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">表示期間:</span>
            <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7日間</SelectItem>
                <SelectItem value="30days">30日間</SelectItem>
                <SelectItem value="90days">90日間</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="weight">体重</TabsTrigger>
              <TabsTrigger value="mood">気分</TabsTrigger>
              <TabsTrigger value="calories">カロリー</TabsTrigger>
            </TabsList>

            {/* 概要タブ */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      記録状況
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{statistics.daysWithData}</div>
                        <div className="text-xs text-muted-foreground">記録日数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{statistics.consistency.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">継続率</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-health-green" />
                      主な気分
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="flex justify-center">
                        {React.createElement(MoodIcons[statistics.mostCommonMood as keyof typeof MoodIcons], { size: 32 })}
                      </div>
                      <div className="font-semibold">{getMoodName(statistics.mostCommonMood)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getPeriodName(selectedPeriod)}で最も多い気分
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-health-blue" />
                      平均値
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {statistics.weightStats && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">体重</span>
                          <span className="text-sm font-medium">{statistics.weightStats.average.toFixed(1)}kg</span>
                        </div>
                      )}
                      {statistics.calorieStats && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">カロリー</span>
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
                  <CardTitle className="text-lg">最近7日間の傾向</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 体重チャート */}
                    {statistics.weightStats && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">体重の変化</h4>
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
                      <CardTitle className="text-lg">体重統計</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{statistics.weightStats.average.toFixed(1)}kg</div>
                          <div className="text-xs text-muted-foreground">平均体重</div>
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
                          <div className="text-xs text-muted-foreground">変化量</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">最高値</span>
                          <span className="font-medium">{statistics.weightStats.max}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">最低値</span>
                          <span className="font-medium">{statistics.weightStats.min}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">変動幅</span>
                          <span className="font-medium">{(statistics.weightStats.max - statistics.weightStats.min).toFixed(1)}kg</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">目標との比較</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-4xl">🎯</div>
                        <p className="text-sm text-muted-foreground">
                          プロフィール設定で目標体重を設定すると、<br />
                          ここに進捗が表示されます
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
                      体重データがまだ記録されていません。<br />
                      健康ログから体重を記録してみましょう！
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 気分タブ */}
            <TabsContent value="mood" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">気分の分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.moodCounts).map(([mood, count]) => (
                      <div key={mood} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {React.createElement(MoodIcons[mood as keyof typeof MoodIcons], { size: 20 })}
                          <span className="text-sm">{getMoodName(mood)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{count}回</Badge>
                          <div className="text-xs text-muted-foreground">
                            {((count / statistics.totalEntries) * 100).toFixed(1)}%
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
                      <CardTitle className="text-lg">カロリー統計</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{Math.round(statistics.calorieStats.average)}</div>
                          <div className="text-xs text-muted-foreground">平均kcal/日</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">{statistics.calorieStats.total.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">総摂取kcal</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">最高摂取量</span>
                          <span className="font-medium">{statistics.calorieStats.max}kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">最低摂取量</span>
                          <span className="font-medium">{statistics.calorieStats.min}kcal</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">カロリー目標</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-4xl">🔥</div>
                        <p className="text-sm text-muted-foreground">
                          プロフィール設定で目標カロリーを設定すると、<br />
                          ここに進捗が表示されます
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
                      カロリーデータがまだ記録されていません。<br />
                      食事記録からカロリーを記録してみましょう！
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
