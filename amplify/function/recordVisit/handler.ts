import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // OPTIONSリクエストの処理
  if (event.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } =
      await import("@aws-sdk/lib-dynamodb");

    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);

    // IPアドレスを取得
    const ipAddress =
      event.requestContext?.http?.sourceIp ||
      event.requestContext?.identity?.sourceIp ||
      event.headers?.["x-forwarded-for"]?.split(",")[0] ||
      event.headers?.["X-Forwarded-For"]?.split(",")[0] ||
      "unknown";

    // 今日の日付を取得（YYYY-MM-DD形式）
    const today = new Date().toISOString().split("T")[0];

    // 現在の時刻を取得
    const timestamp = new Date().toISOString();

    // 一意のキー（IPアドレス + 日付）
    const uniqueKey = `${ipAddress}_${today}`;

    const tableName = process.env.VISITS_TABLE_NAME;
    if (!tableName) {
      throw new Error("VISITS_TABLE_NAME environment variable is not set");
    }

    // DynamoDBに既に存在するかチェック
    const existing = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          id: uniqueKey,
        },
      })
    );

    // 既に存在する場合は、カウントを増やさない
    if (existing.Item) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Already counted today",
          isNewVisit: false,
          totalCount: 0,
        }),
      };
    }

    // 新しい訪問として記録
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          id: uniqueKey,
          ipAddress: ipAddress,
          date: today,
          timestamp: timestamp,
          createdAt: timestamp,
        },
      })
    );

    // 総訪問数を取得
    const allVisits = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const totalCount = allVisits.Items ? allVisits.Items.length : 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Visit recorded",
        isNewVisit: true,
        totalCount: totalCount,
        timestamp: timestamp,
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
