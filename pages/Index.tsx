import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Character from '@/components/Character';
import HealthStats from '@/components/HealthStats';
import ChatInterface from '@/components/ChatInterface';
import HealthLogModal from '@/components/HealthLogModal';
import FoodAnalysisModal from '@/components/FoodAnalysisModal';
import AuthModal from '@/components/AuthModal';
import UserProfileModal from '@/components/UserProfileModal';
import HealthStatsModal from '@/components/HealthStatsModal';
import { useAuth } from '@/contexts/AuthContext';
import { HealthIcons } from '@/components/CharacterFaces';
import { healthAPI, chatAPI } from '@/lib/api';
import { 
  Heart, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Sparkles, 
  User, 
  LogOut, 
  Camera,
  Plus,
  TrendingUp,
  Clock,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
}

interface HealthData {
  weight?: number;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  calories?: number;
  date: string;
}

export default function Index() {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [characterMood, setCharacterMood] = useState<'happy' | 'neutral' | 'sad' | 'sleeping'>('happy');
  const [healthLevel, setHealthLevel] = useState(85);
  const [isCharacterInteracting, setIsCharacterInteracting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "こんにちは！私はあなた��健康管理パートナーです！🌟 今日の体調はいかがですか？あなたの健康な生活をサポートするためにここにいます！",
      sender: 'character',
      timestamp: new Date()
    }
  ]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isHealthLogModalOpen, setIsHealthLogModalOpen] = useState(false);
  const [isFoodAnalysisModalOpen, setIsFoodAnalysisModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthStatsModalOpen, setIsHealthStatsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 健康データをバックエンドから取得
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Haptic feedback helper
  const triggerHaptics = async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      // Silently ignore if haptics not available
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 健康データを読み込み
  useEffect(() => {
    if (currentUser) {
      loadHealthData();
    }
  }, [currentUser]);

  const loadHealthData = async () => {
    try {
      const response = await healthAPI.getHealthLogs();
      // healthAPI.getHealthLogs() returns { success: true, data: logs, pagination: {...} }
      // We need to extract the data array
      const data = response.data || [];
      setHealthData(data);
    } catch (error) {
      console.error('Health data loading error:', error);
      // エラーの場合はサンプルデータを表示
      setHealthData([
        { mood: 'happy', weight: 70.2, calories: 1850, date: new Date().toISOString() },
        { mood: 'neutral', weight: 70.5, date: new Date(Date.now() - 24*60*60*1000).toISOString() },
      ]);
    }
  };

  // ユーザーがログインしていない場合は認証モーダルを表示
  useEffect(() => {
    if (!loading && !currentUser) {
      setIsAuthModalOpen(true);
    }
  }, [currentUser, loading]);

  const handleSendMessage = async (message: string) => {
    await triggerHaptics(ImpactStyle.Light);
    
    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoadingResponse(true);
    setIsCharacterInteracting(true);

    try {
      // バックエンドのGPT APIを呼び出し、ユーザープロフィール情報を含める
      const response = await chatAPI.sendMessage(message, userProfile);
      
      const characterResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'character',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, characterResponse]);
      setCharacterMood('happy');
      await triggerHaptics(ImpactStyle.Light);
    } catch (error) {
      console.error('チャットエラー:', error);
      
      // エラーの場合はフォールバック応答
      const userContext = userProfile ? `${userProfile.displayName}さん` : 'あなた';
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `${userContext}、申し訳ございません。現在サーバーに接続できません。しばらく時間をおいてから再度お試しください。`,
        sender: 'character',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoadingResponse(false);
      setIsCharacterInteracting(false);
    }
  };

  const handleLogHealth = async () => {
    await triggerHaptics();
    setIsHealthLogModalOpen(true);
  };

  const handleSaveHealthLog = async (data: any) => {
    try {
      await triggerHaptics(ImpactStyle.Heavy);
      // バックエンドに健康ログを保存
      await healthAPI.createHealthLog(data);
      
      // 健康データを再読み込み
      await loadHealthData();
      
      // 継続的な記録に基づいてキャラクターの健康レベルを更新
      setHealthLevel(prev => Math.min(100, prev + 5));
      setCharacterMood('happy');
      
      // 成功フィードバックを表示
      const successMessage: Message = {
        id: Date.now().toString(),
        content: "健康データの記録、お疲れ様でした！🌟 ご自身の健康に気を配っていらっしゃる姿勢が素晴らしいです。あなたの継続的な努力が私の成長にも繋がっています！",
        sender: 'character',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('健康ログ保存エラー:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "申し訳ございません。健康データの保存に失敗しました。ネットワーク接続を確認してから再度お試しください。",
        sender: 'character',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleTakePhoto = async () => {
    await triggerHaptics();
    setIsFoodAnalysisModalOpen(true);
  };

  const handleSaveFoodData = async (data: any) => {
    try {
      await triggerHaptics(ImpactStyle.Heavy);
      // バックエンドに食事データを保存
      await healthAPI.saveFoodData(data);
      
      // 食事記録の成功メッセージ
      const foodMessage: Message = {
        id: Date.now().toString(),
        content: `お食事の記録ありがとうございます！📸 ${data.totalCalories}kcalの食事を確認しました。バランスの良い食事を心がけていらっしゃいますね！`,
        sender: 'character',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, foodMessage]);
    } catch (error) {
      console.error('食事データ保存エラー:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "申し訳ございません。食事データの保存に失敗しました。ネットワーク接続を確認してから再度お試しください。",
        sender: 'character',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const handleLogout = async () => {
    try {
      await triggerHaptics();
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleTabChange = async (value: string) => {
    await triggerHaptics(ImpactStyle.Light);
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center health-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">ヘルスバディを起動中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen health-bg">
      {/* Enhanced Header with glass morphism */}
      <header className="glass border-b sticky top-0 z-50 safe-area-top">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-health-green to-health-blue flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ヘルスバディ</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">あなた専用の健康管理パートナー</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{getGreeting()}！</p>
                    <p className="text-xs text-muted-foreground">
                      {currentTime.toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="touch-target"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                    
                    <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback className="bg-gradient-to-br from-character-primary to-character-secondary text-white">
                        {userProfile?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="touch-target hidden sm:flex"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-destructive hover:text-destructive touch-target"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} className="touch-target">
                  ログイン
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {currentUser ? (
        <div className="container mx-auto px-4 py-6 space-y-6 safe-area-bottom">
          {/* キャラクターセクション - Enhanced */}
          <Card className="character-bg border-character-primary/20 card-hover overflow-hidden">
            <CardContent className="p-0">
              <Character 
                mood={characterMood}
                healthLevel={healthLevel}
                isInteracting={isCharacterInteracting}
              />
            </CardContent>
          </Card>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-health-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-health-green">{healthLevel}%</p>
                <p className="text-xs text-muted-foreground">健康レベル</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">連続記録日数</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-health-blue mx-auto mb-2" />
                <p className="text-2xl font-bold">2.1k</p>
                <p className="text-xs text-muted-foreground">今日のカロリー</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-6 h-6 text-character-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">レベル3</p>
                <p className="text-xs text-muted-foreground">バディ成長</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs with better mobile UX */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 glass">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 touch-target">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">ダッシュボード</span>
                <span className="sm:hidden">統計</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2 touch-target">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">チャット</span>
                <span className="sm:hidden">会話</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 touch-target">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">成長記録</span>
                <span className="sm:hidden">成長</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <HealthStats 
                recentData={healthData}
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
              />
              
              {/* Enhanced Quick Actions */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    クイックアクション
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-center gap-3 card-hover touch-target"
                      onClick={handleLogHealth}
                    >
                      <div className="w-12 h-12 rounded-full bg-health-green/20 flex items-center justify-center">
                        <HealthIcons.Heart size={24} className="text-health-green" />
                      </div>
                      <span className="text-sm font-medium">気分を記録</span>
                      <Badge variant="secondary" className="text-xs">+5 XP</Badge>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-center gap-3 card-hover touch-target"
                      onClick={handleTakePhoto}
                    >
                      <div className="w-12 h-12 rounded-full bg-health-blue/20 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-health-blue" />
                      </div>
                      <span className="text-sm font-medium">食事記録</span>
                      <Badge variant="secondary" className="text-xs">+3 XP</Badge>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-center gap-3 card-hover touch-target"
                      onClick={() => setIsProfileModalOpen(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-character-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-character-primary" />
                      </div>
                      <span className="text-sm font-medium">プロフィール</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-center gap-3 card-hover touch-target"
                      onClick={() => setIsHealthStatsModalOpen(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">詳細統計</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <ChatInterface 
                onSendMessage={handleSendMessage}
                messages={messages}
                isLoading={isLoadingResponse}
                characterName="ヘルスバディ"
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-character-primary" />
                    キャラクター成長
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="text-6xl float"><HealthIcons.Sparkles size={64} className="text-character-primary mx-auto" /></div>
                      <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-character-primary to-character-secondary">
                        レベル 3
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">健康サポーター</h3>
                      <p className="text-muted-foreground mt-2">
                        健康データを記録し続けて、キャラクターを成長させましょう！
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>経験値</span>
                        <span>{(healthLevel % 25) * 4}/100</span>
                      </div>
                      <div className="bg-muted rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-character-primary to-character-secondary transition-all duration-500 smooth-transition"
                          style={{ width: `${(healthLevel % 25) * 4}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        次のレベルまで健康ログ{Math.floor(25 - (healthLevel % 25))}回！
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg">最近の達成項目</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-health-green/10 rounded-lg border border-health-green/20 card-hover">
                        <div className="w-10 h-10 bg-health-green/20 rounded-full flex items-center justify-center">
                          <HealthIcons.Trophy size={20} className="text-health-green" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">7日連続記録！</p>
                          <p className="text-sm text-muted-foreground">7日間連続で健康データを記録しました</p>
                        </div>
                        <Badge variant="outline" className="bg-health-green/10 text-health-green border-health-green/20">
                          +10 XP
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-character-primary/10 rounded-lg border border-character-primary/20 card-hover">
                        <div className="w-10 h-10 bg-character-primary/20 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-character-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">おしゃべり好き</p>
                          <p className="text-sm text-muted-foreground">健康バディと10回の会話をしました</p>
                        </div>
                        <Badge variant="outline" className="bg-character-primary/10 text-character-primary border-character-primary/20">
                          +5 XP
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-health-blue/10 rounded-lg border border-health-blue/20 card-hover">
                        <div className="w-10 h-10 bg-health-blue/20 rounded-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-health-blue" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">フードロガー</p>
                          <p className="text-sm text-muted-foreground">5回の食事記録を完了しました</p>
                        </div>
                        <Badge variant="outline" className="bg-health-blue/10 text-health-blue border-health-blue/20">
                          +3 XP
                        </Badge>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16 text-center safe-area-bottom">
          <div className="max-w-md mx-auto space-y-6">
            <div className="float">
              <HealthIcons.Heart size={80} className="text-health-green mx-auto" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">ヘルスバディへようこそ</h2>
              <p className="text-muted-foreground text-lg">
                あなた専用の健康管理パートナーです。<br />
                ログインして健康な生活を始めましょう！
              </p>
            </div>
            <Button 
              onClick={() => setIsAuthModalOpen(true)} 
              size="lg" 
              className="w-full touch-target bg-gradient-to-r from-health-green to-health-blue hover:scale-105 transition-transform"
            >
              今すぐ始める
            </Button>
          </div>
        </div>
      )}

      {/* Floating Action Button for quick actions */}
      {currentUser && (
        <button 
          className="fab pulse-soft"
          onClick={handleLogHealth}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modal群 */}
      <HealthLogModal
        isOpen={isHealthLogModalOpen}
        onClose={() => setIsHealthLogModalOpen(false)}
        onSave={handleSaveHealthLog}
      />
      
      <FoodAnalysisModal
        isOpen={isFoodAnalysisModalOpen}
        onClose={() => setIsFoodAnalysisModalOpen(false)}
        onSaveFoodData={handleSaveFoodData}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      
      <HealthStatsModal
        isOpen={isHealthStatsModalOpen}
        onClose={() => setIsHealthStatsModalOpen(false)}
        healthData={healthData}
      />
    </div>
  );
}
