import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { visitorHandler } from "./functions/visitor-handler/resource";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

const backend = defineBackend({
  data,
  visitorHandler,
});

// DynamoDBテーブルへの参照を取得
const visitorTable = backend.data.resources.tables["Visitor"];

// Lambda関数に環境変数を設定
backend.visitorHandler.addEnvironment(
  "VISITOR_TABLE_NAME",
  visitorTable.tableName
);

// Lambda関数にDynamoDBアクセス権限を付与
visitorTable.grantReadWriteData(backend.visitorHandler.resources.lambda);

// REST APIを作成
const httpApi = new HttpApi(backend.stack, "VisitorApi", {
  apiName: "visitor-api",
  corsPreflight: {
    allowOrigins: ["*"],
    allowMethods: [
      CorsHttpMethod.GET,
      CorsHttpMethod.POST,
      CorsHttpMethod.OPTIONS,
    ],
    allowHeaders: ["Content-Type"],
  },
});

// Lambda関数との統合
const lambdaIntegration = new HttpLambdaIntegration(
  "VisitorHandlerIntegration",
  backend.visitorHandler.resources.lambda
);

// ルートを追加
httpApi.addRoutes({
  path: "/visit",
  methods: [HttpMethod.POST, HttpMethod.OPTIONS],
  integration: lambdaIntegration,
});

httpApi.addRoutes({
  path: "/stats",
  methods: [HttpMethod.GET, HttpMethod.OPTIONS],
  integration: lambdaIntegration,
});

// APIのURLを出力に追加
backend.addOutput({
  custom: {
    apiUrl: httpApi.url!,
    apiId: httpApi.httpApiId,
  },
});
