import { Link } from "wouter";
import { Layout } from "@/components/Layout";

// ─── How We Got Here timeline ─────────────────────────────────────────────────

const TIMELINE = [
  {
    tag: "FOUNDATION",
    title: "AI-Powered Analysis Engine",
    desc: "Built the core analysis engine using Claude (Anthropic) to generate comprehensive 10-section strategic reports covering financials, strategy, market position, ESG, SWOT, growth, risk, digital transformation, and sales enablement.",
    color: "border-blue-200 bg-blue-50/50",
    tagColor: "text-blue-600",
  },
  {
    tag: "LIVE DATA",
    title: "Real-Time Financial Data",
    desc: "Integrated Financial Modeling Prep (FMP) to inject verified, real-time financials — revenue, net income, EBITDA, market cap, stock price, P/E ratio, EPS, and analyst ratings — directly into every report. CEO is independently verified via live web search.",
    color: "border-emerald-200 bg-emerald-50/50",
    tagColor: "text-emerald-600",
  },
  {
    tag: "PRIVATE COS",
    title: "Wikipedia Fallback for Private Companies",
    desc: "When FMP returns no data (private or unlisted companies), the platform automatically falls back to the Wikipedia API — parsing infobox fields for revenue, AUM, employees, headquarters, and founding date. The Financials tab surfaces a clear private-company notice so data limitations are always transparent.",
    color: "border-violet-200 bg-violet-50/50",
    tagColor: "text-violet-600",
  },
  {
    tag: "SCALE",
    title: "Batch Processing & Caching",
    desc: "Introduced CSV batch upload for processing 20–50 companies simultaneously, plus intelligent 2-month caching to minimise AI costs and improve response times across repeat queries.",
    color: "border-amber-200 bg-amber-50/50",
    tagColor: "text-amber-600",
  },
  {
    tag: "EXPORT",
    title: "Multi-Format Export",
    desc: "Added professional PDF, PowerPoint (PPTX), and HTML export for every company report. All exports include full financials, SWOT, risk assessment, and strategic analysis in 1GigLabs branded templates.",
    color: "border-blue-200 bg-blue-50/50",
    tagColor: "text-blue-600",
  },
  {
    tag: "QUALITY",
    title: "Confidence Scoring",
    desc: "Every report is automatically scored across 9 data quality signals — financial data source, CEO verification, ESG coverage, vision/mission, key executives, SWOT, and risk assessment. Reports display a green/amber/red confidence rating so users always know how much to rely on the data.",
    color: "border-violet-200 bg-violet-50/50",
    tagColor: "text-violet-600",
  },
  {
    tag: "GLOBAL",
    title: "Multi-Currency Support",
    desc: "Revenue charts and financial displays now correctly handle any currency — £, €, ¥, or $ — detected automatically from the data. UK, European, and Asian companies render correctly without manual configuration.",
    color: "border-emerald-200 bg-emerald-50/50",
    tagColor: "text-emerald-600",
  },
  {
    tag: "PRESENTATION",
    title: "Investor Presentation Generator",
    desc: "Generates a structured 10–12-slide investor deck from any report — cover, thesis, financials, market, SWOT, growth, risks, and conclusion. Slides are viewable in a full-screen lightbox with keyboard navigation, and the complete deck downloads as a branded PPTX with one click.",
    color: "border-amber-200 bg-amber-50/50",
    tagColor: "text-amber-600",
  },
];

// ─── Persona value cards ───────────────────────────────────────────────────────

const PERSONAS = [
  {
    icon: "↗",
    iconBg: "bg-blue-50 text-blue-600",
    title: "Investors & Analysts",
    desc: "Equity research reports, due diligence packs, and competitive benchmarking typically require teams of analysts working for weeks. Our platform delivers institutional-grade strategic analysis — covering verified financials, SWOT, ESG, risk, and growth opportunities — in a single request, with a confidence score so you always know the data quality.",
    tradCost: "$3,000 – $8,000",
    tradTime: "2 – 4 weeks",
    platformTime: "Minutes",
    savings: "Up to 95%",
    useCases: [
      "Company due diligence with real-time financial data",
      "Portfolio-wide competitive screening via batch upload",
      "ESG & sustainability risk assessments",
      "Investor presentations generated and exported as PPTX",
    ],
  },
  {
    icon: "○",
    iconBg: "bg-violet-50 text-violet-600",
    title: "Researchers & Consultants",
    desc: "Market research firms charge thousands per report. Strategy consultants bill hundreds per hour for the same analysis. Our platform compresses weeks of desk research into a single automated workflow — covering public and private companies globally, with Wikipedia fallback ensuring coverage even where market data is unavailable.",
    tradCost: "$5,000 – $15,000",
    tradTime: "3 – 6 weeks",
    platformTime: "Minutes",
    savings: "Up to 97%",
    useCases: [
      "Public and private company analysis",
      "Technology spend and digital transformation assessments",
      "Multi-company batch analysis (up to 50 at once)",
      "Exportable reports in PDF, PPTX, and HTML",
    ],
  },
  {
    icon: "⚇",
    iconBg: "bg-emerald-50 text-emerald-600",
    title: "Sales Teams",
    desc: "Sales professionals spend hours researching prospects before outreach. Our platform combines deep company intelligence with a dedicated Sales Enablement tab — pre-built with conversation starters, pain points mapped to solutions, quantified ROI use cases, and recommended next steps tailored to your product.",
    tradCost: "$50 – $200 / user / month",
    tradTime: "Hours per prospect",
    platformTime: "Seconds",
    savings: "Up to 90%",
    useCases: [
      "Pre-call company intelligence briefs",
      "Pain points and solution mapping",
      "Quantified ROI use cases per prospect",
      "Competitive positioning and next-step recommendations",
    ],
  },
  {
    icon: "◧",
    iconBg: "bg-amber-50 text-amber-600",
    title: "Marketing Professionals",
    desc: "Competitive analysis, market sizing, and brand positioning projects are expensive agency engagements. Our platform delivers the same strategic intelligence — from market analysis and growth opportunities to ESG positioning — for any company globally, with multi-currency support for UK, European, and Asian markets.",
    tradCost: "$5,000 – $20,000",
    tradTime: "4 – 8 weeks",
    platformTime: "Minutes",
    savings: "Up to 96%",
    useCases: [
      "Competitive landscape and positioning",
      "Market opportunity and TAM analysis",
      "Industry trend identification",
      "Investor-quality branded presentations",
    ],
  },
];

