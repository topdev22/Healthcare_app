import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Smile, Utensils, Save, Loader2, Heart, Moon, Droplet, Zap, AlertCircle } from 'lucide-react';
import { healthAPI } from '@/lib/api';
import { triggerCharacterRefresh } from '@/lib/characterHelpers';
import {
  HealthLogFormData,
  MoodType
} from '@/shared/types/health';
import {
  transformFormDataToApiRequests,
  validateFormData,
  getMoodEmoji,
  getMoodLabel
} from '@/lib/healthHelpers';

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HealthLogFormData) => void;
}

export default function HealthLogModal({ isOpen, onClose, onSave }: HealthLogModalProps) {
  const [logData, setLogData] = useState<HealthLogFormData>({
    weight: undefined,
    height: undefined,
    bmi: undefined,
    bmr: undefined,
    calories: undefined,
    tdee: undefined,
    mood: 'neutral' as MoodType,
    energy: 5,
    sleep: undefined, // Start empty for fresh daily entry
    water: undefined, // Start empty for fresh daily entry
    foodItems: []
  });

  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTodayData, setLoadingTodayData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [todayDataLoaded, setTodayDataLoaded] = useState(false);

  const moodOptions: Array<{ value: MoodType; label: string; emoji: string }> = [
    { value: 'excited', label: getMoodLabel('excited'), emoji: getMoodEmoji('excited') },
    { value: 'happy', label: getMoodLabel('happy'), emoji: getMoodEmoji('happy') },
    { value: 'neutral', label: getMoodLabel('neutral'), emoji: getMoodEmoji('neutral') },
    { value: 'sad', label: getMoodLabel('sad'), emoji: getMoodEmoji('sad') },
    { value: 'anxious', label: getMoodLabel('anxious'), emoji: getMoodEmoji('anxious') },
  ];



  const resetForm = () => {
    setLogData({
      weight: undefined,
      height: undefined,
      bmi: undefined,
      bmr: undefined,
      calories: undefined,
      tdee: undefined,
      mood: 'neutral' as MoodType,
      energy: 5,
      sleep: undefined, // Start empty for fresh daily entry
      water: undefined, // Start empty for fresh daily entry
      foodItems: []
    });
    setFoodInput('');
    setError(null);
    setSuccessMessage(null);
    setTodayDataLoaded(false);
  };

  // Load today's existing data when modal opens
  const loadTodayData = async () => {
    if (!isOpen || todayDataLoaded) return;

    try {
      setLoadingTodayData(true);
      
      // Get today's health logs
      const today = new Date().toDateString();
      const response = await healthAPI.getHealthLogs(50, 0);
      const todayLogs = response.data?.filter((log: any) =>
        new Date(log.date).toDateString() === today
      ) || [];

      // Pre-populate form with today's existing data
      const todayWeight = todayLogs.find((log: any) => log.type === 'weight')?.data?.weight;
      const todayMood = todayLogs.find((log: any) => log.type === 'mood')?.data?.mood || 'neutral';
      const todayEnergy = todayLogs.find((log: any) => log.type === 'mood')?.data?.energy || 5;
      const todaySleep = todayLogs.find((log: any) => log.type === 'sleep')?.data?.hours;
      const todayWaterLogs = todayLogs.filter((log: any) => log.type === 'water');
      const todayWaterGlasses = todayWaterLogs.reduce((sum: number, log: any) =>
        sum + (log.data?.glasses || Math.round((log.data?.amount || 0) / 250)), 0
      );

      const todayFoodItems = todayLogs
        .filter((log: any) => log.type === 'food')
        .map((log: any) => log.data?.name || log.description)
        .filter(Boolean);

      setLogData(prev => ({
        ...prev,
        weight: todayWeight,
        mood: todayMood as MoodType,
        energy: todayEnergy,
        sleep: todaySleep,
        water: todayWaterGlasses > 0 ? todayWaterGlasses : undefined,
        foodItems: todayFoodItems
      }));

      setTodayDataLoaded(true);
      
    } catch (err) {
      console.error('Failed to load today\'s data:', err);
      // Continue with empty form if loading fails
    } finally {
      setLoadingTodayData(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate form data
    const validation = validateFormData(logData);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      setIsLoading(false);
      return;
    }

    try {
      // Transform form data to API requests
      const requests = transformFormDataToApiRequests(logData);

      // Execute all API calls
      const promises = requests.map(request => healthAPI.createHealthLog(request));
      const results = await Promise.all(promises);

      // Show success message
      const savedCount = results.filter(result => result?.success).length;
      setSuccessMessage(`✅ ${savedCount}件の健康ログを正常に保存しました！`);

      // Trigger character refresh
      triggerCharacterRefresh();

      // Call original onSave callback for any additional handling
      onSave(logData);
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);

    } catch (err) {
      console.error('健康ログの保存に失敗しました:', err);
      setError('健康ログの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const addFoodItem = () => {
    if (foodInput.trim()) {
      setLogData(prev => ({
        ...prev,
        foodItems: [...(prev.foodItems || []), foodInput.trim()]
      }));
      setFoodInput('');
    }
  };

  const removeFoodItem = (index: number) => {
    setLogData(prev => ({
      ...prev,
      foodItems: prev.foodItems?.filter((_, i) => i !== index) || []
    }));
  };

  // Load today's data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadTodayData();
    } else {
      // Reset when modal closes
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border border-white/30 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-health-green to-health-blue flex items-center justify-center shadow-xl">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
            健康データを記録
          </DialogTitle>
          <DialogDescription className="text-center">
            毎日の健康指標を記録して、あなたのキャラクターを成長させましょう！<br />
            継続することで健康習慣が身につきます。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="glass border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="glass border-health-green/50 bg-health-green/10">
            <Heart className="h-4 w-4 text-health-green" />
            <AlertDescription className="text-health-green font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 glass border border-white/30 h-12">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-health-green data-[state=active]:to-health-blue data-[state=active]:text-white"
            >
              <Scale className="w-4 h-4 mr-2" />
              基本データ
            </TabsTrigger>
            <TabsTrigger
              value="mood"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-character-primary data-[state=active]:to-character-secondary data-[state=active]:text-white"
            >
              <Smile className="w-4 h-4 mr-2" />
              気分・エネルギー
            </TabsTrigger>
            <TabsTrigger
              value="food"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-wellness-amber data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              <Utensils className="w-4 h-4 mr-2" />
              食事・メモ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="glass border border-white/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-health-blue" />
                    <Label htmlFor="weight" className="font-medium">体重 (kg)</Label>
                  </div>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70.0"
                    value={logData.weight || ''}
                    onChange={(e) => setLogData(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </CardContent>
              </Card>
              
              <Card className="glass border border-white/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4 text-character-primary" />
                    <Label htmlFor="sleep" className="font-medium">睡眠時間（時間）</Label>
                  </div>
                  <Input
                    id="sleep"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="8.0"
                    value={logData.sleep || ''}
                    onChange={(e) => setLogData(prev => ({ ...prev, sleep: parseFloat(e.target.value) || undefined }))}
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </CardContent>
              </Card>
              
              <Card className="glass border border-white/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="water" className="font-medium">水分摂取（コップ）</Label>
                  </div>
                  <Input
                    id="water"
                    type="number"
                    min="0"
                    max="20"
                    placeholder="8"
                    value={logData.water || ''}
                    onChange={(e) => setLogData(prev => ({ ...prev, water: parseInt(e.target.value) || undefined }))}
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </CardContent>
              </Card>
              
              <Card className="glass border border-white/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-wellness-amber" />
                    <Label className="font-medium">エネルギーレベル（1-10）</Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">1</span>
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        value={logData.energy}
                        onChange={(e) => setLogData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">10</span>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-wellness-amber/20 text-wellness-amber border-wellness-amber/30">
                        {logData.energy}/10
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-5">
            <Card className="glass border border-white/30">
              <CardContent className="p-5">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Smile className="w-5 h-5 text-character-primary" />
                  今日の気分はいかがですか？
                </Label>
                
                <RadioGroup
                  value={logData.mood}
                  onValueChange={(value) => setLogData(prev => ({ ...prev, mood: value as MoodType }))}
                  className="grid grid-cols-1 gap-3"
                >
                  {moodOptions.map((option) => (
                    <div key={option.value} className="glass border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-4 p-4">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex items-center gap-4 cursor-pointer flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-character-primary/20 to-character-secondary/20 flex items-center justify-center">
                            <span className="text-2xl">{option.emoji}</span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{option.label}</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.value === 'excited' ? '非常に良い気分です' :
                               option.value === 'happy' ? '今日は調子が良いです' :
                               option.value === 'neutral' ? '普通の状態です' :
                               option.value === 'anxious' ? '少し不安を感じています' :
                               '気分が沈んでいます'}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="food" className="space-y-5">
            <Card className="glass border border-white/30">
              <CardContent className="p-5 space-y-5">
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Utensils className="w-5 h-5 text-wellness-amber" />
                    今日は何を食べましたか？
                  </Label>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="例：グリルチキンサラダ、玄米、野菜スープ"
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFoodItem()}
                      className="glass border-white/30 bg-white/50 focus:bg-white/70"
                    />
                    <Button
                      type="button"
                      onClick={addFoodItem}
                      className="bg-gradient-to-r from-wellness-amber to-orange-500 hover:from-wellness-amber/90 hover:to-orange-500/90 text-white"
                    >
                      追加
                    </Button>
                  </div>
                  
                  {logData.foodItems && logData.foodItems.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">今日の食事：</Label>
                      <div className="space-y-2">
                        {logData.foodItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 glass border border-white/20 rounded-lg">
                            <span className="text-sm font-medium">{item}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFoodItem(index)}
                              className="h-auto p-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="notes" className="font-medium">今日の健康メモ</Label>
                  <Textarea
                    id="notes"
                    placeholder="今日の体調はいかがでしたか？気になる症状や観察事項があれば記録してください。"
                    value={logData.notes || ''}
                    onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    maxLength={500}
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(logData.notes || '').length}/500文字
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t border-white/20">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 glass border-white/30 hover:bg-white/20"
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 flex items-center gap-2 bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? '保存中...' : '健康ログを保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
