import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

// Primary nav — always visible
const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/reports", label: "Reports" },
  { href: "/city-search", label: "City Search" },
  { href: "/demo", label: "Demo", highlight: true },
];

// Secondary nav — tucked into "More" dropdown
const MORE_NAV = [
  { href: "/mission", label: "Mission" },
  { href: "/presentation", label: "Investor Deck" },
  { href: "/batch", label: "Batch Upload" },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { user, loading, logout } = useAuth();

  useEffect(() => { setMenuOpen(false); setMoreOpen(false); setUserOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  const moreActive = MORE_NAV.some(({ href }) => location.startsWith(href));

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2.5 group shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white group-hover:bg-[var(--primary-hover)] transition-colors">
                <span className="text-xs font-bold">1GL</span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">1GigLabs</span>
              <span className="hidden text-xs text-[var(--text-muted)] lg:block">Insight Generator</span>
            </a>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">

            {/* Primary items */}
            {PRIMARY_NAV.map(({ href, label, highlight }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : highlight
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  }`}>
                    {highlight && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <polygon points="2,1 9,5 2,9" />
                      </svg>
                    )}
                    {label}
                  </a>
                </Link>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  moreActive
                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                More
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-44 rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg z-50">
                  {MORE_NAV.map(({ href, label }) => {
                    const active = location.startsWith(href);
                    return (
                      <Link key={href} href={href}>
                        <a className={`flex items-center px-4 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "text-[var(--primary)] bg-[var(--primary-light)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        }`}>
                          {label}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-700">AI Live</span>
            </div>

            {!loading && (
              <div className="hidden sm:flex items-center gap-2">
                {user ? (
                  /* ── User dropdown ── */
                  <div ref={userRef} className="relative">
                    <button
                      onClick={() => setUserOpen((o) => !o)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {user.isAdmin ? "Admin" : `${user.reportCredits} credit${user.reportCredits === 1 ? "" : "s"}`}
                        </span>
                      </div>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`text-[var(--text-muted)] transition-transform duration-150 ${userOpen ? "rotate-180" : ""}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {userOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg z-50">
                        {user.isAdmin && (
                          <Link href="/audit-log">
                            <a className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                              location.startsWith("/audit-log")
                                ? "text-amber-700 bg-amber-50"
                                : "text-amber-700 hover:bg-amber-50"
                            }`}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                              Audit Log
                            </a>
                          </Link>
                        )}
                        <div className={user.isAdmin ? "border-t border-[var(--border)] mt-1 pt-1" : ""}>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                              <polyline points="16 17 21 12 16 7" />
                              <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login">
                    <a className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--primary-hover)] transition-colors">
                      Sign in
                    </a>
                  </Link>
                )}
              </div>
            )}

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
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile menu — all items flat */}
      <div className={`fixed top-14 left-0 right-0 z-40 md:hidden bg-white border-b border-[var(--border)] shadow-lg transition-all duration-200 ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="px-4 py-3 space-y-1">
          {[...PRIMARY_NAV, ...MORE_NAV].map(({ href, label, highlight }: any) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : highlight
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}>
                  {highlight && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
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
              <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50">
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
                  <div className="text-xs text-[var(--text-muted)]">
                    {user.isAdmin ? "Admin" : `${user.reportCredits} credit${user.reportCredits === 1 ? "" : "s"}`}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login">
                <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]">
                  Sign in
                </a>
              </Link>
            ))}
          </div>

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
  label?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
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