// ─── Bottom-line stats ────────────────────────────────────────────────────────

const STATS = [
  { value: "10", label: "Report Sections" },
  { value: "4", label: "Export Formats" },
  { value: "50", label: "Companies per Batch" },
  { value: "~2 min", label: "Per Report" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Mission() {
  return (
    <Layout>

      {/* ── Our Mission ───────────────────────────────────────────────────── */}
      <section className="mb-20 animate-fade-up text-center max-w-3xl mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-700 uppercase tracking-widest">Our Mission</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl leading-tight mb-6">
          To democratise strategic business intelligence
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
          Replacing weeks of expensive analyst work with AI-powered reports delivered in minutes — making institutional-grade company analysis accessible to every investor, researcher, sales professional, and marketer.
        </p>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          We believe that deep company insight should not be locked behind six-figure consulting fees or month-long research cycles. By combining real-time financial data, live CEO verification, Wikipedia fallback for private companies, and the latest advances in AI, we deliver the same depth of analysis that Fortune 500 strategy teams rely on — at a fraction of the cost and turnaround time.
        </p>
      </section>

      {/* ── How We Got Here ───────────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">How We Got Here</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Built through rapid iteration, each phase added a new layer of capability — transforming a simple analysis tool into a full-stack business intelligence platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIMELINE.map((item, i) => (
            <div
              key={item.tag}
              className={`rounded-xl border p-6 animate-fade-up ${item.color}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`text-xs font-bold uppercase tracking-widest ${item.tagColor}`}>{item.tag}</span>
              <h3 className="mt-2 mb-3 text-base font-bold text-[var(--text-primary)]">{item.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Value We Deliver ──────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">The Value We Deliver</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Traditional business intelligence is slow and expensive. Here is how our platform compares across four key professional personas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {PERSONAS.map((p, i) => (
            <div
              key={p.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Title row */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${p.iconBg}`}>
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{p.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">{p.desc}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Traditional Cost</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{p.tradCost}</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Traditional Time</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{p.tradTime}</div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="text-xs text-blue-600 mb-0.5">With Our Platform</div>
                  <div className="text-sm font-bold text-blue-700">{p.platformTime}</div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <div className="text-xs text-emerald-600 mb-0.5">Cost Savings</div>
                  <div className="text-sm font-bold text-emerald-700">{p.savings}</div>
                </div>
              </div>

              {/* Use cases */}
              <div>
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Key Use Cases</div>
                <ul className="space-y-1">
                  {p.useCases.map((uc) => (
                    <li key={uc} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--primary)]" />
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Bottom Line ───────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl mb-4">The Bottom Line</h2>
          <p className="max-w-2xl mx-auto text-[var(--text-secondary)] leading-relaxed mb-10">
            What once required a team of analysts, weeks of research, and tens of thousands in consulting fees can now be accomplished by a single person in minutes. Our platform does not just save money — it fundamentally changes who can access strategic business intelligence and how quickly they can act on it.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>

          <Link href="/">
            <a className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              Get Started — Generate a Report
            </a>
          </Link>
        </div>
      </section>

      {/* ── Disclaimer & footer tagline ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <strong className="font-semibold text-[var(--text-primary)]">Data disclaimer:</strong>{" "}
            AI-generated content for strategic guidance only. Financial data sourced from Financial Modeling Prep (public companies) and Wikipedia (private/unlisted companies) where available. Data may be outdated or incomplete. Verify critical information against primary sources before making investment or strategic decisions.
          </p>
        </div>
        <p className="text-center text-xs text-[var(--text-muted)]">
          Built by 1GigLabs — Strategic Business Intelligence, Powered by AI
        </p>
      </section>

    </Layout>
  );
}
