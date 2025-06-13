FROM node:18-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package.json package-lock.json* ./

# 依存関係をインストール
RUN npm install

# アプリケーションファイルをコピー
COPY . .

# ポート開放
EXPOSE 5173

# 開発サーバー起動（ホストバインド）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]