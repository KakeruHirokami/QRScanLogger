// 環境変数の取得
const TABLE_NAME = process.env.VISITOR_TABLE_NAME || "";

// DynamoDBクライアントの初期化（動的インポートを使用してバンドル時の問題を回避）
async function getDocClient() {
  const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient } = await import("@aws-sdk/lib-dynamodb");
  const client = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(client);
}

interface Visitor {
  date: string;
  ipAddress: string;
  timestamp: string;
}

interface VisitorStats {
  date: string;
  count: number;
}

// API Gateway v2 (HTTP API) イベント形式に対応
interface ApiGatewayEvent {
  version?: string;
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
  };
  path?: string;
  headers?: { [key: string]: string };
  body?: string;
  rawPath?: string;
  rawQueryString?: string;
}

export const handler = async (event: ApiGatewayEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // API Gateway v2 (HTTP API) 形式の対応
  const httpMethod =
    event.httpMethod ||
    event.requestContext?.http?.method ||
    event.requestContext?.http?.method ||
    "";
  const path =
    event.path || event.rawPath || event.requestContext?.http?.path || "";

  // CORS preflight
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // 訪問者の記録
    if (httpMethod === "POST" && path.includes("/visit")) {
      const ipAddress =
        event.headers?.["x-forwarded-for"]?.split(",")[0] ||
        event.headers?.["x-real-ip"] ||
        event.headers?.["X-Forwarded-For"]?.split(",")[0] ||
        "unknown";
      const now = new Date();
      const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timestamp = now.toISOString();

      // 同じ日の同じIPからの訪問は1人としてカウント
      const key = `${date}#${ipAddress}`;

      const docClient = await getDocClient();
      const { PutCommand } = await import("@aws-sdk/lib-dynamodb");
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            id: key,
            date,
            ipAddress,
            timestamp,
          },
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    // 訪問者統計の取得
    if (httpMethod === "GET" && path.includes("/stats")) {
      const docClient = await getDocClient();
      const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
        })
      );

      // 時分ごとに集計（YYYY-MM-DD HH:mm形式）
      const statsByDateTime: { [key: string]: number } = {};
      let totalCount = 0;

      if (result.Items) {
        result.Items.forEach((item) => {
          const visitor = item as Visitor;
          // timestampから時分を抽出（YYYY-MM-DD HH:mm形式）
          // ISO文字列から直接抽出する方が確実
          if (visitor.timestamp) {
            // ISO形式: 2024-01-15T14:30:00.000Z
            const isoMatch = item.timestamp.match(
              /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/
            );
            if (isoMatch) {
              const date = isoMatch[1]; // YYYY-MM-DD
              const time = isoMatch[2]; // HH:mm
              const dateTimeKey = `${date} ${time}`;

              if (!statsByDateTime[dateTimeKey]) {
                statsByDateTime[dateTimeKey] = 0;
              }
              statsByDateTime[dateTimeKey]++;
              totalCount++;
            } else {
              // フォールバック: 既存のdateフィールドを使用（古いデータ用）
              const dateTimeKey = `${visitor.date} 00:00`;
              if (!statsByDateTime[dateTimeKey]) {
                statsByDateTime[dateTimeKey] = 0;
              }
              statsByDateTime[dateTimeKey]++;
              totalCount++;
            }
          } else {
            // timestampがない場合のフォールバック
            const dateTimeKey = `${visitor.date} 00:00`;
            if (!statsByDateTime[dateTimeKey]) {
              statsByDateTime[dateTimeKey] = 0;
            }
            statsByDateTime[dateTimeKey]++;
            totalCount++;
          }
        });
      }

      // 日時でソート
      const stats: VisitorStats[] = Object.entries(statsByDateTime)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalCount,
          stats,
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
