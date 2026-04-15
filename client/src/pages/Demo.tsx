import { Layout, PageHeader } from "@/components/Layout";

export function Demo() {
  return (
    <Layout>
      <PageHeader
        label="Product Demo"
        title="See It In Action"
        subtitle="A walkthrough of the 1GigLabs Insight Generator — from company search to full strategic report."
      />

      <div className="max-w-4xl animate-fade-up">
        {/* Video player */}
        <div className="rounded-lg border border-[var(--border)] overflow-hidden shadow-lg bg-black">
          <video
            controls
            autoPlay={false}
            className="w-full"
          >
            <source src="/InsightGeneratorDemo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Feature highlights below video */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon, title, desc }) => (
            <div key={title} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 border border-blue-100 text-base">
                  {icon}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

const HIGHLIGHTS = [
  {
    icon: "⚡",
    title: "60-Second Reports",
    desc: "Enter any company name and get a full 10-section strategic analysis in under a minute.",
  },
  {
    icon: "🤝",
    title: "Sales Enablement",
    desc: "Generate a tailored sales brief against any target company based on your own product.",
  },
  {
    icon: "📤",
    title: "Export Anywhere",
    desc: "Download as PDF, PowerPoint, or HTML — ready for client presentations and briefs.",
  },
];
