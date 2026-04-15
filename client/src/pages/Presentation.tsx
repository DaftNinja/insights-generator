import { useState, useEffect } from "react";
import { Layout, PageHeader } from "@/components/Layout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Report } from "@shared/schema";

export function Presentation() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.reports.list().then(setReports).finally(() => setFetching(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedSlug) return;
    setLoading(true);
    setPresentation(null);
    try {
      const { presentation: p } = await api.reports.investorPresentation(selectedSlug);
      setPresentation(p);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        label="Investor Deck"
        title="Investor Presentation Generator"
        subtitle="Generate a structured investor deck for any company in your portfolio."
      />

      <div className="card mb-8 animate-fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Select Company
            </label>
            {fetching ? (
              <div className="shimmer h-10 rounded-lg" />
            ) : (
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50"
              >
                <option value="">— Select a company report —</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.companySlug}>
                    {r.companyName} · {r.industry ?? "Unknown"}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedSlug || loading}
            className="btn-primary shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>Generate Deck</>
            )}
          </button>
        </div>
        {reports.length === 0 && !fetching && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            No reports yet. <a href="/" className="text-[var(--primary)] hover:underline">Generate a company report first.</a>
          </p>
        )}
      </div>

      {presentation && (
        <div className="animate-fade-up space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{presentation.title}</h2>
              <p className="text-sm text-[var(--text-muted)]">{presentation.date} · {presentation.slides?.length} slides</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {presentation.slides?.map((slide: any, i: number) => (
              <div
                key={i}
                className="card-hover animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded border border-blue-200 bg-blue-50 font-mono text-xs font-bold text-[var(--primary)]">
                    {slide.slideNumber}
                  </div>
                  {slide.metric && (
                    <div className="text-right">
                      <div className="text-xs text-[var(--text-muted)]">{slide.metric.label}</div>
                      <div className="font-display text-base font-bold text-[var(--primary)]">{slide.metric.value}</div>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-sm font-bold text-[var(--text-primary)] mb-1">{slide.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{slide.headline}</p>
                {slide.bullets?.length > 0 && (
                  <ul className="space-y-1">
                    {slide.bullets.slice(0, 4).map((b: string, j: number) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                        <span className="text-[var(--primary)] shrink-0">·</span>{b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {presentation.disclaimer && (
            <div className="rounded-lg border border-amber-900/30 bg-amber-950/10 px-4 py-3">
              <p className="text-xs text-amber-400/70">{presentation.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
