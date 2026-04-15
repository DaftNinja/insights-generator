import type { RiskAssessment } from "@shared/schema";
import { getRiskBadge } from "@/lib/utils";

interface RiskMatrixProps {
  riskAssessment: RiskAssessment;
}

export function RiskMatrix({ riskAssessment }: RiskMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[var(--text-muted)]">
          Overall Risk Level:
          <span className={`ml-2 font-semibold ${
            riskAssessment.overallRiskLevel === "high"
              ? "text-red-400"
              : riskAssessment.overallRiskLevel === "medium"
              ? "text-amber-400"
              : "text-[var(--primary)]"
          }`}>
            {riskAssessment.overallRiskLevel.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{riskAssessment.risks.length} risks identified</span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-6">{riskAssessment.summary}</p>

      <div className="space-y-3">
        {riskAssessment.risks.map((risk, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4 hover:border-[var(--border-light)] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 mb-1">
                  {risk.category}
                </span>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{risk.title}</h4>
              </div>
              <div className="flex flex-col gap-1 shrink-0 items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-muted)]">Impact</span>
                  <span className={`badge ${getRiskBadge(risk.impact)}`}>{risk.impact}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-muted)]">Likelihood</span>
                  <span className={`badge ${getRiskBadge(risk.likelihood)}`}>{risk.likelihood}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-2">{risk.description}</p>
            <div className="flex items-start gap-2">
              <span className="text-xs text-[var(--primary)] shrink-0">↳ Mitigation:</span>
              <span className="text-xs text-[var(--text-secondary)]">{risk.mitigation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
