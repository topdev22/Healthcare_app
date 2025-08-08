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

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HealthLogData) => void;
}

interface HealthLogData {
  weight?: number;
  mood: string;
  energy: number;
  sleep: number;
  water: number;
  notes?: string;
  foodItems?: string[];
}

export default function HealthLogModal({ isOpen, onClose, onSave }: HealthLogModalProps) {
  const [logData, setLogData] = useState<HealthLogData>({
    mood: 'neutral',
    energy: 5,
    sleep: 8,
    water: 8,
    foodItems: []
  });

  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const moodOptions = [
    { value: 'excited', label: '興奮', emoji: '🤩' },
    { value: 'happy', label: '幸せ', emoji: '😊' },
    { value: 'neutral', label: '普通', emoji: '😐' },
    { value: 'sad', label: '悲しい', emoji: '😢' },
    { value: 'anxious', label: '不安', emoji: '😰' },
  ];

  // Simple calorie estimation based on common Japanese foods
  const estimateFoodCalories = (foodName: string): number => {
    const lowerFood = foodName.toLowerCase();
    
    // Rice and grains
    if (lowerFood.includes('ご飯') || lowerFood.includes('米')) return 250;
    if (lowerFood.includes('パン') || lowerFood.includes('bread')) return 200;
    if (lowerFood.includes('麺') || lowerFood.includes('うどん') || lowerFood.includes('ラーメン')) return 300;
    
    // Proteins
    if (lowerFood.includes('肉') || lowerFood.includes('チキン') || lowerFood.includes('鶏')) return 200;
    if (lowerFood.includes('魚') || lowerFood.includes('サーモン') || lowerFood.includes('鮭')) return 150;
    if (lowerFood.includes('卵') || lowerFood.includes('たまご')) return 80;
    
    // Vegetables and salads
    if (lowerFood.includes('サラダ') || lowerFood.includes('野菜')) return 50;
    if (lowerFood.includes('果物') || lowerFood.includes('フルーツ')) return 60;
    
    // Common dishes
    if (lowerFood.includes('カレー')) return 400;
    if (lowerFood.includes('寿司')) return 250;
    if (lowerFood.includes('弁当')) return 500;
    
    // Default estimate
    return 150;
  };

  const resetForm = () => {
    setLogData({
      mood: 'neutral',
      energy: 5,
      sleep: 8,
      water: 8,
      foodItems: []
    });
    setFoodInput('');
    setError(null);
    setSuccessMessage(null);
  };

  const validateForm = () => {
    const errors = [];
    
    if (logData.weight && (logData.weight < 20 || logData.weight > 300)) {
      errors.push('体重は20kgから300kgの間で入力してください');
    }
    
    if (logData.sleep < 0 || logData.sleep > 24) {
      errors.push('睡眠時間は0時間から24時間の間で入力してください');
    }
    
    if (logData.water < 0 || logData.water > 20) {
      errors.push('水分摂取は0杯から20杯の間で入力してください');
    }
    
    if (logData.energy < 1 || logData.energy > 10) {
      errors.push('エネルギーレベルは1から10の間で入力してください');
    }

    // Validate food items
    if (logData.foodItems && logData.foodItems.length > 0) {
      const invalidFoodItems = logData.foodItems.filter(item => 
        !item || item.trim().length === 0 || item.trim().length > 100
      );
      if (invalidFoodItems.length > 0) {
        errors.push('食事内容は1文字以上100文字以下で入力してください');
      }
    }

    // Validate notes length
    if (logData.notes && logData.notes.length > 500) {
      errors.push('追加メモは500文字以下で入力してください');
    }
    
    return errors;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate form data
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      setIsLoading(false);
      return;
    }

    try {
      // Save different types of health logs to the backend
      const promises = [];

      // Save weight if provided
      if (logData.weight) {
        promises.push(
          healthAPI.createHealthLog({
            type: 'weight',
            title: '体重記録',
            data: { weight: logData.weight },
            date: new Date().toISOString()
          })
        );
      }

      // Save mood
      promises.push(
        healthAPI.createHealthLog({
          type: 'mood',
          title: '気分記録',
          data: { 
            mood: logData.mood,
            energy: logData.energy
          },
          date: new Date().toISOString()
        })
      );

      // Save sleep
      promises.push(
        healthAPI.createHealthLog({
          type: 'sleep',
          title: '睡眠記録',
          data: { hours: logData.sleep },
          date: new Date().toISOString()
        })
      );

      // Save water intake (convert glasses to ml)
      promises.push(
        healthAPI.createHealthLog({
          type: 'water',
          title: '水分補給記録',
          data: { 
            amount: logData.water * 250, // Convert glasses to ml (1 glass = 250ml)
            unit: 'ml',
            glasses: logData.water
          },
          date: new Date().toISOString()
        })
      );

      // Save food items if any
      if (logData.foodItems && logData.foodItems.length > 0) {
        for (const foodItem of logData.foodItems) {
          // Estimate calories based on common foods (basic estimation)
          const estimatedCalories = estimateFoodCalories(foodItem);
          
          promises.push(
            healthAPI.createHealthLog({
              type: 'food',
              title: '食事記録',
              description: foodItem,
              data: { 
                name: foodItem,
                hasPhoto: false,
                calories: estimatedCalories,
                meal: 'other' // Could be enhanced to detect meal type
              },
              date: new Date().toISOString()
            })
          );
        }
      }

      // Save notes as a general health log if provided
      if (logData.notes && logData.notes.trim()) {
        promises.push(
          healthAPI.createHealthLog({
            type: 'other',
            title: '健康メモ',
            description: logData.notes,
            data: {},
            date: new Date().toISOString()
          })
        );
      }

      // Execute all API calls
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
                onValueChange={(value) => setLogData(prev => ({ ...prev, mood: value }))}
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
