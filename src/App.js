import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json";
import "./App.css";

// Amplifyの設定
Amplify.configure(outputs);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [totalCount, setTotalCount] = useState(0);
  const [dateData, setDateData] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // APIエンドポイントを取得
  const getApiUrl = () => {
    try {
      // Gen 2ではamplify_outputs.jsonから関数のURLを取得
      // 関数のURLは custom.recordVisit や custom.getVisits に含まれる可能性があります
      const apiUrl =
        outputs?.custom?.recordVisit?.url ||
        outputs?.custom?.apiUrl ||
        outputs?.api?.url ||
        process.env.REACT_APP_API_URL ||
        "";
      return apiUrl;
    } catch (err) {
      console.warn("amplify_outputs.jsonが見つかりません");
      return process.env.REACT_APP_API_URL || "";
    }
  };

  // 訪問を記録
  const recordVisit = async () => {
    const API_BASE_URL = getApiUrl();

    // APIエンドポイントが設定されていない場合はスキップ
    if (!API_BASE_URL) {
      console.warn("APIエンドポイントが設定されていません");
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/recordVisit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `訪問記録に失敗しました: ${response.status} ${response.statusText}`
        );
      }

      // JSONパースを試行（Content-Typeヘッダーに依存しない）
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        throw new Error(
          `JSONパースに失敗しました。レスポンス: ${text.substring(0, 100)}`
        );
      }
    } catch (err) {
      console.error("訪問記録エラー:", err);
      setError(err.message);
      return null;
    }
  };

  // 訪問データを取得
  const fetchVisits = async () => {
    const API_BASE_URL = getApiUrl();

    // APIエンドポイントが設定されていない場合はスキップ
    if (!API_BASE_URL) {
      console.warn("APIエンドポイントが設定されていません");
      setError(
        "APIエンドポイントが設定されていません。amplify_outputs.jsonを確認するか、.envファイルにREACT_APP_API_URLを設定してください。"
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/getVisits`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `データ取得に失敗しました: ${response.status} ${response.statusText}`
        );
      }

      // JSONパースを試行（Content-Typeヘッダーに依存しない）
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(
          `JSONパースに失敗しました。APIエンドポイントが正しく設定されているか確認してください。レスポンス: ${text.substring(
            0,
            200
          )}`
        );
      }

      setTotalCount(data.totalCount || 0);
      setDateData(data.visitsByDate || []);
      setHourData(data.visitsByHour || []);
      setLoading(false);
      setError(null); // 成功時はエラーをクリア
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初回アクセス時に訪問を記録
    recordVisit().then(() => {
      // 記録後にデータを取得
      fetchVisits();
    });

    // 定期的にデータを更新（30秒ごと）- APIエンドポイントが設定されている場合のみ
    let interval;
    const API_BASE_URL = getApiUrl();
    if (API_BASE_URL) {
      interval = setInterval(() => {
        fetchVisits();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // 日付別グラフのデータ
  const dateChartData = {
    labels: dateData.map((item) => item.date),
    datasets: [
      {
        label: "訪問者数",
        data: dateData.map((item) => item.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // 時間別グラフのデータ（今日のみ）
  const hourChartData = {
    labels: hourData.map((item) => `${item.hour}時`),
    datasets: [
      {
        label: "訪問者数（今日）",
        data: hourData.map((item) => item.count),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "訪問者統計",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="App">
        <div className="container">
          <h1>訪問者カウンター</h1>
          <p>データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="container">
          <h1>訪問者カウンター</h1>
          <div className="error">
            <h2>エラーが発生しました</h2>
            <p>{error}</p>
            <div className="error-instructions">
              <h3>対処方法:</h3>
              <ol>
                <li>
                  <code>npx ampx sandbox</code>
                  を実行してローカル環境を起動してください
                </li>
                <li>
                  または、<code>amplify_outputs.json</code>
                  ファイルが正しく生成されているか確認してください
                </li>
                <li>
                  プロジェクトルートに<code>.env</code>
                  ファイルを作成し、<code>REACT_APP_API_URL</code>
                  を設定することもできます
                </li>
              </ol>
              <p className="note">
                開発中は、Amplify Gen 2のsandbox環境を使用することを推奨します。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>訪問者カウンター</h1>
          <div className="total-count">
            <h2>総訪問者数</h2>
            <p className="count-number">{totalCount}</p>
            <p className="count-note">
              ※同じIPアドレスからの同日アクセスは1回としてカウント
            </p>
          </div>
        </header>

        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>日付別訪問者数</h3>
            <div className="chart-container">
              <Bar data={dateChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-wrapper">
            <h3>時間別訪問者数（今日）</h3>
            <div className="chart-container">
              <Line data={hourChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
