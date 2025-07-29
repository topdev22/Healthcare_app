import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Character */}
          <div className="text-8xl">(╥﹏╥)</div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">ページが見つかりません</h1>
            <p className="text-muted-foreground">
              おっと！お探しのページが見つかりませんでした。健康管理ダッシュボードに戻って、あなたの健康習慣を続けましょう！
            </p>
          </div>

          {/* Action Button */}
          <Link to="/">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              健康ダッシュボードに戻る
            </Button>
          </Link>

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <Heart className="w-4 h-4 text-health-green" />
            <span className="text-sm text-muted-foreground">ヘルスバディ</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
