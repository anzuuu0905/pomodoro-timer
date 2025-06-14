#!/bin/bash

# Google Cloud Run + Firebase デプロイスクリプト

set -e

echo "🚀 PomoHub - Google Cloud デプロイ開始..."

# 必要な変数
PROJECT_ID=${GCP_PROJECT_ID:-"YOUR_PROJECT_ID"}
REGION=${GCP_REGION:-"asia-northeast1"}
SERVICE_NAME="pomohub-backend"

# プロジェクトIDの確認
if [ "$PROJECT_ID" = "YOUR_PROJECT_ID" ]; then
    echo "❌ GCP_PROJECT_ID環境変数を設定してください"
    echo "export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

echo "📝 プロジェクト: $PROJECT_ID"
echo "🌏 リージョン: $REGION"

# Google Cloudプロジェクトの設定
echo "⚙️  Google Cloudプロジェクトを設定..."
gcloud config set project $PROJECT_ID

# 必要なAPIの有効化
echo "🔧 必要なAPIを有効化..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com

# Cloud Runサービスのデプロイ
echo "🐳 Cloud Runにバックエンドをデプロイ..."
gcloud builds submit --config cloudbuild.yaml

# Cloud RunのURLを取得
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
echo "✅ バックエンドURL: $BACKEND_URL"

# フロントエンドの環境変数を更新
echo "⚙️  フロントエンドの環境変数を更新..."
cat > frontend/.env.production << EOF
VITE_API_URL=$BACKEND_URL
EOF

# フロントエンドのビルド
echo "🔨 フロントエンドをビルド..."
cd frontend
npm install
npm run build
cd ..

# Firebase Hostingにデプロイ
echo "🚀 Firebase Hostingにフロントエンドをデプロイ..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLIがインストールされていません"
    echo "npm install -g firebase-tools でインストールしてください"
    exit 1
fi

# Firebaseプロジェクトの設定
firebase use $PROJECT_ID || firebase use --add

# Firebase Hostingデプロイ
firebase deploy --only hosting

# Firebase HostingのURLを取得
FRONTEND_URL="https://$PROJECT_ID.web.app"

# Cloud Runの環境変数を更新
echo "🔄 Cloud Runの環境変数を更新..."
gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --update-env-vars "FRONTEND_URL=$FRONTEND_URL"

echo "🎉 デプロイ完了！"
echo ""
echo "📱 フロントエンド: $FRONTEND_URL"
echo "🔧 バックエンドAPI: $BACKEND_URL"
echo ""
echo "📊 Firebaseコンソール: https://console.firebase.google.com/project/$PROJECT_ID"
echo "☁️  Cloud Runコンソール: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"