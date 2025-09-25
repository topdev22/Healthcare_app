import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, AlertCircle, WifiOff, Heart, User } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface GoogleJwtPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } =
    useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleAuthError, setGoogleAuthError] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isLoading = loading || localLoading;

  // Google Auth initialization is now handled by GoogleLogin component

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = loginEmail.trim();
    const trimmedPassword = loginPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      setLocalLoading(true);
      clearMessages();

      await signInWithEmail(trimmedEmail, trimmedPassword);
      setSuccess("ログインに成功しました！");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess("");
        setLoginEmail("");
        setLoginPassword("");
      }, 1000);
    } catch (err: any) {
      console.error("Email login error:", err);
      setError(err.message || "ログインに失敗しました。");
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
      setError("すべての項目を入力してください。");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("パスワードは6文字以上で設定してください。");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    try {
      setLocalLoading(true);
      clearMessages();

      await signUpWithEmail(trimmedEmail, trimmedPassword, trimmedName);
      setSuccess("アカウントの作成に成功しました！");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupName("");
        setConfirmPassword("");
      }, 1000);
    } catch (err: any) {
      console.error("Email signup error:", err);
      setError(err.message || "アカウントの作成に失敗しました。");
    } finally {
      setLocalLoading(false);
    }
  };

  const onSuccess = async (credentialResponse: any) => {
    try {
      setLocalLoading(true);
      clearMessages();

      if (!credentialResponse.credential) {
        throw new Error("Google認証情報が取得できませんでした。");
      }

      const decoded = jwtDecode<GoogleJwtPayload>(
        credentialResponse.credential,
      );
      console.log("Google User Info:", decoded);

      // Validate required fields and extract user data with proper fallbacks
      if (!decoded.sub) {
        throw new Error("GoogleユーザーIDが取得できませんでした。");
      }

      const userData = {
        googleId: decoded.sub,
        email: decoded.email,
        displayName: decoded.name,
        photoURL: decoded.picture,
      };

      // Call AuthContext to handle Google authentication
      await signInWithGoogle(userData);
      setSuccess("Googleでのログインに成功しました！");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1000);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Googleでのログインに失敗しました。");
    } finally {
      setLocalLoading(false);
    }
  };

  const onError = () => {
    console.error("Google Login Failed");
    setGoogleAuthError(
      "Googleログインに失敗しました。もう一度お試しください。",
    );
  };

  const handleClose = () => {
    if (!isLoading) {
      clearMessages();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md glass border border-white/30 shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          {/* Health Logo Section */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src="/images/favicon.jpg"
                alt="Health Buddy Logo"
                className="w-20 h-20 rounded-2xl shadow-xl ring-4 ring-health-green/20"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-health-green to-health-blue rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
              ヘルスバディにようこそ
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              あなたの健康管理パートナーと一緒に
              <br />
              新しい健康習慣を始めましょう
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Alerts with better styling */}
          {googleAuthError && (
            <Alert className="glass border-orange-300/50 bg-orange-50/80">
              <WifiOff className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-orange-800">
                    Google認証について
                  </p>
                  <p className="text-orange-700">{googleAuthError}</p>
                  <p className="text-xs text-orange-600">
                    メール認証は引き続き利用できます。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="glass border-health-green/50 bg-health-green/10">
              <AlertCircle className="h-4 w-4 text-health-green" />
              <AlertDescription className="text-health-green font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="glass">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>{error}</p>
                  {error.includes("ネットワーク") && (
                    <p className="text-xs opacity-75">
                      • インターネット接続を確認してください
                      <br />
                      • ファイアウォールやVPNが影響していないか確認してください
                      <br />• しばらく時間をおいてから再度お試しください
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Google Login Button */}
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            useOneTap
            auto_select
            context="signin"
            shape="circle"
            theme="outline"
            size="large"
            text="signin_with"
            logo_alignment="left"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="glass px-3 py-1 text-muted-foreground border border-white/20 rounded-full">
                または
              </span>
            </div>
          </div>

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 glass border border-white/30 h-auto">
              <TabsTrigger
                value="login"
                disabled={isLoading}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-health-green data-[state=active]:to-health-blue data-[state=active]:text-white"
              >
                ログイン
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                disabled={isLoading}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-character-primary data-[state=active]:to-character-secondary data-[state=active]:text-white"
              >
                新規登録
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="font-medium">
                    メールアドレス
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="your@example.com"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="font-medium">
                    パスワード
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="パスワードを入力"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      健康管理を始める
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-medium">
                    お名前
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="田中 太郎"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="font-medium">
                    メールアドレス
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="your@example.com"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="font-medium">
                    パスワード
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    placeholder="6文字以上のパスワード"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-medium">
                    パスワード（確認）
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    placeholder="パスワードを再入力"
                    className="glass border-white/30 bg-white/50 focus:bg-white/70"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-character-primary to-character-secondary hover:from-character-primary/90 hover:to-character-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      アカウント作成
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Health Benefits Footer */}
          <div className="text-center pt-4 border-t border-white/20">
            <p className="text-xs text-muted-foreground">
              🎯 健康記録 • 💬 AI相談 • 📊 進捗追跡 • 🌟 キャラクター成長
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
