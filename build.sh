#!/usr/bin/env bash
# Render.com用のビルドスクリプト

set -o errexit

# バックエンドのビルド
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# フロントエンドのビルド
cd ../frontend
npm install
npm run build

echo "Build completed successfully"