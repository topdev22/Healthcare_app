import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { Save, User, Camera, Upload, Activity, Target, Loader2 } from 'lucide-react';
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border border-white/30 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-character-primary to-character-secondary flex items-center justify-center shadow-xl">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-character-primary to-character-secondary bg-clip-text text-transparent">
            プロフィール設定
          </DialogTitle>
          <DialogDescription className="text-center">
            あなたの情報を設定して、より個人化された<br />
            健康アドバイスを受けましょう
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Profile Image Section */}
          <Card className="glass border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-health-green" />
                プロフィール画像
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-4 ring-health-green/30 shadow-xl">
                    <AvatarImage src={userProfile?.photoURL} />
                    <AvatarFallback className="bg-gradient-to-br from-health-green to-health-blue text-white text-2xl font-bold">
                      {userProfile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-health-green to-health-blue rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="space-y-3 flex-1">
                  <Label htmlFor="image-upload" className="text-sm font-medium text-muted-foreground">
                    画像をアップロード (JPEG, PNG, 5MB以下)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={imageUploading}
                    className="w-full sm:w-auto glass border-white/30 hover:bg-white/20"
                  >
                    {imageUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-health-green border-t-transparent rounded-full animate-spin mr-2" />
                        アップロード中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
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
            </CardContent>
          </Card>

          {/* Enhanced Basic Information */}
          <Card className="glass border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-health-blue" />
                基本情報
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-medium">お名前</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="お名前を入力してください"
                      className="glass border-white/30 bg-white/50 focus:bg-white/70"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age" className="font-medium">年齢</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="年齢"
                      min="1"
                      max="120"
                      className="glass border-white/30 bg-white/50 focus:bg-white/70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">性別</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="glass border-white/30 bg-white/50">
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
                    <Label htmlFor="height" className="font-medium">身長 (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="身長"
                      min="100"
                      max="250"
                      step="0.1"
                      className="glass border-white/30 bg-white/50 focus:bg-white/70"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Activity Level */}
          <Card className="glass border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-wellness-amber" />
                活動レベル
              </h3>
              <Select value={formData.activityLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}>
                <SelectTrigger className="glass border-white/30 bg-white/50">
                  <SelectValue placeholder="日常の活動レベルを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      座りがち（運動なし）
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      軽い活動（週1-3回の軽い運動）
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      適度な活動（週3-5回の運動）
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      活発（週6-7回の運動）
                    </div>
                  </SelectItem>
                  <SelectItem value="very_active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      非常に活発（1日2回の運動）
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Enhanced Health Goals */}
          <Card className="glass border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-health-green" />
                健康目標
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                あなたの健康目標を選択してください（複数選択可能）
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {healthGoalOptions.map((goal) => (
                  <div key={goal} className="glass border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center space-x-3 p-3">
                      <Checkbox
                        id={goal}
                        checked={formData.healthGoals.includes(goal)}
                        onCheckedChange={(checked) => handleHealthGoalChange(goal, !!checked)}
                      />
                      <Label htmlFor={goal} className="text-sm cursor-pointer font-medium flex-1">
                        {goal}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Goals Summary */}
              {formData.healthGoals.length > 0 && (
                <div className="mt-4 p-3 glass border border-health-green/30 rounded-lg">
                  <p className="text-sm font-medium text-health-green mb-2">選択された目標:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.healthGoals.map((goal, index) => (
                      <Badge key={index} className="bg-health-green/20 text-health-green border-health-green/30">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-6 border-t border-white/20">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 glass border-white/30 hover:bg-white/20"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center gap-2 bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                設定保存中...
              </>
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
