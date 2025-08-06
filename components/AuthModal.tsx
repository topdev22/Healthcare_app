import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { initializeGoogleAuth } from '@/lib/auth';
import { Loader2, Mail, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface AuthModalProps {  
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isLoading = loading || localLoading;

  // Initialize Google Auth on mount
  useEffect(() => {
    if (isOpen) {
      initializeGoogleAuth()
        .then(() => {
          setGoogleAuthError('');
        })
        .catch((error) => {
          console.warn('Google Auth initialization failed:', error);
          setGoogleAuthError('Google認証の初期化に失敗しました。Google認証機能が利用できない可能性があります。');
        });
    }
  }, [isOpen]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLocalLoading(true);
      clearMessages();
      
      await signInWithGoogle();
      setSuccess('Googleでのログインに成功しました！');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1000);
      
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Googleでのログインに失敗しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = loginEmail.trim();
    const trimmedPassword = loginPassword.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }

    try {
      setLocalLoading(true);
      clearMessages();
      
      await signInWithEmail(trimmedEmail, trimmedPassword);
      setSuccess('ログインに成功しました！');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
        setLoginEmail('');
        setLoginPassword('');
      }, 1000);
      
    } catch (err: any) {
      console.error('Email login error:', err);
      setError(err.message || 'ログインに失敗しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = signupEmail.trim();
    const trimmedPassword = signupPassword.trim();
    const trimmedName = signupName.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (!trimmedEmail || !trimmedPassword || !trimmedName) {
      setError('すべての項目を入力してください。');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    try {
      setLocalLoading(true);
      clearMessages();
      
      await signUpWithEmail(trimmedEmail, trimmedPassword, trimmedName);
      setSuccess('アカウントの作成に成功しました！');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupName('');
        setConfirmPassword('');
      }, 1000);
      
    } catch (err: any) {
      console.error('Email signup error:', err);
      setError(err.message || 'アカウントの作成に失敗しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      clearMessages();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            ヘルスバディにようこそ
          </DialogTitle>
          <DialogDescription className="text-center">
            あなたの健康管理パートナーにログインしてください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Auth Warning */}
          {googleAuthError && (
            <Alert className="border-orange-200 bg-orange-50 text-orange-800">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Google認証について</p>
                  <p>{googleAuthError}</p>
                  <p className="text-xs opacity-75">
                    メール認証は引き続き利用できます。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>{error}</p>
                  {error.includes('ネットワーク') && (
                    <p className="text-xs opacity-75">
                      • インターネット接続を確認してください
                      • ファイアウォールやVPNが影響していないか確認してください
                      • しばらく時間をおいてから再度お試しください
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleSignIn}
                          disabled={isLoading}
            className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Googleでログイン
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="login" disabled={isLoading}>ログイン</TabsTrigger>
            <TabsTrigger value="signup" disabled={isLoading}>新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">メールアドレス</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="your@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">パスワード</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="パスワードを入力"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      メールでログイン
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">お名前</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="田中 太郎"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">メールアドレス</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="your@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">パスワード</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    placeholder="6文字以上のパスワード"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">パスワード（確認）</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    placeholder="パスワードを再入力"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      アカウント作成
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
