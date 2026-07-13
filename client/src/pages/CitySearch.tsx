import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout, PageHeader } from "@/components/Layout";
import { api } from "@/lib/api";
import { COUNTRIES, getCitiesForCountry } from "@/data/countries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityCompany {
  name: string;
  url: string;
  distanceKm: number;
  distanceBand: "core" | "good" | "optional";
  revenue: string;
  isPrivate: boolean;
  ticker: string;
  description: string;
}

interface CitySearchResult {
  city: string;
  country: string;
  companies: CityCompany[];
}

// ─── Autocomplete Combobox ────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  id?: string;
}

function Combobox({ value, onChange, options, placeholder, disabled, id }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If the typed value doesn't match any option, keep whatever was typed
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = inputValue.trim()
    ? options.filter((o) => o.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    onChange(v); // allow free-text
    setOpen(true);
  }

  function handleSelect(option: string) {
    setInputValue(option);
    onChange(option);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && filtered.length === 1) {
      handleSelect(filtered[0]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-3.5 pr-8 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
      />
      {/* Chevron */}
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg text-sm">
          {filtered.slice(0, 50).map((option) => (
            <li
              key={option}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
              className={`cursor-pointer px-3.5 py-2 transition-colors hover:bg-[var(--primary-light)] hover:text-[var(--primary)] ${
                option === value ? "bg-[var(--primary-light)] text-[var(--primary)] font-medium" : "text-[var(--text-primary)]"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Sorting helpers ──────────────────────────────────────────────────────────

type SortCol = "name" | "distance" | "revenue" | "ticker";
type SortDir = "asc" | "desc";

function parseRevenue(revenue: string): number {
  if (!revenue || revenue === "Undisclosed" || revenue === "N/A" || revenue === "Private") return -1;
  const cleaned = revenue.replace(/[£€$¥₹,\s]/g, "").toUpperCase();
  const match = cleaned.match(/^([\d.]+)([BMK]?)$/);
  if (!match) return -1;
  const num = parseFloat(match[1]);
  const mult = match[2] === "B" ? 1e9 : match[2] === "M" ? 1e6 : match[2] === "K" ? 1e3 : 1;
  return num * mult;
}

function applySortedCompanies(companies: CityCompany[], col: SortCol, dir: SortDir): CityCompany[] {
  return [...companies].sort((a, b) => {
    let cmp = 0;
    if (col === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (col === "distance") {
      cmp = a.distanceKm - b.distanceKm;
    } else if (col === "revenue") {
      const ra = parseRevenue(a.revenue);
      const rb = parseRevenue(b.revenue);
      if (ra === -1 && rb === -1) cmp = 0;
      else if (ra === -1) cmp = 1;   // undisclosed always last
      else if (rb === -1) cmp = -1;
      else cmp = ra - rb;
    } else if (col === "ticker") {
      const ta = a.isPrivate ? "zzz" : a.ticker;
      const tb = b.isPrivate ? "zzz" : b.ticker;
      cmp = ta.localeCompare(tb);
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Sort header component ────────────────────────────────────────────────────

function SortHeader({
  col, label, active, dir, onSort,
}: {
  col: SortCol; label: string; active: boolean; dir: SortDir; onSort: (col: SortCol) => void;
}) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col gap-px leading-none">
          {active ? (
            dir === "asc" ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-[var(--primary)]">
                <path d="M4 1l3.5 5H.5z" />
              </svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-[var(--primary)]">
                <path d="M4 7L.5 2h7z" />
              </svg>
            )
          ) : (
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" className="text-[var(--text-muted)] opacity-40">
              <path d="M4 0l3 4H1z M4 10L1 6h6z" />
            </svg>
          )}
        </span>
      </span>
    </th>
  );
}

// ─── Distance Band UI helpers ─────────────────────────────────────────────────

const BAND_CONFIG = {
  core:     { label: "< 20 km", color: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  good:     { label: "20–50 km", color: "bg-amber-50 text-amber-700 border-amber-200",        dot: "bg-amber-400"  },
  optional: { label: "50–100 km", color: "bg-slate-50 text-slate-600 border-slate-200",      dot: "bg-slate-400"  },
} as const;

function DistanceBadge({ band, km }: { band: CityCompany["distanceBand"]; km: number }) {
  const cfg = BAND_CONFIG[band];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {km > 0 ? `~${km} km` : cfg.label}
    </span>
  );
}

function TickerBadge({ ticker, isPrivate }: { ticker: string; isPrivate: boolean }) {
  if (isPrivate || ticker === "Private") {
    return (
      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
        Private
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-mono text-[var(--primary)]">
      {ticker}
    </span>
  );
}

// ─── Slugify (mirrors server/storage.ts) ─────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Research / View report button (per row) ──────────────────────────────────

function ResearchButton({
  companyName, country, city, existingSlug, onGenerated,
}: {
  companyName: string;
  country: string;
  city: string;
  existingSlug?: string;
  onGenerated?: (slug: string) => void;
}) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (existingSlug) {
    return (
      <a
        href={`/reports/${existingSlug}`}
        onClick={(e) => { e.preventDefault(); navigate(`/reports/${existingSlug}`); }}
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        View report
      </a>
    );
  }

  async function handleResearch() {
    setLoading(true);
    setError("");
    try {
      const { report } = await api.reports.generate(companyName, false, country, city);
      onGenerated?.(report.companySlug);
      navigate(`/reports/${report.companySlug}`);
    } catch (err: any) {
      setError(err.message ?? "Failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleResearch}
        disabled={loading}
        title={`Generate insight report for ${companyName}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Research
          </>
        )}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CitySearch() {
  const countryNames = COUNTRIES.map((c) => c.name);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");
  const [result, setResult] = useState<CitySearchResult | null>(null);
  const [existingReports, setExistingReports] = useState<Record<string, string>>({}); // slug → companySlug

  // Fetch all existing reports once so we can show "View report" instead of "Research"
  useEffect(() => {
    api.reports.list().then((all: any[]) => {
      const map: Record<string, string> = {};
      all.forEach((r) => { map[r.companySlug] = r.companySlug; });
      setExistingReports(map);
    }).catch(() => {/* non-fatal */});
  }, []);

  // After generating a new report, add it to the existing set so the button flips immediately
  function markReportExists(companySlug: string) {
    setExistingReports((prev) => ({ ...prev, [companySlug]: companySlug }));
  }
  const [sortCol, setSortCol] = useState<SortCol>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      // Sensible defaults per column
      setSortDir(col === "revenue" ? "desc" : col === "distance" ? "asc" : "asc");
    }
  }

  // Reset city when country changes
  const handleCountryChange = useCallback((val: string) => {
    setCountry(val);
    setCity("");
    setResult(null);
  }, []);

  const handleCityChange = useCallback((val: string) => {
    setCity(val);
    setResult(null);
  }, []);

  const cityOptions = getCitiesForCountry(country);

  const canSearch = country.trim().length > 0 && city.trim().length > 0;

  async function handleSearch() {
    if (!canSearch) return;
    setLoading(true);
    setError("");
    setMoreError("");
    setResult(null);
    try {
      const data = await api.citySearch(country.trim(), city.trim(), context.trim() || undefined);
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!result) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const existing = result.companies.map((c) => c.name);
      const data = await api.citySearch(
        country.trim(), city.trim(),
        context.trim() || undefined,
        existing,
        10
      );
      // Merge, deduplicating by name just in case
      const existingNames = new Set(existing);
      const fresh = data.companies.filter((c: CityCompany) => !existingNames.has(c.name));
      setResult((prev) => prev
        ? { ...prev, companies: [...prev.companies, ...fresh] }
        : data
      );
    } catch (err: any) {
      setMoreError(err.message ?? "Failed to load more. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  const sortedCompanies = result ? applySortedCompanies(result.companies, sortCol, sortDir) : [];

  // Group results by band for the legend
  const coreCo    = result?.companies.filter((c) => c.distanceBand === "core")     ?? [];
  const goodCo    = result?.companies.filter((c) => c.distanceBand === "good")     ?? [];
  const optCo     = result?.companies.filter((c) => c.distanceBand === "optional") ?? [];

  return (
    <Layout>
      <PageHeader
        label="Company Discovery"
        title="Find Companies by City"
        subtitle="Locate businesses in any city, ranked by proximity — with one-click insight generation."
      />

      {/* ── Search form ── */}
      <div className="card mb-8 p-6 animate-fade-up">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Country */}
          <div>
            <label htmlFor="country-input" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Country <span className="text-red-400">*</span>
            </label>
            <Combobox
              id="country-input"
              value={country}
              onChange={handleCountryChange}
              options={countryNames}
              placeholder="Search countries…"
              disabled={loading}
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city-input" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              City <span className="text-red-400">*</span>
            </label>
            <Combobox
              id="city-input"
              value={city}
              onChange={handleCityChange}
              options={cityOptions}
              placeholder={country ? (cityOptions.length ? "Select or type a city…" : "Type a city…") : "Select a country first"}
              disabled={loading || !country.trim()}
            />
          </div>

          {/* Search button (aligned bottom on lg) */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !canSearch}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  Find Companies
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional context — shown once a city is selected */}
        {canSearch && (
          <div className="mt-4 animate-fade-up">
            <label htmlFor="context-input" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Refine results{" "}
              <span className="font-normal text-[var(--text-muted)]">(optional) — e.g. "financial services", "manufacturing over $500M revenue"</span>
            </label>
            <textarea
              id="context-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add any criteria to guide the search…"
              disabled={loading}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            <p className="mt-1 text-right text-[10px] text-[var(--text-muted)]">{context.length}/500</p>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="card flex flex-col items-center gap-3 py-12 text-center animate-fade-up">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-t-2 border-[var(--primary)] animate-spin" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Searching for companies near {city}…</p>
          <p className="text-xs text-[var(--text-muted)]">Web search in progress — usually takes 15–30 seconds</p>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="animate-fade-up space-y-6">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {result.companies.length} companies found near {result.city}, {result.country}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {coreCo.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {coreCo.length} within 20 km
                </span>
              )}
              {goodCo.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {goodCo.length} within 50 km
                </span>
              )}
              {optCo.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {optCo.length} within 100 km
                </span>
              )}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <SortHeader col="name"     label="Company"  active={sortCol === "name"}     dir={sortDir} onSort={handleSort} />
                  <SortHeader col="distance" label="Distance" active={sortCol === "distance"} dir={sortDir} onSort={handleSort} />
                  <SortHeader col="revenue"  label="Revenue"  active={sortCol === "revenue"}  dir={sortDir} onSort={handleSort} />
                  <SortHeader col="ticker"   label="Ticker"   active={sortCol === "ticker"}   dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedCompanies.map((co, i) => (
                  <tr
                    key={`${co.name}-${i}`}
                    className="transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[var(--text-primary)]">{co.name}</div>
                      {co.url && (
                        <a
                          href={co.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          {co.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      )}
                      {co.description && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">{co.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <DistanceBadge band={co.distanceBand} km={co.distanceKm} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-[var(--text-primary)]">{co.revenue}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TickerBadge ticker={co.ticker} isPrivate={co.isPrivate} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ResearchButton
                        companyName={co.name}
                        country={country}
                        city={city}
                        existingSlug={existingReports[slugify(co.name)]}
                        onGenerated={markReportExists}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sortedCompanies.map((co, i) => (
              <div key={`${co.name}-${i}`} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{co.name}</div>
                    {co.url && (
                      <a
                        href={co.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)]"
                      >
                        {co.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </div>
                  <DistanceBadge band={co.distanceBand} km={co.distanceKm} />
                </div>
                {co.description && (
                  <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{co.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">{co.revenue}</span>
                    <TickerBadge ticker={co.ticker} isPrivate={co.isPrivate} />
                  </div>
                  <ResearchButton companyName={co.name} />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wider">Distance key</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <strong>Within 20 km</strong> — very favourable
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <strong>20–50 km</strong> — good candidate
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <strong>50–100 km</strong> — optional
              </span>
            </div>
          </div>

          {/* Find more */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Finding more companies…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  Find 10 more
                </>
              )}
            </button>
            {moreError && (
              <p className="text-xs text-red-500">{moreError}</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
