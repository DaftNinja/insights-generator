import { getTrendColor, getTrendIcon } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral" | string;
  accentColor?: string;
  delay?: number;
}

export function MetricCard({ label, value, sub, trend, delay = 0 }: MetricCardProps) {
  return (
    <div
      className="metric-card animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend && (
            <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)}
            </span>
          )}
          {sub && (
            <span className={`text-sm ${trend ? getTrendColor(trend) : "text-[var(--text-muted)]"}`}>
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  items: Array<{ label: string; value: string; trend?: "up" | "down" | "neutral" | string }>;
}

export function StatRow({ items }: StatRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, i) => (
        <MetricCard key={item.label} {...item} delay={i * 80} />
      ))}
    </div>
  );
}
