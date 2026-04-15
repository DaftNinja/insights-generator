import { Layout, PageHeader } from "@/components/Layout";

const PHASES = [
  { number: "01", title: "Input", desc: "Enter any company name" },
  { number: "02", title: "Research", desc: "Claude analyses available intelligence" },
  { number: "03", title: "Generate", desc: "Structured JSON report built across 10 sections" },
  { number: "04", title: "Cache", desc: "Report stored — refreshed automatically every 2 months" },
  { number: "05", title: "Activate", desc: "Add your sales brief for Sales Enablement" },
  { number: "06", title: "Export", desc: "Download as PDF, PPTX, or HTML" },
];

const PERSONAS = [
  {
    role: "Account Executive",
    pain: "Hours researching prospects before each meeting",
    value: "Full strategic brief in 60 seconds — walk in informed",
    saving: "~3 hrs/account",
    icon: "🎯",
  },
  {
    role: "Business Development",
    pain: "No scalable way to qualify 50 targets quickly",
    value: "Batch generate 50 reports overnight, prioritise by risk/opportunity",
    saving: "~2 days/quarter",
    icon: "📡",
  },
  {
    role: "Strategic Planner",
    pain: "Competitive landscape analysis takes weeks",
    value: "Instant market positioning, competitor threat matrix, SWOT",
    saving: "~1 week/quarter",
    icon: "🗺️",
  },
  {
    role: "Sales Leadership",
    pain: "Inconsistent account prep across the team",
    value: "Standardised intelligence format every rep can use",
    saving: "Consistent quality",
    icon: "📊",
  },
];

export function Mission() {
  return (
    <Layout>
      <PageHeader
        label="Platform Mission"
        title="From Insight to Action"
        subtitle="Why we built 1GigLabs Insight Generator — and who it's for."
      />

      {/* Problem statement */}
      <section className="mb-16 animate-fade-up">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-800/50 bg-amber-950/30 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="font-mono text-xs text-amber-400 uppercase tracking-widest">The Problem</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 md:text-3xl">
              Strategic intelligence is expensive, slow, and inconsistent.
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Enterprise sales teams spend hours — sometimes days — manually researching prospects. They piece together data from LinkedIn, annual reports, press releases, and analyst briefings to prepare for a single meeting. Smaller teams can't afford dedicated research analysts. The result: inconsistent prep quality, missed context, and lost deals.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              1GigLabs Insight Generator solves this by automating the entire intelligence workflow. From a single company name, it generates a board-ready strategic brief in under 60 seconds — covering financials, leadership, market position, technology estate, ESG profile, SWOT analysis, growth opportunities, and risk landscape.
            </p>
          </div>
        </div>
      </section>

      {/* How it works - phases */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">How it works</h2>
          <p className="text-[var(--text-secondary)] mt-1">Six phases from input to action</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PHASES.map((phase, i) => (
            <div
              key={phase.number}
              className="card text-center animate-fade-up relative"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {i < PHASES.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 text-[var(--border)] text-xl z-10">→</div>
              )}
              <div className="font-mono text-2xl font-bold text-[var(--primary)]/30 mb-2">{phase.number}</div>
              <div className="font-display text-sm font-bold text-[var(--text-primary)] mb-1">{phase.title}</div>
              <div className="text-xs text-[var(--text-muted)] leading-relaxed">{phase.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Personas */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Built for these users</h2>
          <p className="text-[var(--text-secondary)] mt-1">The professionals who benefit most</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PERSONAS.map((persona, i) => (
            <div
              key={persona.role}
              className="card-hover animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-2xl">
                  {persona.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{persona.role}</h3>
                    <span className="badge badge-blue">{persona.saving}</span>
                  </div>
                  <p className="text-xs text-red-400/80 mb-2">
                    <span className="font-semibold">Pain: </span>{persona.pain}
                  </p>
                  <p className="text-xs text-[var(--primary)]/80">
                    <span className="font-semibold">Value: </span>{persona.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-16">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {STACK.map(({ name, role, color }) => (
              <div key={name} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--bg-secondary)]">
                <span className={`h-2 w-2 shrink-0 rounded-full mt-1.5 ${color}`} />
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section>
        <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 px-6 py-4">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <strong>Data Disclaimer:</strong> Reports are generated using AI (Claude) and are intended for informational and strategic planning purposes. Data may not reflect the most current financials or public filings. Always verify critical data points against primary sources before making investment or business decisions.
          </p>
        </div>
      </section>
    </Layout>
  );
}

const STACK = [
  { name: "Claude (Anthropic)", role: "AI report generation", color: "bg-emerald-400" },
  { name: "React + TypeScript", role: "Frontend UI", color: "bg-blue-400" },
  { name: "Express 5", role: "API server", color: "bg-emerald-400" },
  { name: "PostgreSQL", role: "Report storage", color: "bg-blue-400" },
  { name: "Drizzle ORM", role: "Type-safe DB", color: "bg-violet-400" },
  { name: "Vite", role: "Build tooling", color: "bg-amber-400" },
  { name: "Recharts", role: "Data visualisation", color: "bg-blue-400" },
  { name: "Railway", role: "Cloud deployment", color: "bg-violet-400" },
];
