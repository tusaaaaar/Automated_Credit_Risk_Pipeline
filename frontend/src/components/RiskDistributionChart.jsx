import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
  
  const COLORS = {
    Good: "#22c55e",
    Moderate: "#f59e0b",
    Bad: "#ef4444",
  };
  
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
      >
        {`${Number(percentage).toFixed(1)}%`}
      </text>
    );
  };
  
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, payload: data } = payload[0];
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "#1e293b",
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: COLORS[name] }}>{name}</p>
        <p style={{ margin: 0 }}>Customers: <strong>{Number(value).toLocaleString()}</strong></p>
        <p style={{ margin: 0 }}>Percentage: <strong>{Number(data.percentage).toFixed(2)}%</strong></p>
      </div>
    );
  };
  
  export default function RiskDistributionChart({ segmentSummary }) {
    if (!segmentSummary?.length) return null;
  
    const chartData = segmentSummary.map((seg) => ({
      name: seg.risk_category,
      value: seg.customer_count,
      percentage: seg.percentage,
    }));
  
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
          marginBottom: "20px",
          marginTop: 0,
        }}>
          Risk Distribution
        </h2>
  
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
  
            <Tooltip content={<CustomTooltip />} />
  
            <Legend
              iconType="circle"
              iconSize={10}
              formatter={(value) => (
                <span style={{ color: "#475569", fontSize: "13px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }