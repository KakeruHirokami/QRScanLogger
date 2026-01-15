# デプロイ手順

このドキュメントでは、Amplify Gen 2プロジェクトのデプロイ方法を説明します。

## 前提条件

- Node.js (v18以上)
- AWSアカウント
- AWS CLIが設定されていること
- Amplify CLIがインストールされていること

## デプロイ方法

### 方法1: Amplify Hosting（推奨）

Amplify Hostingを使用すると、GitHubリポジトリと連携して自動デプロイが可能です。

#### 1. GitHubリポジトリにプッシュ

```bash
git add .
git commit -m "デプロイ準備"
git push origin main
```

#### 2. AWS Amplify Consoleでアプリを作成

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/)にアクセス
2. 「新しいアプリ」→「ホスト」を選択
3. 「GitHub」を選択してリポジトリを接続
4. ブランチを選択（通常は`main`）
5. ビルド設定を確認（`amplify.yml`が自動的に使用されます）
6. 「保存してデプロイ」をクリック

#### 3. ビルド設定の確認

Amplify Consoleでは、`amplify.yml`の設定が自動的に使用されます。バックエンドとフロントエンドが自動的にビルド・デプロイされます。

### 方法2: 手動デプロイ（pipeline-deploy）

Amplify Gen 2の`pipeline-deploy`コマンドを使用してデプロイします。

#### 1. ブランチのデプロイ

```bash
npx ampx pipeline-deploy --branch main
```

このコマンドは以下を実行します：

- バックエンドリソース（Lambda、DynamoDB、API Gateway）のデプロイ
- フロントエンドのビルド
- `amplify_outputs.json`の生成

#### 2. 環境の指定

特定の環境にデプロイする場合：

```bash
npx ampx pipeline-deploy --branch main --app-id <app-id>
```

### 方法3: Sandbox環境（開発用）

開発・テスト用のsandbox環境を起動します：

```bash
npx ampx sandbox
```

このコマンドは：

- ローカル開発環境をAWSにデプロイ
- `amplify_outputs.json`を自動生成
- 変更を監視して自動的に再デプロイ

**注意**: Sandbox環境は開発用であり、本番環境には適していません。

## ビルド設定（amplify.yml）

`amplify.yml`はAmplify Hostingで使用されるビルド設定ファイルです。Amplify Gen 2では、バックエンドとフロントエンドが自動的にビルドされます。

現在の設定では：

- フロントエンドのみがビルドされます
- バックエンドはAmplify Gen 2が自動的に処理します

## デプロイ後の確認事項

### 1. amplify_outputs.jsonの確認

デプロイ後、`amplify_outputs.json`が正しく生成されているか確認してください：

```bash
cat amplify_outputs.json
```

このファイルには以下が含まれます：

- API GatewayのエンドポイントURL
- DynamoDBテーブル情報
- その他のリソース情報

### 2. APIエンドポイントの確認

`amplify_outputs.json`の`custom.apiUrl`を確認し、APIが正しく動作するかテストしてください：

```bash
curl https://your-api-url.execute-api.region.amazonaws.com/getVisits
```

### 3. フロントエンドの確認

デプロイされたフロントエンドのURLにアクセスして、アプリケーションが正常に動作するか確認してください。

## 環境変数の設定

### フロントエンド

Amplify Consoleで環境変数を設定する場合：

1. Amplify Consoleでアプリを選択
2. 「環境変数」タブを開く
3. 必要な環境変数を追加（例: `REACT_APP_API_URL`）

### バックエンド

バックエンドの環境変数は`amplify/backend.ts`で設定されます。変更後は再デプロイが必要です。

## トラブルシューティング

### デプロイが失敗する場合

1. **ビルドエラーの確認**
   - Amplify Consoleの「ビルドログ」を確認
   - ローカルで`npm run build`が成功するか確認

2. **権限エラーの確認**
   - AWS IAMロールに適切な権限があるか確認
   - CDKブートストラップが完了しているか確認

3. **依存関係の確認**
   - `package.json`の依存関係が正しいか確認
   - `npm install`が正常に完了するか確認

### amplify_outputs.jsonが生成されない

- `npx ampx sandbox`または`npx ampx pipeline-deploy`を実行してください
- デプロイが正常に完了しているか確認してください

### APIエンドポイントにアクセスできない

- CORS設定を確認（`amplify/backend.ts`で設定）
- API Gatewayの設定を確認
- セキュリティグループやネットワーク設定を確認

## 本番環境へのデプロイ

本番環境にデプロイする前に：

1. **セキュリティ設定の確認**
   - CORS設定が適切か
   - API認証が必要か
   - 環境変数が適切に設定されているか

2. **パフォーマンスの確認**
   - Lambda関数のタイムアウト設定
   - DynamoDBの読み書きキャパシティ
   - API Gatewayのレート制限

3. **バックアップとモニタリング**
   - CloudWatchでのログ監視
   - エラーアラートの設定
   - データバックアップの計画

## 参考リンク

- [Amplify Gen 2 デプロイガイド](https://docs.amplify.aws/react/deploy-and-host/)
- [Amplify Hosting ドキュメント](https://docs.aws.amazon.com/amplify/)
- [Amplify Gen 2 CLI リファレンス](https://docs.amplify.aws/react/tools/cli/)
