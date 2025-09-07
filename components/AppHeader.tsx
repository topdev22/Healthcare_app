import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Settings, LogOut, Sun, Moon, User } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AppHeaderProps {
  currentUser: any;
  userProfile: any;
  currentTime: Date;
  healthLevel?: number;
  onProfileClick: () => void;
  onAuthClick: () => void;
  onLogout: () => void;
}

export default function AppHeader({
  currentUser,
  userProfile,
  currentTime,
  healthLevel,
  onProfileClick,
  onAuthClick,
  onLogout
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <header className="glass border-b border-white/30 sticky top-0 z-50 safe-area-top backdrop-blur-xl shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src="/images/favicon.jpg"
                alt="Health Buddy Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-xl ring-2 ring-health-green/30"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-health-green to-health-blue rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
                ヘルスバディ
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:block">
                あなたの健康管理パートナー
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                {/* Health Status Indicator */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 glass rounded-full border border-white/20">
                  <Heart className="w-4 h-4 text-health-green" />
                  <span className="text-sm font-medium text-health-green">
                    {healthLevel ? `${healthLevel}%` : '--'}
                  </span>
                </div>

                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">{getGreeting()}！</p>
                  <p className="text-xs text-muted-foreground">
                    {currentTime.toLocaleDateString('ja-JP')}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="touch-target glass hover:bg-white/20 border border-white/20"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  
                  <button
                    onClick={onProfileClick}
                    className="touch-target rounded-full hover:ring-2 hover:ring-health-green/40 transition-all duration-300 hover:scale-105"
                    title="プロフィール編集"
                  >
                    <Avatar className="w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-gradient-to-br ring-health-green/30 shadow-lg">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback className="bg-gradient-to-br from-health-green to-health-blue text-white text-sm font-medium">
                        {userProfile?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-destructive hover:text-destructive touch-target glass hover:bg-destructive/10 border border-destructive/20"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={onAuthClick} className="touch-target bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-lg">
                ログイン
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}