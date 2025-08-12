import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { Save, User, Camera, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { userProfile, updateUserProfile, setUserProfile, currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "ファイル形式エラー",
        description: "JPEGまたはPNG形式の画像ファイルを選択してください。",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ファイルサイズエラー",
        description: "ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。",
        variant: "destructive"
      });
      return;
    }

    setImageUploading(true);
    try {
      const response = await userAPI.uploadProfileImage(file);
      if (response.success && response.data.user) {
        console.log('Profile image uploaded successfully:', response.data.photoURL);
        
        // Update the profile state directly with the new user data from the server
        // This will automatically update all UI components that display user profile
        setUserProfile(response.data.user);
        
        // Show success toast
        toast({
          title: "アップロード成功",
          description: "プロフィール画像を正常にアップロードしました。",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Profile image upload failed:', error);
      toast({
        title: "アップロードエラー",
        description: "プロフィール画像のアップロードに失敗しました。もう一度お試しください。",
        variant: "destructive"
      });
    } finally {
      setImageUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updateData: any = {};

      // Only include displayName if it's not empty
      if (formData.displayName && formData.displayName.trim() !== '') {
        updateData.displayName = formData.displayName.trim();
      }

      // Only include age if it's a valid number
      if (formData.age && formData.age.trim() !== '') {
        const ageNum = parseInt(formData.age);
        if (!isNaN(ageNum) && ageNum > 0) {
          updateData.age = ageNum;
        }
      }

      // Only include gender if it's selected
      if (formData.gender && formData.gender.trim() !== '') {
        updateData.gender = formData.gender;
      }

      // Only include height if it's a valid number  
      if (formData.height && formData.height.trim() !== '') {
        const heightNum = parseFloat(formData.height);
        if (!isNaN(heightNum) && heightNum > 0) {
          updateData.height = heightNum;
        }
      }

      // Only include activityLevel if it's selected
      if (formData.activityLevel && formData.activityLevel.trim() !== '') {
        updateData.activityLevel = formData.activityLevel;
      }

      // Only include healthGoals if there are any
      if (formData.healthGoals && formData.healthGoals.length > 0) {
        updateData.healthGoals = formData.healthGoals.filter(goal => goal && goal.trim() !== '');
      }

      // console.log('Processed update data:', updateData);

      // Ensure we have at least displayName to update
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "入力エラー",
          description: "更新するデータがありません。少なくとも表示名を入力してください。",
          variant: "destructive"
        });
        return;
      }

      // Ensure displayName is provided (required field)
      if (!updateData.displayName) {
        toast({
          title: "入力エラー",
          description: "表示名は必須です。",
          variant: "destructive"
        });
        return;
      }

      await updateUserProfile(updateData);
      
      // Show success toast
      toast({
        title: "更新成功",
        description: "プロフィールを正常に更新しました。",
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      
      // Parse error message if available
      let errorMessage = 'プロフィールの更新に失敗しました。入力内容を確認してください。';
      
      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          errorMessage = '入力データの検証に失敗しました。すべての項目を正しく入力してください。';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = '認証エラーが発生しました。再度ログインしてください。';
        }
      }
      
      toast({
        title: "更新エラー",
        description: errorMessage,
        variant: "destructive"
      });
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
          {/* プロフィール画像 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">プロフィール画像</h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                <AvatarImage src={userProfile?.photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-character-primary to-character-secondary text-white text-lg">
                  {userProfile?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <Label htmlFor="image-upload" className="text-sm font-medium">
                  画像をアップロード (JPEG, PNG, 5MB以下)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={imageUploading}
                    className="flex items-center gap-2"
                  >
                    {imageUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        アップロード中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        画像を選択
                      </>
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

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
