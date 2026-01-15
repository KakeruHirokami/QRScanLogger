import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import outputs from "../amplify_outputs.json";
import "./App.css";

// Chart.jsの設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VisitorStats {
  date: string;
  count: number;
}

interface StatsResponse {
  totalCount: number;
  stats: VisitorStats[];
}

function App() {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [stats, setStats] = useState<VisitorStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // API URLを取得
  const getApiUrl = (): string => {
    const custom = (outputs as any).custom;
    return custom?.apiUrl || "";
  };

  // 訪問を記録
  const recordVisit = async () => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        console.error("API URL is not configured");
        return;
      }

      const response = await fetch(`${apiUrl}visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error recording visit:", error);
    }
  };

  // 統計を取得
  const fetchStats = async () => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        console.error("API URL is not configured");
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as StatsResponse;
      console.log("Stats data:", data); // デバッグ用
      setTotalCount(data.totalCount);
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // ページロード時に訪問を記録し、統計を取得
    const initialize = async () => {
      await recordVisit();
      await fetchStats();
    };
    initialize();

    // 定期的に統計を更新（30秒ごと）
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <h1 className="title">訪問者カウンター</h1>

      <div className="counter-container">
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : (
          <>
            <div className="total-count">{totalCount.toLocaleString()}</div>
            <div className="counter-label">総訪問者数</div>
          </>
        )}
      </div>

      <div className="chart-container">
        <h2 className="chart-title">訪問者数の推移</h2>
        {stats.length > 0 ? (
          <div className="chart-wrapper">
            <Line
              data={{
                labels: stats.map((item) => {
                  // YYYY-MM-DD HH:mm形式を MM/DD HH:mm に変換
                  const dateStr = item.date;
                  const parts = dateStr.split(" ");
                  
                  if (parts.length === 2) {
                    // 時分が含まれている場合
                    const [date, time] = parts;
                    if (date && time) {
                      const dateParts = date.split("-");
                      if (dateParts.length === 3) {
                        const [, month, day] = dateParts;
                        // 時分があることを確認
                        if (time.includes(":")) {
                          return `${month}/${day} ${time}`;
                        }
                      }
                    }
                  } else if (parts.length === 1) {
                    // 日付のみの場合（フォールバック）
                    const dateParts = dateStr.split("-");
                    if (dateParts.length === 3) {
                      const [, month, day] = dateParts;
                      return `${month}/${day} 00:00`;
                    }
                  }
                  
                  // デフォルト: そのまま表示
                  return dateStr;
                }),
                datasets: [
                  {
                    label: "訪問者数",
                    data: stats.map((item) => item.count),
                    borderColor: "#646cff",
                    backgroundColor: "rgba(100, 108, 255, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#646cff",
                    pointBorderColor: "#646cff",
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                    labels: {
                      color: "#888",
                      font: {
                        size: 14,
                      },
                    },
                  },
                  tooltip: {
                    backgroundColor: "rgba(26, 26, 26, 0.9)",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    borderColor: "#333",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "日時（月/日 時:分）",
                      color: "#888",
                      font: {
                        size: 14,
                      },
                    },
                    ticks: {
                      color: "#888",
                      font: {
                        size: 11,
                      },
                      maxRotation: 45,
                      minRotation: 45,
                      callback: function (value, index) {
                        // すべてのラベルを表示（間引きしない）
                        return this.getLabelForValue(value as number);
                      },
                    },
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "訪問者数",
                      color: "#888",
                      font: {
                        size: 14,
                      },
                    },
                    ticks: {
                      color: "#888",
                      font: {
                        size: 12,
                      },
                      stepSize: 1,
                      precision: 0,
                    },
                    beginAtZero: true,
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="no-data">データがありません</div>
        )}
      </div>
    </div>
  );
}

export default App;
