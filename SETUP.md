# セットアップ手順

## 前提条件

- Node.js (v14 以上)
- npm または yarn
- AWS アカウント
- AWS Amplify CLI

## 1. 依存関係のインストール

```bash
npm install
```

## 2. AWS Amplify CLI のインストール

```bash
npm install -g @aws-amplify/cli
```

## 3. AWS 認証情報の設定

```bash
amplify configure
```

このコマンドで AWS 認証情報を設定します。

## 4. Amplify プロジェクトの初期化

```bash
amplify init
```

以下のような質問に答えます：

- Enter a name for the project: `visitorCounter` (または任意の名前)
- Initialize the project with the above settings? `Yes`
- Select the authentication method: `AWS profile` を選択
- Please choose the profile you want to use: 使用するプロファイルを選択

## 5. DynamoDB テーブルの追加

```bash
amplify add storage
```

以下の選択肢を選びます：

- Please select from one of the below mentioned services: `DynamoDB`
- Please provide a friendly name: `visitsTable`
- Please provide table name: `visitsTable`
- What would you like to name this column: `id` (String 型、Partition key)

## 6. Lambda 関数の追加

### recordVisit 関数の追加

```bash
amplify add function
```

- Select which capability you want to add: `Lambda function (serverless function)`
- Provide an AWS Lambda function name: `recordVisit`
- Choose the runtime that you want to use: `NodeJS`
- Choose the function template that you want to use: `Hello World`
- Do you want to configure advanced settings? `Yes`
- Do you want to access other resources in this project from your Lambda function? `Yes`
- Select the category: `storage`
- Select the operations you want to permit for visitsTable: `create, read, update, delete`
- Do you want to invoke this function on a recurring schedule? `No`
- Do you want to enable Lambda layers for this function? `No`
- Do you want to configure environment variables for this function? `Yes`
- Enter the environment variable name: `VISITS_TABLE_NAME`
- Enter the environment variable value: `visitsTable-<your-env-name>`

### getVisits 関数の追加

同様の手順で`getVisits`関数も追加します。

## 7. API Gateway の追加

```bash
amplify add api
```

- Please select from one of the below mentioned services: `REST`
- Provide a friendly name: `visitorCounter`
- Provide a path: `/`
- Choose a Lambda source: `Use a Lambda function already added in the current Amplify project`
- Select the Lambda function to invoke by this path: `recordVisit`
- Restrict API access: `Yes`
- Who should have access: `Authenticated users only` または `Public` (開発中は Public 推奨)
- What kind of access do you want for Authenticated users: `create, read, update, delete`

追加のパスとして`/getVisits`も追加します。

## 8. Lambda 関数のコード更新

`amplify/backend/function/recordVisit/src/index.js`と`amplify/backend/function/getVisits/src/index.js`の内容を、プロジェクト内の対応するファイルの内容で置き換えます。

## 9. バックエンドのデプロイ

```bash
amplify push
```

これにより、Lambda 関数、DynamoDB テーブル、API Gateway が AWS にデプロイされます。

## 10. API エンドポイントの取得

デプロイ後、以下のコマンドで API エンドポイントを確認できます：

```bash
amplify status
```

または、AWS Console の API Gateway からエンドポイントを確認します。

## 11. 環境変数の設定

`.env`ファイルを作成し、API エンドポイントを設定します：

```env
REACT_APP_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

## 12. アプリケーションの起動

```bash
npm start
```

ブラウザで`http://localhost:3000`を開いて動作を確認します。

## トラブルシューティング

### CORS エラーの場合

API Gateway の設定で CORS を有効にする必要があります。Amplify Console または AWS Console で CORS 設定を確認してください。

### Lambda 関数が DynamoDB にアクセスできない場合

Lambda 関数の IAM ロールに DynamoDB へのアクセス権限が付与されているか確認してください。`amplify push`時に自動的に設定されるはずです。

### IP アドレスが取得できない場合

API Gateway の設定で、リクエストコンテキストから IP アドレスを取得できるように設定されているか確認してください。

## 本番環境へのデプロイ

### Amplify Console を使用する場合

1. AWS Amplify Console で新しいアプリを作成
2. GitHub リポジトリを接続
3. ビルド設定は自動的に`amplify.yml`を使用
4. 環境変数`REACT_APP_API_URL`を設定

### 手動デプロイの場合

```bash
npm run build
amplify publish
```
