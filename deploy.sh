#!/bin/bash

# PomoHub Production Deployment Script

set -e

echo "🚀 Starting PomoHub production deployment..."

# 環境変数の確認
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your production settings before continuing."
    exit 1
fi

# Docker Composeの確認
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# データディレクトリの作成
echo "📁 Creating data directory..."
mkdir -p ./data

# 既存のコンテナを停止
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# 新しいイメージをビルド
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# コンテナを起動
echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🔍 Waiting for services to be healthy..."
sleep 10

# バックエンドのヘルスチェック
if curl -f http://localhost:5001/api/today > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo "🎉 PomoHub deployment completed successfully!"
echo ""
echo "📱 Access your application at: http://localhost"
echo "🔧 Backend API at: http://localhost:5001"
echo ""
echo "📊 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.prod.yml down"