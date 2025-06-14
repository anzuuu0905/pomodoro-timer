# Google Cloud Run + Firebase Hostingデプロイガイド

## 前提条件

1. Google Cloud Platform（GCP）アカウント
2. Firebase プロジェクト（GCPプロジェクトと同じ）
3. インストール済みツール：
   - `gcloud` CLI
   - `firebase-tools`
   - Docker

## セットアップ手順

### 1. GCPプロジェクトの作成

```bash
# プロジェクトの作成（既存の場合はスキップ）
gcloud projects create YOUR_PROJECT_ID --name="PomoHub"

# プロジェクトの設定
export GCP_PROJECT_ID=YOUR_PROJECT_ID
gcloud config set project $GCP_PROJECT_ID
```

### 2. Firebaseプロジェクトの初期化

```bash
# Firebase CLIのインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseログイン
firebase login

# プロジェクトの初期化
firebase init
# Hosting と Firestore を選択
```

### 3. サービスアカウントの作成

```bash
# サービスアカウントの作成
gcloud iam service-accounts create pomohub-backend \
    --display-name="PomoHub Backend Service Account"

# 必要な権限の付与
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:pomohub-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"
```

### 4. Firebase設定の更新

`.firebaserc`ファイルを編集：
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

### 5. デプロイ

```bash
# 環境変数の設定
export GCP_PROJECT_ID=YOUR_PROJECT_ID
export GCP_REGION=asia-northeast1

# デプロイスクリプトの実行
./deploy-gcp.sh
```

## 環境変数

### Cloud Run
- `FLASK_ENV`: production
- `FRONTEND_URL`: Firebase HostingのURL（自動設定）
- `GOOGLE_APPLICATION_CREDENTIALS`: 自動設定（Cloud Run環境）

### Firebase Hosting
- `VITE_API_URL`: Cloud RunのURL（自動設定）

## 料金

### 無料枠
- **Cloud Run**: 月200万リクエストまで無料
- **Firebase Hosting**: 10GB/月の転送量まで無料
- **Firestore**: 
  - 読み取り: 5万回/日
  - 書き込み: 2万回/日
  - ストレージ: 1GBまで無料

### 推定月額費用
- 小規模利用（1日100ユーザー程度）: **無料**
- 中規模利用（1日1000ユーザー程度）: **数百円程度**

## トラブルシューティング

### Cloud Runのデプロイエラー
```bash
# ログの確認
gcloud builds log --limit=10

# サービスの状態確認
gcloud run services describe pomohub-backend --region asia-northeast1
```

### Firebase Hostingのエラー
```bash
# Firebase のデバッグモード
firebase deploy --only hosting --debug
```

### Firestoreの権限エラー
```bash
# Firestoreのルールを確認
firebase deploy --only firestore:rules
```

## 監視とログ

- Cloud Runログ: https://console.cloud.google.com/run
- Firebaseコンソール: https://console.firebase.google.com
- Firestoreデータ: https://console.cloud.google.com/firestore