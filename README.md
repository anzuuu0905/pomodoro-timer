# 🍅 PomoHub - ポモドーロタイマー

音声入力対応のポモドーロタイマーとタスク管理Webアプリケーションです。作業開始時にDiscord通知を送信し、日報をObsidian Vaultに自動生成します。

## 🚀 特徴

- **ポモドーロタイマー**: 25分作業 + 5分休憩の標準サイクル
- **タスクタイマー**: 自由時間設定のタスク専用タイマー
- **音声入力**: 日本語音声でタスク名を簡単入力
- **Discord通知**: 作業開始・終了時の自動通知
- **日報生成**: 毎日のポモドーロ記録をMarkdown形式で出力
- **PWA対応**: MacのDockにも追加可能
- **AI要約**: OpenAI GPTによる作業内容の3行要約（オプション）

## 📂 プロジェクト構成

```
pomo-hub/
├── backend/                 # Python Flask API
│   ├── app.py              # メインAPI
│   ├── models.py           # データベース操作
│   ├── daily_report.py     # 日報生成スクリプト
│   ├── requirements.txt    # Python依存パッケージ
│   ├── .env.example        # 環境変数テンプレート
│   └── Dockerfile
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── Timer.jsx
│   │       └── VoiceInput.jsx
│   ├── public/
│   │   └── manifest.json   # PWA設定
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml      # 開発環境一括起動
└── README.md
```

## 🛠️ セットアップ

### 1. 環境変数の設定

**バックエンド:**
```bash
cp backend/.env.example backend/.env
```

`.env`ファイルを編集して以下を設定：

```env
# Discord Webhook URL（必須）
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE

# Obsidian Vault のパス（必須）
VAULT_PATH=/path/to/your/obsidian/vault

# OpenAI API Key（オプション - 日報のGPT要約用）
OPENAI_API_KEY=your_openai_api_key_here
```

**フロントエンド:**
```bash
cp frontend/.env.example frontend/.env
```

本番環境では、フロントエンドの環境変数を設定してください：

```env
# バックエンドAPIのURL
VITE_API_URL=http://localhost:5001
```

本番環境の場合は`.env.production`ファイルを作成：

```env
VITE_API_URL=https://your-backend-url.com
```

### 2. Docker環境での起動

```bash
# 開発環境を一括起動
docker compose up --build

# バックグラウンドで起動
docker compose up --build -d
```

### 3. 手動セットアップ（オプション）

**バックエンド:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**フロントエンド:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 使い方

1. **アクセス**: `http://localhost:5173` でアプリを開く

2. **タスク入力**: 
   - 手動入力またはマイクボタン🎤で音声入力
   - 音声入力は日本語に対応

3. **タイマー開始**: 
   - ポモドーロ: 25分の集中タイマー
   - タスクタイマー: 60分のタスク専用タイマー

4. **Discord通知**: 
   - 作業開始時に🍅通知が送信される
   - タイマー終了時にも通知

5. **メモ機能**: 
   - タイマー実行中にメモを追加可能
   - 日報に自動的に記録される

6. **PWA対応**: 
   - ブラウザの「ホーム画面に追加」でアプリ化
   - Dockから直接起動可能

## 📊 日報機能

### 自動生成

毎日23:55に自動実行（cron設定が必要）:

```bash
# crontabに追加
55 23 * * * cd /path/to/pomo-hub/backend && python daily_report.py
```

### 手動実行

```bash
cd backend
python daily_report.py

# 特定日付の日報生成
python daily_report.py 2025-06-13
```

### 出力例

```markdown
## 2025-06-13（金）

- ポモドーロ 4回（合計1時間40分）
- 作業内容：
    • LPコーディング（25分）
    • バグ修正作業（25分）
    • ドキュメント更新（25分）
    • コードレビュー（25分）
- メモ：
    - ファーストビュー画像の崩れを修正した
    - APIのレスポンス速度を改善
    - テストカバレッジが85%に向上

### AI要約
今日は主にフロントエンド開発に集中し、UI改善とパフォーマンス最適化を実施。バグ修正とテスト強化により品質向上を図った。ドキュメント整備も並行して進め、プロジェクト全体の完成度を高めた。
```

## 🔧 API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|----------|------|
| `/api/start` | POST | タイマー開始 |
| `/api/stop` | POST | タイマー停止 |
| `/api/note` | POST | メモ追加 |
| `/api/today` | GET | 今日の作業サマリー |
| `/health` | GET | ヘルスチェック |

## 🎯 技術スタック

**フロントエンド:**
- React 18
- Vite
- Tailwind CSS (CDN)
- Web Speech API
- PWA

**バックエンド:**
- Python 3.12
- Flask
- SQLite3
- APScheduler
- Discord Webhooks

**インフラ:**
- Docker & Docker Compose
- Nginx (プロダクション推奨)

## 🔒 セキュリティ

- 環境変数でシークレット管理
- CORS設定でオリジン制限
- SQLインジェクション対策済み
- Webhookトークン認証

## 🐛 トラブルシューティング

### 音声入力が動作しない
- ブラウザのマイク許可を確認
- HTTPSまたはlocalhostでアクセス
- Chrome/Edge/Safari推奨

### Discord通知が届かない
- Webhook URLが正しいか確認
- サーバー側のネットワーク設定を確認

### 日報が生成されない
- VAULT_PATHのディレクトリ存在確認
- Python実行権限の確認
- cron設定の確認

## 📈 今後の拡張予定

- [ ] 統計ダッシュボード
- [ ] 複数プロジェクト対応
- [ ] Slack通知対応
- [ ] モバイルアプリ（React Native）
- [ ] チーム機能
- [ ] 目標設定・達成追跡

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 👨‍💻 作者

あなたの名前 - [@your_twitter](https://twitter.com/your_twitter)

プロジェクトリンク: [https://github.com/yourusername/pomo-hub](https://github.com/yourusername/pomo-hub)