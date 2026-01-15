# トラブルシューティング

## AWS権限エラー

### エラー: `ssm:GetParameter`権限がない

Amplify Gen 2のsandbox環境を起動する際に、以下のエラーが発生する場合：

```
AccessDeniedException: User is not authorized to perform: ssm:GetParameter
```

#### 解決方法 1: IAMポリシーを追加

AWS IAMコンソールで、`amplifycli`ユーザーに以下のポリシーを追加してください：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*"
    }
  ]
}
```

#### 解決方法 2: CDKブートストラップを実行

CDKブートストラップがまだ実行されていない場合は、実行してください：

```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION --profile kakeruhirokami-amplify-admin
```

例：

```bash
npx cdk bootstrap aws://813465786249/ap-northeast-1 --profile kakeruhirokami-amplify-admin
```

#### 解決方法 3: より権限のあるIAMポリシーを使用

Amplify Gen 2のsandbox環境には、以下の権限が必要です：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "iam:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "ssm:*",
        "logs:*",
        "ec2:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**注意**: 本番環境では、必要最小限の権限のみを付与することを推奨します。

#### 解決方法 4: 管理者権限を持つプロファイルを使用

開発環境では、一時的に管理者権限を持つプロファイルを使用することもできます：

```bash
npx ampx sandbox --profile admin-profile
```

## その他のエラー

### `amplify_outputs.json`が見つからない

`npx ampx sandbox`を実行して、sandbox環境を起動してください。これにより`amplify_outputs.json`が自動生成されます。

### Lambda関数がDynamoDBにアクセスできない

`amplify/backend.ts`で、Lambda関数にDynamoDBへのアクセス権限が正しく設定されているか確認してください。

### CORSエラー

API Gatewayの設定でCORSが有効になっているか確認してください。`amplify/backend.ts`でCORS設定を確認してください。
