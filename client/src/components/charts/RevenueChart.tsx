import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: Array<{ year: string; revenue: string; growth: string }>;
}

function parseRevenue(str: string): number {
  const s = str.replace(/[$,]/g, "");
  if (s.endsWith("T")) return parseFloat(s) * 1000;
  if (s.endsWith("B")) return parseFloat(s);
  if (s.endsWith("M")) return parseFloat(s) / 1000;
  return parseFloat(s) || 0;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-xl">
        <p className="font-display text-xs font-bold text-[var(--text-primary)] mb-1">{label}</p>
        <p className="text-sm text-emerald-400 font-semibold">${payload[0].value.toFixed(1)}B</p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    year: d.year,
    revenue: parseRevenue(d.revenue),
    growth: d.growth,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}B`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
        <Bar
          dataKey="revenue"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
