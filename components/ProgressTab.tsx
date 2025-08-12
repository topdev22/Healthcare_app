import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MessageCircle, Camera } from 'lucide-react';
import { HealthIcons } from '@/components/CharacterFaces';
import { useDashboard } from '@/hooks/useDashboard';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressTabProps {
  healthLevel?: number; // Optional override
}

export default function ProgressTab({ healthLevel: overrideHealthLevel }: ProgressTabProps) {
  const { currentUser } = useAuth();
  const { progressData, loading: dashboardLoading } = useDashboard(currentUser);
  const { 
    achievements, 
    achievementStats, 
    getRecentAchievements, 
    loading: achievementsLoading 
  } = useAchievements(currentUser);

  const loading = dashboardLoading || achievementsLoading;
  
  // Use override or real data
  const currentLevel = progressData?.characterLevel || 1;
  const experiencePoints = progressData?.experiencePoints || 0;
  const experienceToNextLevel = progressData?.experienceToNextLevel || 100;
  
  // Calculate progress percentage correctly
  const currentLevelExp = experiencePoints; // This is already the experience within current level
  const nextLevelProgress = Math.round((currentLevelExp / 100) * 100); // Progress within current level
  
  const recentAchievements = getRecentAchievements(30); // Last 30 days
  const completedAchievements = achievements.filter(a => a.isCompleted);
  const pendingAchievements = achievements.filter(a => !a.isCompleted);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Character Growth Card */}
      <Card className="glass">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-character-primary" />
            キャラクター成長
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="relative">
              <div className="text-4xl sm:text-6xl float">
                <HealthIcons.Sparkles size={48} className="text-character-primary mx-auto sm:w-16 sm:h-16" />
              </div>
              <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-character-primary to-character-secondary text-xs sm:text-sm">
                レベル {currentLevel}
              </Badge>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">健康サポーター</h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                健康データを記録し続けて、キャラクターを成長させましょう！
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>経験値</span>
                <span>{currentLevelExp}/100</span>
              </div>
              <div className="bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-character-primary to-character-secondary transition-all duration-500 smooth-transition"
                  style={{ width: `${nextLevelProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                次のレベルまであと{experienceToNextLevel}ポイント！
              </p>
            </div>
            
            {/* Achievement Summary */}
            {achievementStats && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-character-primary">
                    {achievementStats.completedAchievements}
                  </div>
                  <div className="text-xs text-muted-foreground">達成済み</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-character-secondary">
                    {achievementStats.totalExperience}
                  </div>
                  <div className="text-xs text-muted-foreground">獲得経験値</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="glass">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>最近の達成項目</span>
            <Badge variant="outline" className="text-xs">
              {achievementStats?.completionRate || 0}% 完了
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 sm:h-64">
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/20 rounded-lg animate-pulse">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                    <div className="w-12 h-6 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : recentAchievements.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentAchievements.slice(0, 5).map((achievement) => (
                  <div key={achievement._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-health-green/10 rounded-lg border border-health-green/20 card-hover">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-health-green/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">{achievement.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium">{achievement.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-health-green/10 text-health-green border-health-green/20 text-xs">
                      +{achievement.experiencePoints} 経験値
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">まだ実績がありません</p>
                <p className="text-xs mt-1">健康データを記録して実績を獲得しましょう！</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pending Achievements */}
      {pendingAchievements.length > 0 && (
        <Card className="glass">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">進行中の実績</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 sm:h-64">
              <div className="space-y-3 sm:space-y-4">
                {pendingAchievements.slice(0, 5).map((achievement) => {
                  const progress = Math.min((achievement.requirement.current / achievement.requirement.target) * 100, 100);
                  return (
                    <div key={achievement._id} className="p-3 sm:p-4 bg-muted/20 rounded-lg border">
                      <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted/40 rounded-full flex items-center justify-center">
                          <span className="text-lg opacity-60">{achievement.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium">{achievement.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.experiencePoints} XP
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>進捗</span>
                          <span>{achievement.requirement.current}/{achievement.requirement.target} {achievement.requirement.unit}</span>
                        </div>
                        <div className="bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-character-primary to-character-secondary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}