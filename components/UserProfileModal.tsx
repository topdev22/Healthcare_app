import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Save, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    gender: '',
    height: '',
    activityLevel: '',
    healthGoals: [] as string[]
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        age: userProfile.age?.toString() || '',
        gender: userProfile.gender || '',
        height: userProfile.height?.toString() || '',
        activityLevel: userProfile.activityLevel || '',
        healthGoals: userProfile.healthGoals || []
      });
    }
  }, [userProfile]);

  const healthGoalOptions = [
    '体重減少',
    '体重増加',
    '筋肉量増加',
    '体力向上',
    'ストレス軽減',
    '睡眠改善',
    '栄養バランス改善',
    '血圧管理',
    '血糖値管理',
    '全体的な健康維持'
  ];

  const handleHealthGoalChange = (goal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: checked 
        ? [...prev.healthGoals, goal]
        : prev.healthGoals.filter(g => g !== goal)
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updateData: any = {
        displayName: formData.displayName,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        activityLevel: formData.activityLevel || undefined,
        healthGoals: formData.healthGoals
      };

      // undefinedの値を除去
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      await updateUserProfile(updateData);
      onClose();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            ユーザープロフィール設定
          </DialogTitle>
          <DialogDescription>
            あなたの情報を設定して、より個人化された健康アドバイスを受けましょう
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本情報</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">お名前</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="お名前を入力してください"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">年齢</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="年齢"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>性別</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">身長 (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="身長"
                  min="100"
                  max="250"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* 活動レベル */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">活動レベル</h3>
            <Select value={formData.activityLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="活動レベルを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">座りがち（運動なし）</SelectItem>
                <SelectItem value="light">軽い活動（週1-3回の軽い運動）</SelectItem>
                <SelectItem value="moderate">適度な活動（週3-5回の運動）</SelectItem>
                <SelectItem value="active">活発（週6-7回の運動）</SelectItem>
                <SelectItem value="very_active">非常に活発（1日2回の運動）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 健康目標 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">健康目標</h3>
            <p className="text-sm text-muted-foreground">該当するものをすべて選択してください</p>
            
            <div className="grid grid-cols-2 gap-3">
              {healthGoalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={formData.healthGoals.includes(goal)}
                    onCheckedChange={(checked) => handleHealthGoalChange(goal, !!checked)}
                  />
                  <Label htmlFor={goal} className="text-sm cursor-pointer">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 flex items-center gap-2">
            {loading ? (
              <>設定保存中...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                プロフィール保存
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
