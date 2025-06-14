FROM python:3.12-slim

WORKDIR /app

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコピー
COPY . .

# Cloud Runはポート8080を使用
ENV PORT 8080

# アプリケーション実行
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app