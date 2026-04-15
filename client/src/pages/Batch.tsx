import { useState } from "react";
import { Link } from "wouter";
import { Layout, PageHeader } from "@/components/Layout";
import { api } from "@/lib/api";

type ResultStatus = "generated" | "cached" | "failed";

interface BatchResult {
  company: string;
  status: ResultStatus;
  slug?: string;
}

export function Batch() {
  const [csvText, setCsvText] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text
      .split(/\n|\r\n/)
      .map((l) => l.replace(/^["']|["']$/g, "").split(",")[0].trim())
      .filter(Boolean)
      .slice(0, 50);
    setCompanies(lines);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    parseCSV(text);
  };

  const handleSubmit = async () => {
    if (companies.length === 0) return;
    setLoading(true);
    setResults([]);
    setProgress(0);

    try {
      const { results: batchResults } = await api.reports.batch(companies);
      setResults(batchResults);
      setProgress(100);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: ResultStatus) => {
    if (status === "generated") return "badge-blue";
    if (status === "cached") return "badge-blue";
    return "badge-red";
  };

  const statusLabel = (status: ResultStatus) => {
    if (status === "generated") return "Generated";
    if (status === "cached") return "From Cache";
    return "Failed";
  };

  return (
    <Layout>
      <PageHeader
        label="Batch Processing"
        title="Bulk Report Generation"
        subtitle="Upload a CSV of company names — up to 50 — and generate all reports in one run."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-6 animate-fade-up">
          <div className="card">
            <div className="section-title">Upload CSV File</div>
            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] p-8 cursor-pointer hover:border-emerald-700/50 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Drop CSV file here</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">One company name per row, max 50</p>
              </div>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="sr-only" />
            </label>
          </div>

          <div className="card">
            <div className="section-title">Or Paste Company Names</div>
            <textarea
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={"Apple\nMicrosoft\nHSBC\nBarclays\n..."}
              rows={10}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-emerald-500/50 resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {companies.length} companies parsed
                {companies.length > 50 && " (max 50 — trimmed)"}
              </span>
              {csvText && (
                <button
                  onClick={() => { setCsvText(""); setCompanies([]); }}
                  className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {companies.length > 0 && (
            <div className="card">
              <div className="section-title">Preview ({companies.length})</div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {companies.map((c, i) => (
                  <span key={i} className="badge badge-blue">{c}</span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={companies.length === 0 || loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing {companies.length} companies…
              </>
            ) : (
              <>Generate {companies.length > 0 ? `${companies.length} Reports` : "Reports"}</>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="animate-fade-up animate-delay-200">
          {results.length > 0 ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="section-title mb-0">Results</div>
                <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                  <span className="text-[var(--primary)]">{results.filter(r => r.status !== "failed").length} success</span>
                  {results.filter(r => r.status === "failed").length > 0 && (
                    <span className="text-red-400">{results.filter(r => r.status === "failed").length} failed</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${result.status === "failed" ? "bg-red-400" : "bg-emerald-400"}`} />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{result.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${statusBadge(result.status)}`}>{statusLabel(result.status)}</span>
                      {result.slug && result.status !== "failed" && (
                        <Link href={`/reports/${result.slug}`}>
                          <a className="text-xs text-[var(--primary)] hover:underline">View →</a>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <Link href="/reports">
                  <a className="btn-primary w-full justify-center">View All Reports →</a>
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="relative h-16 w-16 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
              </div>
              <p className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Processing {companies.length} companies
              </p>
              <p className="text-sm text-[var(--text-muted)]">This may take a few minutes…</p>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center text-[var(--text-muted)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-30">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="text-sm">Upload a CSV or paste company names to get started</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
