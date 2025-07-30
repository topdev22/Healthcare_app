import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Character from '@/components/Character';
import HealthStats from '@/components/HealthStats';
import ChatInterface from '@/components/ChatInterface';
import HealthLogModal from '@/components/HealthLogModal';
import FoodAnalysisModal from '@/components/FoodAnalysisModal';
import AuthModal from '@/components/AuthModal';
import UserProfileModal from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { HealthIcons } from '@/components/CharacterFaces';
import { Heart, MessageCircle, BarChart3, Settings, Sparkles, User, LogOut, Camera } from 'lucide-react';

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
  const [characterMood, setCharacterMood] = useState<'happy' | 'neutral' | 'sad' | 'sleeping'>('happy');
  const [healthLevel, setHealthLevel] = useState(85);
  const [isCharacterInteracting, setIsCharacterInteracting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "こんにちは！私はあなたの健康管理パートナーです！🌟 今日の体調はいかがですか？あなたの健康な生活をサポートするためにここにいます！",
      sender: 'character',
      timestamp: new Date()
    }
  ]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isHealthLogModalOpen, setIsHealthLogModalOpen] = useState(false);
  const [isFoodAnalysisModalOpen, setIsFoodAnalysisModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // サンプル健康データ - 実際のアプリではFirebaseから取得
  const [healthData] = useState<HealthData[]>([
    { mood: 'happy', weight: 70.2, calories: 1850, date: new Date().toISOString() },
    { mood: 'neutral', weight: 70.5, date: new Date(Date.now() - 24*60*60*1000).toISOString() },
    { mood: 'excited', weight: 70.1, calories: 1920, date: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
    { mood: 'happy', weight: 70.3, date: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
    { mood: 'neutral', weight: 70.4, calories: 1780, date: new Date(Date.now() - 4*24*60*60*1000).toISOString() },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ユーザーがログインしていない場合は認証モーダルを表示
  useEffect(() => {
    if (!loading && !currentUser) {
      setIsAuthModalOpen(true);
    }
  }, [currentUser, loading]);

  const handleSendMessage = async (message: string) => {
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

    // GPT応答をシミュレート - 実際のアプリではOpenAI APIを呼び出し、ユーザープロフィール情報を含める
    setTimeout(() => {
      const userContext = userProfile ? `${userProfile.displayName}さん` : 'あなた';
      const responses = [
        `${userContext}、素晴らしいですね！😊 健康への小さな一歩一歩が大切です。今日のエネルギーレベルはいかがですか？`,
        `${userContext}のお気持ち、よく分かります。💚 体調の波があるのは自然なことです。今、気分を良くするための小さなことは何かありますか？`,
        `${userContext}、情報を共有してくださってありがとうございます！🌟 気持ちを記録することは健康管理の重要な部分です。一緒に健康データを記録してみませんか？`,
        `${userContext}、それは素晴らしいです！🎉 あなたの頑張りを誇りに思います。健康的な習慣を続けることが成功の鍵ですね。その調子です！`,
        `${userContext}をサポートするためにここにいます！💙 健���目標について話し合いたいですか？それとも今日の体調について記録してみますか？`
      ];
      
      const characterResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: 'character',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, characterResponse]);
      setIsLoadingResponse(false);
      setIsCharacterInteracting(false);
      
      // ユーザーのやり取りに基づいてキャラクターの気分を更新
      setCharacterMood('happy');
    }, 1500);
  };

  const handleLogHealth = () => {
    setIsHealthLogModalOpen(true);
  };

  const handleSaveHealthLog = (data: any) => {
    // 実際のアプリではFirebaseに保存
    console.log('健康ログを保存:', data);
    
    // 継続的な記録に基づいてキャラクターの健康レベルを更新
    setHealthLevel(prev => Math.min(100, prev + 5));
    setCharacterMood('happy');
    
    // 成功フィードバックを表示
    const successMessage: Message = {
      id: Date.now().toString(),
      content: "健康データの記録、お疲れ様でした！🌟 ご自身の健康に気を配っていらっしゃる姿勢が素晴らし��です。あなたの継続的な努力が私の成長にも繋がっています！",
      sender: 'character',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, successMessage]);
  };

  const handleTakePhoto = () => {
    setIsFoodAnalysisModalOpen(true);
  };

  const handleSaveFoodData = (data: any) => {
    // 実際のアプリではFirebaseに保存
    console.log('食事データを保存:', data);
    
    // 食事記録の成功メッセージ
    const foodMessage: Message = {
      id: Date.now().toString(),
      content: `お食事の記録ありがとうございます！📸 ${data.totalCalories}kcalの食事を確認しました。バランスの良い食事を心がけていらっしゃいますね！`,
      sender: 'character',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, foodMessage]);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
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
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-health-green to-health-blue flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ヘルスバディ</h1>
                <p className="text-sm text-muted-foreground">あなた専用の健康管理パートナー</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{getGreeting()}！</p>
                    <p className="text-xs text-muted-foreground">
                      {currentTime.toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback>
                        {userProfile?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="hidden sm:flex"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-destructive hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  ログイン
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {currentUser ? (
          <>
            {/* キャラクターセクション */}
            <Card className="character-bg border-character-primary/20">
              <CardContent className="p-0">
                <Character 
                  mood={characterMood}
                  healthLevel={healthLevel}
                  isInteracting={isCharacterInteracting}
                />
              </CardContent>
            </Card>

            {/* メインコンテンツタブ */}
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  ダッシュボード
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  チャット
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  成長記録
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <HealthStats 
                  recentData={healthData}
                  onLogHealth={handleLogHealth}
                  onTakePhoto={handleTakePhoto}
                />
                
                {/* クイックアクション */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">クイックアクション</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={handleLogHealth}
                      >
                        <HealthIcons.Heart size={20} className="text-health-green" />
                        <span className="text-sm">気分を記録</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={handleTakePhoto}
                      >
                        <Camera className="w-5 h-5 text-health-blue" />
                        <span className="text-sm">食事記録</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        <User className="w-5 h-5 text-character-primary" />
                        <span className="text-sm">プロフィール</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">統計を見る</span>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-character-primary" />
                      キャラクター成長
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-6xl"><HealthIcons.Sparkles size={64} className="text-character-primary mx-auto" /></div>
                      <h3 className="text-xl font-semibold">レベル3 健康サポーター</h3>
                      <p className="text-muted-foreground">
                        健康データを記録し続けて、キャラクターを成長させましょう！
                      </p>
                      <div className="bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-character-primary to-character-secondary transition-all duration-500"
                          style={{ width: `${(healthLevel % 25) * 4}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        次のレベルまで健康ログ{Math.floor(25 - (healthLevel % 25))}回！
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">最近の達成項目</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-health-green/10 rounded-lg border border-health-green/20">
                        <div className="w-8 h-8 bg-health-green/20 rounded-full flex items-center justify-center">
                          <HealthIcons.Trophy size={16} className="text-health-green" />
                        </div>
                        <div>
                          <p className="font-medium">5日連続記録！</p>
                          <p className="text-sm text-muted-foreground">5日間連続で健康データを記録しました</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-character-primary/10 rounded-lg border border-character-primary/20">
                        <div className="w-8 h-8 bg-character-primary/20 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-character-primary" />
                        </div>
                        <div>
                          <p className="font-medium">おしゃべり好き</p>
                          <p className="text-sm text-muted-foreground">健康バディと10回の会話をしました</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-16">
            <HealthIcons.Heart size={64} className="text-health-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">ヘルスバディへようこそ</h2>
            <p className="text-muted-foreground mb-6">
              あなた専用の健康管理パートナーです。<br />
              ログインして健康な生活を始めまし��う！
            </p>
            <Button onClick={() => setIsAuthModalOpen(true)} size="lg">
              今すぐ始める
            </Button>
          </div>
        )}
      </main>

      {/* モーダル群 */}
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
    </div>
  );
}
