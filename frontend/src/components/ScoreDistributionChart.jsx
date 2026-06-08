  import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
  } from "recharts";
  
  const BUCKETS = [
    { label: "300–399", rating: "Very Poor",  min: 300, max: 399, color: "#ef4444" },
    { label: "400–499", rating: "Poor",        min: 400, max: 499, color: "#f97316" },
    { label: "500–599", rating: "Fair",        min: 500, max: 599, color: "#eab308" },
    { label: "600–699", rating: "Good",        min: 600, max: 699, color: "#86efac" },
    { label: "700–799", rating: "Very Good",   min: 700, max: 799, color: "#22c55e" },
    { label: "800–899", rating: "Excellent",   min: 800, max: 899, color: "#15803d" },
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
      range:  b.label,
      rating: b.rating,
      count:  counts[b.label],
      color:  b.color,
    }));
  }
  
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "#1e293b",
        minWidth: "160px",
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6, color: d.color, margin: "0 0 6px" }}>
          {d.rating}
        </p>
        <p style={{ margin: "0 0 2px", color: "#64748b" }}>
          Score Range: <strong style={{ color: "#1e293b" }}>{d.range}</strong>
        </p>
        <p style={{ margin: 0, color: "#64748b" }}>
          Customers: <strong style={{ color: "#1e293b" }}>{Number(d.count).toLocaleString()}</strong>
        </p>
      </div>
    );
  };
  
  function RatingLegend() {
    return (
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "20px",
      }}>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            fontWeight: 600,
            color: "#1e293b",
          }}>
            <span style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: b.color,
              flexShrink: 0,
            }} />
            <span style={{ color: "#64748b" }}>{b.label}</span>
            <span>{b.rating}</span>
          </div>
        ))}
      </div>
    );
  }
  
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
          marginBottom: "16px",
        }}>
          Score Distribution
        </h2>
  
        <RatingLegend />
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 24, bottom: 24, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
  
            <XAxis
              dataKey="rating"
              tick={{ fill: "#64748b", fontSize: 12 }}
              stroke="#cbd5e1"
              label={{
                value: "Credit Rating",
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
  
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={72}>
              {chartData.map((entry) => (
                <Cell key={entry.range} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }