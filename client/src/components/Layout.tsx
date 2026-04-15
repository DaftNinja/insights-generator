import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";

const ADMIN_EMAIL = "andrew.mccreath@1giglabs.com";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/reports", label: "Reports" },
  { href: "/demo", label: "Demo", highlight: true },
  { href: "/mission", label: "Mission" },
  { href: "/presentation", label: "Investor Deck" },
  { href: "/batch", label: "Batch Upload" },
];

export function Navbar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white group-hover:bg-[var(--primary-hover)] transition-colors">
                <span className="text-xs font-bold">1GL</span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">1GigLabs</span>
              <span className="hidden text-xs text-[var(--text-muted)] sm:block">Insight Generator</span>
            </a>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, highlight }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : highlight ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  }`}>
                    {highlight && <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9" /></svg>}
                    {label}
                  </a>
                </Link>
              );
            })}
            {/* Audit log — admin only, accessed via direct URL */}
            {location.startsWith("/audit-log") && (
              <Link href="/audit-log">
                <a className="px-3 py-1.5 rounded-md text-sm font-medium bg-amber-50 text-amber-700 flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Audit Log
                </a>
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-700">AI Live</span>
            </div>
            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center h-9 w-9 rounded-md hover:bg-[var(--bg-secondary)] transition-colors gap-1.5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Mobile menu */}
      <div className={`fixed top-14 left-0 right-0 z-40 md:hidden bg-white border-b border-[var(--border)] shadow-lg transition-all duration-200 ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="px-4 py-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, highlight }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : highlight ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}>
                  {highlight && <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9" /></svg>}
                  {label}
                </a>
              </Link>
            );
          })}
          <div className="px-4 pt-2 pb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700">AI Live</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface LayoutProps { children: React.ReactNode; className?: string; }

export function Layout({ children, className = "" }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className={`mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 ${className}`}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ label, title, subtitle, children }: {
  label?: string; title: string; subtitle?: string; children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-10 animate-fade-up">
      {label && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-700 uppercase tracking-widest">{label}</span>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
