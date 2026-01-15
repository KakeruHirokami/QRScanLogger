import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Function } from "aws-cdk-lib/aws-lambda";
import { data } from "./data/resource";
import { recordVisit } from "./function/recordVisit/resource";
import { getVisits } from "./function/getVisits/resource";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  data,
  recordVisit,
  getVisits,
});

// Lambda関数にDynamoDBテーブルへのアクセス権限を付与
const visitsTable = backend.data.resources.tables["Visit"];

// recordVisit関数への権限付与
backend.recordVisit.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Scan"],
    resources: [visitsTable.tableArn],
  })
);

(backend.recordVisit.resources.lambda as Function).addEnvironment(
  "VISITS_TABLE_NAME",
  visitsTable.tableName
);

// getVisits関数への権限付与
backend.getVisits.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:Scan"],
    resources: [visitsTable.tableArn],
  })
);

(backend.getVisits.resources.lambda as Function).addEnvironment(
  "VISITS_TABLE_NAME",
  visitsTable.tableName
);

// API Gatewayの設定
const apiStack = backend.createStack("api-stack");

const recordVisitIntegration = new HttpLambdaIntegration(
  "RecordVisitIntegration",
  backend.recordVisit.resources.lambda
);

const getVisitsIntegration = new HttpLambdaIntegration(
  "GetVisitsIntegration",
  backend.getVisits.resources.lambda
);

const httpApi = new HttpApi(apiStack, "VisitorCounterApi", {
  apiName: "visitor-counter-api",
  corsPreflight: {
    allowMethods: [
      CorsHttpMethod.GET,
      CorsHttpMethod.POST,
      CorsHttpMethod.OPTIONS,
    ],
    allowOrigins: ["*"],
    allowHeaders: ["*"],
  },
  createDefaultStage: true,
});

// ルートの追加
httpApi.addRoutes({
  path: "/recordVisit",
  methods: [HttpMethod.POST, HttpMethod.OPTIONS],
  integration: recordVisitIntegration,
});

httpApi.addRoutes({
  path: "/getVisits",
  methods: [HttpMethod.GET, HttpMethod.OPTIONS],
  integration: getVisitsIntegration,
});

// 出力の追加
backend.addOutput({
  custom: {
    apiUrl: httpApi.url,
    apiName: httpApi.httpApiName,
    region: Stack.of(httpApi).region,
  },
});
