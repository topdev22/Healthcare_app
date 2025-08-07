import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AppHeaderProps {
  currentUser: any;
  userProfile: any;
  currentTime: Date;
  onProfileClick: () => void;
  onAuthClick: () => void;
  onLogout: () => void;
}

export default function AppHeader({
  currentUser,
  userProfile,
  currentTime,
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
    <header className="glass border-b sticky top-0 z-50 safe-area-top">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/images/favicon.jpg" alt="Health Buddy Logo" className="w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">ヘルスバディ</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">あなた専用の健康管理パートナー</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{getGreeting()}！</p>
                  <p className="text-xs text-muted-foreground">
                    {currentTime.toLocaleDateString('ja-JP')}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="touch-target"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-primary/20">
                    <AvatarImage src={userProfile?.photoURL} />
                    <AvatarFallback className="bg-gradient-to-br from-character-primary to-character-secondary text-white text-xs sm:text-sm">
                      {userProfile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onProfileClick}
                    className="touch-target hidden sm:flex"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-destructive hover:text-destructive touch-target"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={onAuthClick} className="touch-target">
                ログイン
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}