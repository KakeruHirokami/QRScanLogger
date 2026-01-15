import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import outputs from "../amplify_outputs.json";
import "./App.css";

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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#888", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  label={{
                    value: "日時",
                    position: "insideBottom",
                    offset: -5,
                    style: { fill: "#888" },
                  }}
                  tickFormatter={(value) => {
                    // YYYY-MM-DD HH:mm形式を MM/DD HH:mm に変換
                    if (!value) return "";
                    const parts = value.split(" ");
                    if (parts.length === 2) {
                      const [date, time] = parts;
                      if (date && time) {
                        const [, month, day] = date.split("-");
                        if (month && day) {
                          return `${month}/${day} ${time}`;
                        }
                      }
                    }
                    // フォールバック: そのまま表示
                    return value || "";
                  }}
                />
                <YAxis
                  tick={{ fill: "#888" }}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  label={{
                    value: "訪問者数",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#888" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#646cff"
                  strokeWidth={2}
                  name="訪問者数"
                  dot={{ fill: "#646cff", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="no-data">データがありません</div>
        )}
      </div>
    </div>
  );
}

export default App;
