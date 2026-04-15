export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getRiskColor(level: "high" | "medium" | "low" | string): string {
  if (level === "high") return "text-red-400";
  if (level === "medium") return "text-amber-400";
  return "text-emerald-400";
}

export function getRiskBadge(level: "high" | "medium" | "low" | string): string {
  if (level === "high") return "badge-red";
  if (level === "medium") return "badge-amber";
  return "badge-green";
}

export function getConfidenceColor(level: "high" | "medium" | "low" | string): string {
  if (level === "high") return "text-emerald-400";
  if (level === "medium") return "text-amber-400";
  return "text-[var(--text-muted)]";
}

export function getTrendIcon(trend: "up" | "down" | "neutral" | string): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export function getTrendColor(trend: "up" | "down" | "neutral" | string): string {
  if (trend === "up") return "text-emerald-400";
  if (trend === "down") return "text-red-400";
  return "text-[var(--text-muted)]";
}

export function getMaturityColor(level: string): string {
  const map: Record<string, string> = {
    leading: "text-emerald-400",
    advanced: "text-blue-400",
    developing: "text-amber-400",
    early: "text-red-400",
  };
  return map[level] ?? "text-[var(--text-muted)]";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
