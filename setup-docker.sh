#!/bin/bash
# setup-docker.sh

echo "Docker開発環境をセットアップ中..."

# 環境変数ファイルを作成
if [ ! -f .env ]; then
    echo "環境変数ファイルを作成中..."
    cat > .env << 'EOF'
# データベース設定
MONGODB_URI=mongodb://mongodb:27017/health-buddy
DB_NAME=health-buddy

# JWT設定
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# OpenAI設定
OPENAI_API_KEY=your-openai-api-key-here

# サーバー設定
PORT=3001
NODE_ENV=development

# CORS設定
CORS_ORIGIN=http://localhost:5173
EOF
    echo ".env ファイルを作成しました"
else
    echo ".env ファイルは既に存在します"
fi

if [ ! -f .env.local ]; then
    echo "ローカル環境変数ファイルを作成中..."
    cat > .env.local << 'EOF'
# ローカル開発用設定
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=HealthBuddy
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
EOF
    echo ".env.local ファイルを作成しました"
else
    echo ".env.local ファイルは既に存在します"
fi

echo ""
echo "⚠️  重要: 以下のファイルを編集して実際の値を設定してください："
echo "   - .env (API キー、JWT シークレットなど)"
echo "   - .env.local (Google OAuth クライアント ID など)"
echo ""

echo "Docker コンテナをビルド・起動中..."
docker-compose up --build

echo ""
echo "開発環境のセットアップが完了しました！"
echo "アプリケーションは以下でアクセスできます："
echo "- フロントエンド: http://localhost:5173"
echo "- バックエンド: http://localhost:3001"
