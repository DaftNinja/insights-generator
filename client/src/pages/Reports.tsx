import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout, PageHeader } from "@/components/Layout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Report } from "@shared/schema";

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchReports = async () => {
    try {
      const data = await api.reports.list();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this report?")) return;
    setDeleting(id);
    try {
      await api.reports.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = reports.filter((r) =>
    r.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (r.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        label="Portfolio"
        title="Intelligence Reports"
        subtitle={`${reports.length} reports generated`}
      >
        <Link href="/">
          <a className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Report
          </a>
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-sm">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies or industries…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="shimmer h-4 w-32 rounded" />
              <div className="shimmer h-6 w-48 rounded" />
              <div className="shimmer h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mb-4 text-4xl">📊</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            {search ? "No reports match your search" : "No reports yet"}
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {search ? "Try a different search term" : "Generate your first company intelligence report"}
          </p>
          {!search && (
            <Link href="/">
              <a className="btn-primary">Generate First Report</a>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report, i) => (
            <Link key={report.id} href={`/reports/${report.companySlug}`}>
              <a
                className="card-hover group block animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-200">
                    <span className="font-display text-xs font-extrabold text-[var(--primary)]">
                      {report.companyName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deleting === report.id}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-950/50 hover:text-red-400 transition-all"
                  >
                    {deleting === report.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    )}
                  </button>
                </div>

                <h3 className="font-display text-base font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                  {report.companyName}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">{report.industry ?? "Unknown Industry"}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(report.generatedAt)}
                    </span>
                  </div>
                  {report.salesEnablementData != null && (
                    <span className="badge badge-violet">Sales Ready</span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">View full report</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
