import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
  } from "recharts";
  
  const BUCKETS = [
    { label: "300–399", min: 300, max: 399 },
    { label: "400–499", min: 400, max: 499 },
    { label: "500–599", min: 500, max: 599 },
    { label: "600–699", min: 600, max: 699 },
    { label: "700–799", min: 700, max: 799 },
    { label: "800–899", min: 800, max: 899 },
  ];
  
  function pdToScore(pd) {
    if (pd <= 0) return 899;
    if (pd >= 1) return 300;
    const odds = (1 - pd) / pd;
    return Math.round(600 + 50 * Math.log2(odds));
  }
  
  function buildHistogram(pdValues) {
    const counts = Object.fromEntries(BUCKETS.map((b) => [b.label, 0]));
  
    for (const pd of pdValues) {
      const score = pdToScore(pd);
      const bucket = BUCKETS.find((b) => score >= b.min && score <= b.max);
      if (bucket) counts[bucket.label]++;
    }
  
    return BUCKETS.map((b) => ({
      range: b.label,
      count: counts[b.label],
    }));
  }
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "#1e293b",
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: "#3b82f6" }}>
          Score {label}
        </p>
        <p style={{ margin: 0 }}>
          Customers: <strong>{Number(payload[0].value).toLocaleString()}</strong>
        </p>
      </div>
    );
  };
  
  export default function ScoreDistributionChart({ pdValues }) {
    if (!pdValues?.length) return null;
  
    const chartData = buildHistogram(pdValues);
  
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "24px",
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#1e293b",
          marginTop: 0,
          marginBottom: "20px",
        }}>
          Score Distribution
        </h2>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 24, bottom: 24, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
  
            <XAxis
              dataKey="range"
              tick={{ fill: "#64748b", fontSize: 12 }}
              stroke="#cbd5e1"
              label={{
                value: "Score Range",
                position: "insideBottom",
                offset: -14,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
  
            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              stroke="#cbd5e1"
              tickFormatter={(v) => v.toLocaleString()}
              label={{
                value: "Customer Count",
                angle: -90,
                position: "insideLeft",
                offset: 8,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
  
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
  
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={72}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }