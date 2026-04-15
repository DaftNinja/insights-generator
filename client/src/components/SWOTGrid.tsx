import type { SWOT } from "@shared/schema";

interface SWOTGridProps {
  swot: SWOT;
}

const QUADRANTS = [
  {
    key: "strengths" as const,
    label: "Strengths",
    headerColor: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    diamond: "text-emerald-500",
  },
  {
    key: "weaknesses" as const,
    label: "Weaknesses",
    headerColor: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    diamond: "text-red-400",
  },
  {
    key: "opportunities" as const,
    label: "Opportunities",
    headerColor: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    diamond: "text-blue-400",
  },
  {
    key: "threats" as const,
    label: "Threats",
    headerColor: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    diamond: "text-amber-500",
  },
];

export function SWOTGrid({ swot }: SWOTGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {QUADRANTS.map(({ key, label, headerColor, bg, border, dot, diamond }) => (
        <div key={key} className={`rounded-lg border p-4 sm:p-5 ${bg} ${border}`}>
          <div className={`flex items-center gap-2 mb-4 ${headerColor}`}>
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
          </div>
          <ul className="space-y-3">
            {swot[key].map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className={`mt-0.5 text-xs shrink-0 ${diamond}`}>◆</span>
                <div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
