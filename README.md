# 訪問者カウンターアプリ

AWS Amplify Gen 2 を使用した訪問者カウンターアプリケーションです。

## 機能

- サイトへのアクセス数をカウント
- 同じ IP アドレスからの同日アクセスは 1 回としてカウント
- 日付別の訪問者数を棒グラフで表示
- 時間別の訪問者数を折れ線グラフで表示（今日のみ）

## 技術スタック

- **フロントエンド**: React
- **バックエンド**: AWS Lambda
- **データベース**: Amazon DynamoDB
- **API**: Amazon API Gateway
- **デプロイ**: AWS Amplify
- **グラフ**: Chart.js / react-chartjs-2

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Amplify Gen 2 のセットアップ

Amplify Gen 2 では、sandbox 環境を使用してローカルで開発できます：

```bash
npx ampx sandbox
```

このコマンドを実行すると：

- DynamoDB テーブルが作成されます
- Lambda 関数がデプロイされます
- API Gateway が設定されます
- `amplify_outputs.json`が自動生成されます

### 3. アプリケーションの起動

別のターミナルで：

```bash
npm start
```

ブラウザで`http://localhost:3000`を開いて動作を確認します。

詳細なセットアップ手順は`SETUP_GEN2.md`を参照してください。

## デプロイ

### Amplify Console へのデプロイ

1. AWS Amplify Console で新しいアプリを作成
2. GitHub リポジトリを接続
3. ビルド設定は自動的に`amplify.yml`を使用

### 手動ビルド

```bash
npm run build
```

## プロジェクト構造（Gen 2）

```
├── amplify/
│   ├── backend.ts              # メインのバックエンド定義
│   ├── data/
│   │   └── resource.ts         # DynamoDBテーブル定義
│   └── function/
│       ├── recordVisit/
│       │   ├── resource.ts      # Lambda関数定義
│       │   └── handler.ts      # Lambda関数の実装
│       └── getVisits/
│           ├── resource.ts
│           └── handler.ts
├── amplify_outputs.json         # 自動生成される設定ファイル
├── amplify.yml                  # Amplify Hosting用のビルド設定
└── src/
    ├── App.js                   # メインコンポーネント
    └── App.css                  # スタイル
```

## 重要な注意事項

1. **IP アドレスの取得**: 本番環境では、API Gateway の設定により IP アドレスが正しく取得されることを確認してください。
2. **CORS 設定**: API Gateway で CORS が有効になっていることを確認してください。
3. **環境変数**: Lambda 関数に`VISITS_TABLE_NAME`環境変数が設定されていることを確認してください（`amplify/backend.ts`で自動設定されます）。
4. **amplify_outputs.json**: このファイルは`npx ampx sandbox`実行時に自動生成されます。手動で編集する必要はありません。

## ライセンス

MIT
