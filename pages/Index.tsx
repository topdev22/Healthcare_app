import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Footprints, MessageCircle, Sparkles } from "lucide-react";

// Components
import Character from "@/components/Character";
import HealthStats from "@/components/HealthStats";
import ChatInterface from "@/components/ChatInterface";
import HealthLogModal from "@/components/HealthLogModal";
import FoodAnalysisModal from "@/components/FoodAnalysisModal";
import AuthModal from "@/components/AuthModal";
import UserProfileModal from "@/components/UserProfileModal";
import HealthStatsModal from "@/components/HealthStatsModal";
import AppHeader from "@/components/AppHeader";
import QuickStatsCards from "@/components/QuickStatsCards";
import QuickActions from "@/components/QuickActions";
import ProgressTab from "@/components/ProgressTab";
import FloatingActionButton from "@/components/FloatingActionButton";
import WelcomeScreen from "@/components/WelcomeScreen";

// Hooks
import { useAuth } from "@/contexts/AuthContext";
import { useHealthData } from "@/hooks/useHealthData";
import { useChat } from "@/hooks/useChat";

// API
import { healthAPI } from "@/lib/api";
import { ImpactStyle } from "@capacitor/haptics";
import StepsDisplay from "@/components/StepsDisplay";

export default function Index() {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { healthData, loadHealthData } = useHealthData(currentUser);
  const {
    messages,
    isLoadingResponse,
    handleSendMessage,
    addMessage,
    triggerHaptics,
  } = useChat(userProfile);

  // Component state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

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
    // HealthLogModal now handles saving to backend directly
    // This callback is mainly for UI feedback
    try {
      await triggerHaptics(ImpactStyle.Heavy);
      await loadHealthData(); // Refresh health data after save

      addMessage({
        id: Date.now().toString(),
        content:
          "健康データの記録をありがとうございます！🌟 ご自身の健康を大切にしていらっしゃる姿勢が本当に素晴らしいです。あなたの継続的な取り組みが、より良い健康習慣につながっています！",
        sender: "character",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("データ更新エラー:", error);
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
        name:
          data.foodItems?.map((item: any) => item.name).join(", ") ||
          "Food Items",
        calories: data.totalCalories || 0,
        nutrition:
          data.foodItems?.reduce((acc: any, item: any) => {
            acc[item.name] = {
              calories: item.calories,
              confidence: item.confidence,
            };
            return acc;
          }, {}) || {},
        meal: "photo_analyzed",
        date: new Date().toISOString(),
        imageUrl: data.imageUrl,
      };

      await healthAPI.saveFoodData(foodDataPayload);

      addMessage({
        id: Date.now().toString(),
        content: `お食事の記録をありがとうございます！📸 ${data.totalCalories}kcalの食事を確認させていただきました。バランスの良い食事を心がけていらっしゃいますね！`,
        sender: "character",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("食事データ保存エラー:", error);
      addMessage({
        id: Date.now().toString(),
        content:
          "申し訳ございません。食事データの保存に問題が発生いたしました。ネットワーク接続をご確認いただき、再度お試しいただけますでしょうか。",
        sender: "character",
        timestamp: new Date(),
      });
    }
  };

  const handleLogout = async () => {
    try {
      await triggerHaptics();
      await logout();
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  const handleTabChange = async (value: string) => {
    await triggerHaptics(ImpactStyle.Light);
    setActiveTab(value);
  };

  const handleChatMessage = async (message: string) => {
    await handleSendMessage(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center health-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            ヘルスバディを起動中...
          </p>
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
          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4 sm:space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 glass h-auto p-1 sm:h-14 justify-center items-center">
              <TabsTrigger
                value="dashboard"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm w-full h-12 sm:h-auto py-2 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/20 border border-transparent"
              >
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground data-[state=active]:text-primary transition-colors" />
                <span className="hidden sm:inline text-muted-foreground data-[state=active]:text-primary transition-colors">
                  ダッシュボード
                </span>
                <span className="sm:hidden text-center text-muted-foreground data-[state=active]:text-primary transition-colors">
                  統計
                </span>
              </TabsTrigger>
              
              <TabsTrigger
                value="chat"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm w-full h-12 sm:h-auto py-2 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/20 border border-transparent"
              >
                <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground data-[state=active]:text-primary transition-colors" />
                <span className="hidden sm:inline text-muted-foreground data-[state=active]:text-primary transition-colors">
                  ダッシュボード
                </span>
                <span className="sm:hidden text-center text-muted-foreground data-[state=active]:text-primary transition-colors">
                  統計
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="step"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm w-full h-12 sm:h-auto py-2 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/20 border border-transparent"
              >
                <Footprints className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground data-[state=active]:text-primary transition-colors" />
                <span className="hidden sm:inline text-muted-foreground data-[state=active]:text-primary transition-colors">
                  成長記録
                </span>
                <span className="sm:hidden text-center text-muted-foreground data-[state=active]:text-primary transition-colors">
                  成長
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="progress"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 touch-target text-xs sm:text-sm w-full h-12 sm:h-auto py-2 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/20 border border-transparent"
              >
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground data-[state=active]:text-primary transition-colors" />
                <span className="hidden sm:inline text-muted-foreground data-[state=active]:text-primary transition-colors">
                  成長記録
                </span>
                <span className="sm:hidden text-center text-muted-foreground data-[state=active]:text-primary transition-colors">
                  成長
                </span>
              </TabsTrigger>

              
            </TabsList>

            <TabsContent value="chat" className="space-y-4 sm:space-y-6">
              
              <Card className="character-bg border-character-primary/20 card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-character-primary/20">
                    <div className="lg:flex-1 lg:pl-4 p-4 lg:pt-4 border-t border-character-primary/20 lg:border-t-0">
                      <ChatInterface
                        onSendMessage={handleChatMessage}
                        messages={messages}
                        isLoading={isLoadingResponse}
                        characterName="ヘルスバディ"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              {/* Steps Display */}
              {/* <StepsDisplay/> */}
              {/* Character and Chat Section */}
              <Card className="character-bg border-character-primary/20 card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-character-primary/20">
                    <div className="lg:flex-1 lg:pr-4 p-4">
                      <Character />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <QuickActions
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onStatsClick={() => setIsHealthStatsModalOpen(true)}
              />
              {/* Quick Stats */}
              <QuickStatsCards />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressTab />
            </TabsContent>

            <TabsContent value="step" className="space-y-4 sm:space-y-6">
              <HealthStats
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <WelcomeScreen onGetStarted={() => setIsAuthModalOpen(true)} />
      )}

      {/* Floating Action Button */}
      {currentUser && <FloatingActionButton onClick={handleLogHealth} />}

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
