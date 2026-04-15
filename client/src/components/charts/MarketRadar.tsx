import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MarketRadarProps {
  competitors: Array<{ name: string; strength: string; threat: "high" | "medium" | "low" }>;
  companyName: string;
}

function threatToScore(threat: "high" | "medium" | "low"): number {
  if (threat === "high") return 85;
  if (threat === "medium") return 55;
  return 30;
}

export function MarketRadar({ competitors, companyName }: MarketRadarProps) {
  const data = competitors.slice(0, 6).map((c) => ({
    competitor: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    threat: threatToScore(c.threat),
  }));

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">Competitive threat levels for {companyName}</p>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="competitor"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <Radar
            name="Threat"
            dataKey="threat"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
