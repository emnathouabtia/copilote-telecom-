import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const SEVERITY_COLORS = {
  CRITIQUE: "#ef4444",
  MAJEURE: "#f59e0b",
  MINEURE: "#eab308",
  INFO: "#38bdf8",
};

const FALLBACK_COLORS = ["#38bdf8", "#f59e0b", "#ef4444", "#a78bfa", "#34d399", "#f472b6"];

function colorFor(name, index) {
  return SEVERITY_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 6,
  fontSize: 12,
  color: "#e2e8f0",
};

/**
 * Graphique générique.
 * Usage :
 *   <Chart type="bar" data={[{name:"SYSTEME", total: 6}, ...]} dataKey="total" nameKey="name" />
 *   <Chart type="pie" data={[{name:"CRITIQUE", total: 3}, ...]} dataKey="total" nameKey="name" />
 */
export default function Chart({ type = "bar", data, dataKey = "total", nameKey = "name", height = 220 }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        pas de données
      </div>
    );
  }

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry[nameKey]} fill={colorFor(entry[nameKey], i)} stroke="#0f172a" />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey={nameKey}
          tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
          axisLine={{ stroke: "#1e293b" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1e293b" }} />
        <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry[nameKey]} fill={colorFor(entry[nameKey], i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}