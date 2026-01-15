const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // OPTIONSリクエストの処理
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // IPアドレスを取得（API Gatewayから）
    const ipAddress =
      event.requestContext?.identity?.sourceIp ||
      event.headers["x-forwarded-for"]?.split(",")[0] ||
      event.headers["X-Forwarded-For"]?.split(",")[0] ||
      "unknown";

    // 今日の日付を取得（YYYY-MM-DD形式）
    const today = new Date().toISOString().split("T")[0];

    // 現在の時刻を取得
    const timestamp = new Date().toISOString();

    // 一意のキー（IPアドレス + 日付）
    const uniqueKey = `${ipAddress}_${today}`;

    // DynamoDBに既に存在するかチェック
    const checkParams = {
      TableName: process.env.VISITS_TABLE_NAME,
      Key: {
        id: uniqueKey,
      },
    };

    const existing = await dynamodb.get(checkParams).promise();

    // 既に存在する場合は、カウントを増やさない
    if (existing.Item) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Already counted today",
          isNewVisit: false,
          totalCount: existing.Item.totalCount || 0,
        }),
      };
    }

    // 新しい訪問として記録
    const putParams = {
      TableName: process.env.VISITS_TABLE_NAME,
      Item: {
        id: uniqueKey,
        ipAddress: ipAddress,
        date: today,
        timestamp: timestamp,
        createdAt: timestamp,
      },
    };

    await dynamodb.put(putParams).promise();

    // 総訪問数を取得
    const scanParams = {
      TableName: process.env.VISITS_TABLE_NAME,
    };

    const allVisits = await dynamodb.scan(scanParams).promise();
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
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
