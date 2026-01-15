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
    // すべての訪問記録を取得
    const scanParams = {
      TableName: process.env.VISITS_TABLE_NAME,
    };

    const result = await dynamodb.scan(scanParams).promise();

    // 日付ごとに集計
    const visitsByDate = {};
    const visitsByHour = {};

    if (result.Items) {
      result.Items.forEach((item) => {
        const date = item.date || item.timestamp?.split("T")[0];
        const hour = item.timestamp
          ? new Date(item.timestamp).getHours()
          : null;

        // 日付ごとのカウント
        if (date) {
          visitsByDate[date] = (visitsByDate[date] || 0) + 1;
        }

        // 時間ごとのカウント（今日のみ）
        if (hour !== null && date === new Date().toISOString().split("T")[0]) {
          visitsByHour[hour] = (visitsByHour[hour] || 0) + 1;
        }
      });
    }

    // グラフ用のデータを整形
    const dateData = Object.keys(visitsByDate)
      .sort()
      .map((date) => ({
        date,
        count: visitsByDate[date],
      }));

    const hourData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: visitsByHour[i] || 0,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalCount: result.Items ? result.Items.length : 0,
        visitsByDate: dateData,
        visitsByHour: hourData,
        allVisits: result.Items || [],
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
