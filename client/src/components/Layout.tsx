import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/reports", label: "Reports" },
  { href: "/city-search", label: "City Search" },
  { href: "/demo", label: "Demo", highlight: true },
  { href: "/mission", label: "Mission" },
  { href: "/presentation", label: "Investor Deck" },
  { href: "/batch", label: "Batch Upload" },
];

// ─── MC Monogram mark (inline SVG, matches the logo) ─────────────────────────

function MCMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="#1C2B5C" />
      <text x="3" y="23" fontFamily="Georgia, serif" fontSize="19" fontWeight="700" fill="#FFFFFF">M</text>
      <text x="17" y="25" fontFamily="Georgia, serif" fontSize="12" fontWeight="400" fill="#A0A8C4">C</text>
    </svg>
  );
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/97 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-3 group">
              <MCMark size={34} />
              <div className="flex flex-col leading-none">
                <span
                  className="text-sm font-semibold tracking-widest text-[var(--primary)] uppercase"
                  style={{ fontFamily: "Georgia, serif", letterSpacing: "0.12em" }}
                >
                  Maudslay
                </span>
                <span
                  className="text-[9px] tracking-widest text-[var(--text-muted)] uppercase"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Consulting
                </span>
              </div>
            </a>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, highlight }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a className={`px-3 py-1.5 text-xs font-medium tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                    active
                      ? "text-[var(--primary)] border-b-2 border-[var(--primary)] pb-[4px]"
                      : highlight
                      ? "rounded-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] px-3 py-1.5"
                      : "text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  }`}>
                    {highlight && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                        <polygon points="2,1 9,5 2,9" />
                      </svg>
                    )}
                    {label}
                  </a>
                </Link>
              );
            })}
            {user?.isAdmin && (
              <Link href="/audit-log">
                <a className={`px-3 py-1.5 text-xs font-medium tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  location.startsWith("/audit-log")
                    ? "text-[var(--gold)] border-b-2 border-[var(--gold)] pb-[4px]"
                    : "text-[var(--gold)] hover:text-[var(--primary)]"
                }`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Audit Log
                </a>
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* AI Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-sm border border-[var(--primary-dim)] bg-[var(--primary-light)] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-[10px] font-medium tracking-widest text-[var(--primary)] uppercase">AI Live</span>
            </div>

            {/* Auth state */}
            {!loading && (
              <div className="hidden sm:flex items-center gap-2">
                {user ? (
                  <>
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] tracking-wide">
                        {user.isAdmin ? "Admin" : `${user.reportCredits} credit${user.reportCredits === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-sm border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--primary-dim)] hover:text-[var(--primary)] transition-colors tracking-wide"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <a className="rounded-sm bg-[var(--primary)] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-white hover:bg-[var(--primary-hover)] transition-colors">
                      Sign in
                    </a>
                  </Link>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center h-9 w-9 rounded-sm hover:bg-[var(--bg-secondary)] transition-colors gap-1.5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block h-px w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-px w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-px w-5 bg-[var(--text-primary)] transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile menu */}
      <div className={`fixed top-16 left-0 right-0 z-40 md:hidden bg-white border-b border-[var(--border)] shadow-lg transition-all duration-200 ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="px-4 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, highlight }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wider uppercase transition-colors ${
                  active
                    ? "text-[var(--primary)] border-l-2 border-[var(--primary)] bg-[var(--primary-light)] pl-[14px]"
                    : highlight
                    ? "bg-[var(--primary)] text-white rounded-sm"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}>
                  {highlight && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                      <polygon points="2,1 9,5 2,9" />
                    </svg>
                  )}
                  {label}
                </a>
              </Link>
            );
          })}
          {user?.isAdmin && (
            <Link href="/audit-log">
              <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wider uppercase text-[var(--gold)] hover:bg-[var(--gold-light)]">
                Audit Log
              </a>
            </Link>
          )}

          <div className="border-t border-[var(--border)] mt-2 pt-3">
            {!loading && (user ? (
              <>
                <div className="px-4 pb-2">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] tracking-wide">
                    {user.isAdmin ? "Admin" : `${user.reportCredits} credit${user.reportCredits === 1 ? "" : "s"}`}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] tracking-wide"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login">
                <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-widest uppercase text-[var(--primary)] hover:bg-[var(--primary-light)]">
                  Sign in
                </a>
              </Link>
            ))}
          </div>

          <div className="px-4 pt-2 pb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[10px] font-medium tracking-widest text-[var(--primary)] uppercase">AI Live</span>
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
      <main className={`mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 ${className}`}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ label, title, subtitle, children }: {
  label?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 sm:mb-12 animate-fade-up">
      {label && (
        <div className="mb-4 inline-flex items-center gap-2">
          <div className="h-px w-5 bg-[var(--gold)] opacity-70" />
          <span
            className="text-[10px] font-medium tracking-[0.2em] text-[var(--text-muted)] uppercase"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {label}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--text-secondary)] tracking-wide">{subtitle}</p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
      <div className="mt-5 h-px bg-gradient-to-r from-[var(--border)] via-[var(--gold)] to-transparent opacity-40" />
    </div>
  );
}
