import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Smile, Utensils, Save, Loader2 } from 'lucide-react';
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
    sleep: 8,
    water: 8,
    foodItems: []
  });

  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const moodOptions: Array<{ value: MoodType; label: string; emoji: string }> = [
    { value: 'excited', label: getMoodLabel('excited'), emoji: getMoodEmoji('excited') },
    { value: 'happy', label: getMoodLabel('happy'), emoji: getMoodEmoji('happy') },
    { value: 'neutral', label: getMoodLabel('neutral'), emoji: getMoodEmoji('neutral') },
    { value: 'sad', label: getMoodLabel('sad'), emoji: getMoodEmoji('sad') },
    { value: 'anxious', label: getMoodLabel('anxious'), emoji: getMoodEmoji('anxious') },
  ];



  const resetForm = () => {
    setLogData({
      mood: 'neutral' as MoodType,
      energy: 5,
      sleep: 8,
      water: 8,
      foodItems: []
    });
    setFoodInput('');
    setError(null);
    setSuccessMessage(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-health-green" />
            健康データを記録
          </DialogTitle>
          <DialogDescription>
            毎日の健康指標を記録して、あなたのキャラクターを成長させましょう！
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive whitespace-pre-line">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-health-green/10 border border-health-green/20 rounded-md p-3 text-sm text-health-green font-medium">
            {successMessage}
          </div>
        )}

        <Tabs defaultValue="basic" className="space-y-4 h-auto">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="basic">基本データ</TabsTrigger>
            <TabsTrigger value="mood">気分・エネルギー</TabsTrigger>
            <TabsTrigger value="food">食事・メモ</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">体重 (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70.0"
                  value={logData.weight || ''}
                  onChange={(e) => setLogData(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sleep">睡眠時間（時間）</Label>
                <Input
                  id="sleep"
                  type="number"
                  min="0"
                  max="24"
                  value={logData.sleep}
                  onChange={(e) => setLogData(prev => ({ ...prev, sleep: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="water">水分摂取（コップ）</Label>
                <Input
                  id="water"
                  type="number"
                  min="0"
                  max="20"
                  value={logData.water}
                  onChange={(e) => setLogData(prev => ({ ...prev, water: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>エネルギーレベル（1-10）</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">1</span>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={logData.energy}
                    onChange={(e) => setLogData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm">10</span>
                </div>
                <p className="text-center text-sm font-medium">{logData.energy}/10</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Smile className="w-4 h-4" />
                今日の気分はいかがですか？
              </Label>
              
              <RadioGroup
                value={logData.mood}
                onValueChange={(value) => setLogData(prev => ({ ...prev, mood: value as MoodType }))}
                className="grid grid-cols-1 gap-3"
              >
                {moodOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4" />
                  今日は何を食べましたか？
                </Label>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="例：グリルチキンサラダ"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFoodItem()}
                  />
                  <Button type="button" onClick={addFoodItem} variant="outline">
                    追加
                  </Button>
                </div>
                
                {logData.foodItems && logData.foodItems.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">食事内容：</Label>
                    <div className="space-y-1">
                      {logData.foodItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFoodItem(index)}
                            className="h-auto p-1 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">追加メモ</Label>
                <Textarea
                  id="notes"
                  placeholder="今日の体調はいかがでしたか？気になる症状や観察事項があれば記録してください。"
                  value={logData.notes || ''}
                  onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {(logData.notes || '').length}/500文字
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1 flex items-center gap-2"
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
