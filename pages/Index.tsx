import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, MessageCircle, Sparkles } from 'lucide-react';

// Components
import Character from '@/components/Character';
import HealthStats from '@/components/HealthStats';
import ChatInterface from '@/components/ChatInterface';
import HealthLogModal from '@/components/HealthLogModal';
import FoodAnalysisModal from '@/components/FoodAnalysisModal';
import AuthModal from '@/components/AuthModal';
import UserProfileModal from '@/components/UserProfileModal';
import HealthStatsModal from '@/components/HealthStatsModal';
import AppHeader from '@/components/AppHeader';
import QuickStatsCards from '@/components/QuickStatsCards';
import QuickActions from '@/components/QuickActions';
import ProgressTab from '@/components/ProgressTab';
import FloatingActionButton from '@/components/FloatingActionButton';
import WelcomeScreen from '@/components/WelcomeScreen';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useHealthData } from '@/hooks/useHealthData';
import { useChat } from '@/hooks/useChat';

// API
import { healthAPI } from '@/lib/api';
import { ImpactStyle } from '@capacitor/haptics';

export default function Index() {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { healthData, loadHealthData } = useHealthData(currentUser);
  const { messages, isLoadingResponse, handleSendMessage, addMessage, triggerHaptics } = useChat(userProfile);

  // Component state
  const [characterMood, setCharacterMood] = useState<'happy' | 'neutral' | 'sad' | 'sleeping'>('happy');
  const [healthLevel, setHealthLevel] = useState(85);
  const [isCharacterInteracting, setIsCharacterInteracting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [isHealthLogModalOpen, setIsHealthLogModalOpen] = useState(false);
  const [isFoodAnalysisModalOpen, setIsFoodAnalysisModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthStatsModalOpen, setIsHealthStatsModalOpen] = useState(false);

  // Timer for current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show auth modal for non-logged-in users
  useEffect(() => {
    if (!loading && !currentUser) {
      setIsAuthModalOpen(true);
    }
  }, [currentUser, loading]);

  // Event handlers
  const handleLogHealth = async () => {
    await triggerHaptics();
    setIsHealthLogModalOpen(true);
  };

  const handleSaveHealthLog = async (data: any) => {
    try {
      await triggerHaptics(ImpactStyle.Heavy);
      
      // Transform health log data to match API schema
      const healthLogPayload = {
        type: 'health_log',
        title: `Health Log - ${new Date().toLocaleDateString()}`,
        description: `Mood: ${data.mood}, Energy: ${data.energy}/10, Sleep: ${data.sleep}h, Water: ${data.water} glasses`,
        data: {
          weight: data.weight,
          mood: data.mood,
          energy: data.energy,
          sleep: data.sleep,
          water: data.water,
          notes: data.notes,
          foodItems: data.foodItems || []
        },
        date: new Date().toISOString()
      };

      await healthAPI.createHealthLog(healthLogPayload);
      await loadHealthData();
      
      setHealthLevel(prev => Math.min(100, prev + 5));
      setCharacterMood('happy');
      
      addMessage({
        id: Date.now().toString(),
        content: "健康データの記録、お疲れ様でした！🌟 ご自身の健康に気を配っていらっしゃる姿勢が素晴らしいです。あなたの継続的な努力が私の成長にも繋がっています！",
        sender: 'character',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('健康ログ保存エラー:', error);
      addMessage({
        id: Date.now().toString(),
        content: "申し訳ございません。健康データの保存に失敗しました。ネットワーク接続を確認してから再度お試しください。",
        sender: 'character',
        timestamp: new Date()
      });
    }
  };

  const handleTakePhoto = async () => {
    await triggerHaptics();
    setIsFoodAnalysisModalOpen(true);
  };

  const handleSaveFoodData = async (data: any) => {
    try {
      await triggerHaptics(ImpactStyle.Heavy);
      
      // Transform food analysis data to match API schema
      const foodDataPayload = {
        name: data.foodItems?.map((item: any) => item.name).join(', ') || 'Food Items',
        calories: data.totalCalories || 0,
        nutrition: data.foodItems?.reduce((acc: any, item: any) => {
          acc[item.name] = { calories: item.calories, confidence: item.confidence };
          return acc;
        }, {}) || {},
        meal: 'photo_analyzed',
        date: new Date().toISOString(),
        imageUrl: data.imageUrl
      };

      await healthAPI.saveFoodData(foodDataPayload);
      
      addMessage({
        id: Date.now().toString(),
        content: `お食事の記録ありがとうございます！📸 ${data.totalCalories}kcalの食事を確認しました。バランスの良い食事を心がけていらっしゃいますね！`,
        sender: 'character',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('食事データ保存エラー:', error);
      addMessage({
        id: Date.now().toString(),
        content: "申し訳ございません。食事データの保存に失敗しました。ネットワーク接続を確認してから再度お試しください。",
        sender: 'character',
        timestamp: new Date()
      });
    }
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

  const handleChatMessage = async (message: string) => {
    setIsCharacterInteracting(true);
    await handleSendMessage(message);
    setIsCharacterInteracting(false);
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
      <AppHeader
        currentUser={currentUser}
        userProfile={userProfile}
        currentTime={currentTime}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {currentUser ? (
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 safe-area-bottom">
          {/* Character Section */}
          <Card className="character-bg border-character-primary/20 card-hover overflow-hidden">
            <CardContent className="p-0">
              <Character 
                mood={characterMood}
                healthLevel={healthLevel}
                isInteracting={isCharacterInteracting}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <QuickStatsCards healthLevel={healthLevel} />

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 glass h-12 sm:h-14">
              <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">ダッシュボード</span>
                <span className="sm:hidden">統計</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">チャット</span>
                <span className="sm:hidden">会話</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">成長記録</span>
                <span className="sm:hidden">成長</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              <HealthStats 
                recentData={healthData}
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
              />
              
              <QuickActions
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onStatsClick={() => setIsHealthStatsModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="chat">
              <ChatInterface 
                onSendMessage={handleChatMessage}
                messages={messages}
                isLoading={isLoadingResponse}
                characterName="ヘルスバディ"
              />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressTab healthLevel={healthLevel} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <WelcomeScreen onGetStarted={() => setIsAuthModalOpen(true)} />
      )}

      {/* Floating Action Button */}
      {currentUser && (
        <FloatingActionButton onClick={handleLogHealth} />
      )}

      {/* Modals */}
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