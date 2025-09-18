import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Blend,
  Footprints,
  MessageCircle,
  Sparkles,
  Heart,
  Plus,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
import { useRealTimeHealthData } from "@/hooks/useRealTimeHealthData";
import { useChat } from "@/hooks/useChat";

// API
import { healthAPI } from "@/lib/api";
import { ImpactStyle } from "@capacitor/haptics";
import StepsDisplay from "@/components/StepsDisplay";

export default function Index() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { healthData, loadHealthData } = useHealthData(currentUser);
  const { realTimeStats } = useRealTimeHealthData(currentUser);
  const {
    messages,
    isLoadingResponse,
    currentAnimation,
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
          <div className="relative mb-8">
            {/* Outer spinning ring */}
            <div className="w-20 h-20 border-4 border-health-green/30 border-t-health-green rounded-full animate-spin mx-auto"></div>
            {/* Inner spinning ring - counter rotation */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-health-blue/30 border-b-health-blue rounded-full animate-spin animate-reverse mx-auto"></div>
            {/* Center heart icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-health-green to-health-blue rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
              ヘルスバディを起動中...
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-health-green rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-health-blue rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-wellness-amber rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
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
        healthLevel={realTimeStats?.healthLevel}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {currentUser ? (
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 safe-area-bottom">
          {/* Character Section - Simplified */}
          <Card className="character-bg border-character-primary/30 card-hover overflow-hidden shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <Character animationKey={currentAnimation as any} />
              </div>
            </CardContent>
          </Card>
          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-3 sm:space-y-4 bg-transparent"
          >
            <TabsList className="grid w-full grid-cols-4 glass h-auto p-1.5 sm:p-2 justify-center items-center rounded-2xl border border-white/20 shadow-lg">
              <TabsTrigger
                value="dashboard"
                className="flex flex-col items-center justify-center gap-1 touch-target text-xs sm:text-sm w-full h-14 sm:h-16 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-health-green data-[state=active]:to-health-blue data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 ease-in-out rounded-xl font-medium"
              >
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
                <span className="text-center transition-colors leading-tight">
                  ホーム
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="chat"
                className="flex flex-col items-center justify-center gap-1 touch-target text-xs sm:text-sm w-full h-14 sm:h-16 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-character-primary data-[state=active]:to-character-secondary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 ease-in-out rounded-xl font-medium"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
                <span className="text-center transition-colors leading-tight">
                  チャット
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="step"
                className="flex flex-col items-center justify-center gap-1 touch-target text-xs sm:text-sm w-full h-14 sm:h-16 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-health-blue data-[state=active]:to-wellness-amber data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 ease-in-out rounded-xl font-medium"
              >
                <Footprints className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
                <span className="text-center transition-colors leading-tight">
                  活動
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="progress"
                className="flex flex-col items-center justify-center gap-1 touch-target text-xs sm:text-sm w-full h-14 sm:h-16 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-wellness-amber data-[state=active]:to-health-green data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 ease-in-out rounded-xl font-medium"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
                <span className="text-center transition-colors leading-tight">
                  成長
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-3 sm:space-y-4">
              {/* Primary Actions Section */}
              <Card className="glass border border-white/30 shadow-lg">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-health-green" />
                    今日のアクション
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      size="lg"
                      className="h-20 sm:h-24 flex flex-col items-center gap-2 bg-gradient-to-br from-health-green to-health-green/80 hover:from-health-green/90 hover:to-health-green/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      onClick={handleLogHealth}
                    >
                      <Heart className="w-6 h-6 sm:w-7 sm:h-7" />
                      <span className="text-sm sm:text-base font-medium">
                        健康記録
                      </span>
                    </Button>

                    <Button
                      size="lg"
                      className="h-20 sm:h-24 flex flex-col items-center gap-2 bg-gradient-to-br from-health-blue to-health-blue/80 hover:from-health-blue/90 hover:to-health-blue/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      onClick={handleTakePhoto}
                    >
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                      <span className="text-sm sm:text-base font-medium">
                        食事記録
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Health Overview Banner */}
              <div className="glass rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-health-green to-health-blue flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        今日の健康スコア
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        継続は力なり、今日も頑張りましょう！
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-health-green">
                      {realTimeStats?.healthLevel
                        ? `${realTimeStats.healthLevel}%`
                        : "--"}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {realTimeStats?.currentStreak
                        ? `${realTimeStats.currentStreak}日連続`
                        : "データ読み込み中..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Cards - Moved to top for better visibility */}
              <QuickStatsCards />

              {/* Quick Actions - Secondary */}
              <QuickActions
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onStatsClick={() => setIsHealthStatsModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="chat" className="space-y-3 sm:space-y-4 overflow-hidden">
              <Card className="character-bg border-character-primary/30 card-hover overflow-hidden shadow-lg h-full flex-1">
                <CardContent className="p-0 h-full">
                  <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-character-primary/20 h-full">
                    <div className="lg:flex-1 lg:pl-4 p-4 lg:pt-4 border-t border-character-primary/20 lg:border-t-0 flex-1 overflow-hidden">
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

            <TabsContent value="step" className="space-y-3 sm:space-y-4">
              <HealthStats
                onLogHealth={handleLogHealth}
                onTakePhoto={handleTakePhoto}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-3 sm:space-y-4">
              <ProgressTab />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <WelcomeScreen onGetStarted={() => setIsAuthModalOpen(false)} />
      )}

      {/* Floating Action Button */}
      {currentUser && <FloatingActionButton onClick={handleLogHealth} />}
      
      {/* Character Exchange Button */}
      {currentUser && (
        <div className="fixed bottom-4 left-8 z-50">
          <span
            onClick={() => navigate("/select")}
            className="inline-block cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 p-2 hover:bg-white/20"
            role="button"
            tabIndex={0}
            aria-label="キャラクター変更"
            onKeyDown={(e) => e.key === "Enter" && navigate("/select")}
          >
            <img
              src="/images/exchange.png"
              className="w-12 h-12 hover:animate-spin"
              alt="キャラクター変更"
            />
          </span>
        </div>
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
