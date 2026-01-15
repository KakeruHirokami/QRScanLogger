# Amplify Gen 2 セットアップ手順

## 前提条件

- Node.js (v18 以上)
- npm または yarn
- AWS アカウント

## 1. 依存関係のインストール

```bash
npm install
```

## 2. Amplify Gen 2 の初期化

```bash
npx create-amplify@latest
```

または、既存プロジェクトの場合は：

```bash
npx ampx configure project
```

## 3. ローカル開発環境の起動

Amplify Gen 2 では、sandbox 環境を使用してローカルで開発できます：

```bash
npx ampx sandbox
```

このコマンドを実行すると：

- DynamoDB テーブルが作成されます
- Lambda 関数がデプロイされます
- API Gateway が設定されます
- `amplify_outputs.json`が自動生成されます

## 4. アプリケーションの起動

別のターミナルで：

```bash
npm start
```

ブラウザで`http://localhost:3000`を開いて動作を確認します。

## 5. 本番環境へのデプロイ

### Amplify Hosting を使用する場合

1. AWS Amplify Console で新しいアプリを作成
2. GitHub リポジトリを接続
3. ビルド設定は自動的に`amplify.yml`を使用
4. 環境変数は自動的に`amplify_outputs.json`から読み込まれます

### 手動デプロイ

```bash
npx ampx pipeline-deploy --branch main
```

## プロジェクト構造（Gen 2）

```
├── amplify/
│   ├── backend.ts              # メインのバックエンド定義
│   ├── data/
│   │   └── resource.ts         # DynamoDBテーブル定義
│   ├── api/
│   │   └── resource.ts         # API Gateway定義
│   └── function/
│       ├── recordVisit/
│       │   ├── resource.ts     # Lambda関数定義
│       │   └── handler.ts      # Lambda関数の実装
│       └── getVisits/
│           ├── resource.ts
│           └── handler.ts
├── amplify_outputs.json         # 自動生成される設定ファイル
├── amplify.yml                  # Amplify Hosting用のビルド設定
└── src/
    └── App.js                   # フロントエンド
```

## Gen 2 の主な特徴

1. **TypeScript ベースの設定**: すべての設定が TypeScript で記述されます
2. **自動生成される設定**: `amplify_outputs.json`が自動生成され、フロントエンドで使用できます
3. **Sandbox 環境**: ローカル開発用の sandbox 環境が提供されます
4. **簡潔な設定**: Gen 1 と比べて、より簡潔で理解しやすい設定

## トラブルシューティング

### `amplify_outputs.json`が見つからない

`npx ampx sandbox`を実行して、sandbox 環境を起動してください。これにより`amplify_outputs.json`が自動生成されます。

### Lambda 関数が DynamoDB にアクセスできない

`amplify/backend.ts`で、Lambda 関数に DynamoDB へのアクセス権限が正しく設定されているか確認してください。

### CORS エラー

API Gateway の設定で CORS が有効になっているか確認してください。Gen 2 では、`amplify/api/resource.ts`で CORS 設定を行います。

## 参考リンク

- [Amplify Gen 2 ドキュメント](https://docs.amplify.aws/react/)
- [Amplify Gen 2 ガイド](https://docs.amplify.aws/react/build-a-backend/)
