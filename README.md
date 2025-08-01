# ヘルスバディ フロントエンド

GPT-4を活用した健康管理アプリのフロントエンド部分です。React + TypeScript + Viteで構築されています。

## 🚀 機能

- **認証システム**: Google OAuth, メール/パスワード認証
- **健康データ記録**: 体重、気分、食事、運動記録
- **AI チャット**: GPT-4による健康アドバイス
- **食事画像解析**: 写真からのカロリー自動計算
- **統計表示**: 健康データの詳細な分析とグラフ
- **キャラクター育成**: 継続的な記録でキャラクターが成長
- **モバイル対応**: レスポンシブデザイン

## 📋 前提条件

- Node.js 18+ 
- バックエンドAPI サーバー（別途セットアップが必要）

## 🛠️ セットアップ

1. **依存関��のインストール**
```bash
npm install
```

2. **環境変数の設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集して以下を設定：
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

3. **開発サーバーの起動**
```bash
npm run dev
```

アプリケーションは http://localhost:8080 で起動します。

## 🏗️ ビルド

本番用ビルド:
```bash
npm run build
```

ビルドされたファイルは `dist` フォルダに出力されます。

## 📡 バックエンドAPI要件

フロントエンドは以下のAPIエンドポイントを期待します：

### 認証 (`/auth`)
- `POST /auth/google` - Google OAuth認証
- `POST /auth/login` - メールログイン
- `POST /auth/register` - ユーザー登録
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - 現在のユーザー情報

### ユーザー (`/user`)
- `GET /user/profile` - プロフィール取得
- `PUT /user/profile` - プロフィール更新

### 健康データ (`/health`)
- `GET /health/logs` - 健康ログ一覧
- `POST /health/logs` - 健康ログ作成
- `POST /health/analyze-food` - 食事画像解析
- `POST /health/food` - 食事データ保存

### チャット (`/chat`)
- `POST /chat/message` - GPTとのチャット
- `GET /chat/history` - チャット履歴

### 統計 (`/stats`)
- `GET /stats/health` - 健康統計データ

## 🎨 技術スタック

- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **TailwindCSS** - スタイリング
- **Radix UI** - アクセシブルなUI コンポーネント
- **React Router** - ルーティング
- **React Query** - サーバー状態管理

## 📁 プロジェクト構造

```
client/
├── components/          # 再利用可能なコンポーネント
│   ├── ui/             # 基本UIコンポーネント（shadcn/ui）
│   ├── Character.tsx   # キャラクターコンポーネント
│   ├── ChatInterface.tsx
│   └── ...
├── contexts/           # React Context
│   └── AuthContext.tsx
├── lib/               # ユーティリティ
│   ├── api.ts         # API通信関数
│   └── utils.ts
├── pages/             # ページコンポーネント
│   ├── Index.tsx      # メインページ
│   └── NotFound.tsx
├── App.tsx            # アプリケーションルート
└── global.css         # グローバルスタイル
```

## 🔧 設定

### 環境変数

| 変���名 | 説明 | 必須 |
|--------|------|------|
| `VITE_API_BASE_URL` | バックエンドAPIのベースURL | はい |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth クライアントID | はい |

### プロキシ設定

開発環境では、Viteが自動的に `/api` へのリクエストをバックエンドサーバーにプロキシします。

## 🚀 デプロイ

### Netlify
1. リポジトリを接続
2. ビルドコマンド: `npm run build`
3. 公開ディレクトリ: `dist`
4. 環境変数を設定

### Vercel
1. プロジェクトをインポート
2. フレームワークプリセット: Vite
3. 環境変数を設定

## 📱 モバイル対応

- レスポンシブデザイン
- タッチフレンドリーなUI
- モバイル最適化されたフォントサイズ
- PWA対応（将来実装予定）

## 🧪 テスト

```bash
npm test
```

## 📄 ライセンス

MIT License
