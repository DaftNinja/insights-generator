import type { ReportData } from "@shared/schema";
import { formatDate } from "./utils";

// ─── Theme palette ─────────────────────────────────────────────────────────────
// Detected at export time from the live DOM attribute set by ThemeProvider.

interface ExportPalette {
  bgPage: string;        // page / outermost background
  bgCard: string;        // card / panel background
  bgCardAlt: string;     // slightly elevated card (inner rows, etc.)
  border: string;        // border colour (hex, no #)
  accent: string;        // primary brand colour (purple)
  accentLight: string;   // subtle accent tint for tags/badges
  accentText: string;    // text colour used on accentLight backgrounds
  textPrimary: string;   // strong body text
  textSecondary: string; // muted body text
  textMuted: string;     // very muted / labels
  positive: string;      // growth / strengths (green)
  negative: string;      // risk / weaknesses (red)
  warning: string;       // threats / medium risk (amber)
  info: string;          // opportunities / initiatives (blue)
}

function getExportPalette(): ExportPalette {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";

  if (isDay) {
    return {
      bgPage:        "#f4f3f8",
      bgCard:        "#ffffff",
      bgCardAlt:     "#f0eef8",
      border:        "ddd8f0",
      accent:        "#7c3aed",
      accentLight:   "#ede9fe",
      accentText:    "#5b21b6",
      textPrimary:   "#1a1035",
      textSecondary: "#4b4272",
      textMuted:     "#7c6fa8",
      positive:      "#166534",
      negative:      "#991b1b",
      warning:       "#92400e",
      info:          "#1e40af",
    };
  }

  return {
    bgPage:        "#0a0a14",
    bgCard:        "#13132a",
    bgCardAlt:     "#111122",
    border:        "1e2040",
    accent:        "#aa65ff",
    accentLight:   "#1e1040",
    accentText:    "#aa65ff",
    textPrimary:   "#f0eeff",
    textSecondary: "#9b96c4",
    textMuted:     "#5e5a80",
    positive:      "#4ade80",
    negative:      "#f87171",
    warning:       "#fb923c",
    info:          "#60a5fa",
  };
}

// ─── PDF export ────────────────────────────────────────────────────────────────

export async function exportToPDF(companyName: string, report?: ReportData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");
  const palette = getExportPalette();

  let element: HTMLElement | null = null;
  let tempContainer: HTMLDivElement | null = null;

  if (report) {
    tempContainer = document.createElement("div");
    tempContainer.style.cssText = "position:absolute;left:-9999px;top:0;width:900px;";
    tempContainer.innerHTML = buildFullReportHTML(report, palette);
    document.body.appendChild(tempContainer);
    element = tempContainer;
  } else {
    element = document.getElementById("report-content");
  }
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: palette.bgPage,
      logging: false,
      windowWidth: 900,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${companyName.replace(/\s+/g, "_")}_Stellanor_Report.pdf`);
  } finally {
    if (tempContainer) document.body.removeChild(tempContainer);
  }
}

// ─── Shared HTML builder ───────────────────────────────────────────────────────
// Used by both exportToHTML (download) and exportToPDF (offscreen render).
// All colours come from the palette — never hardcoded.

function buildFullReportHTML(report: ReportData, palette: ExportPalette): string {
  const esc = (s: unknown) => String(s ?? "N/A").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const val = (s: unknown) => (s != null && s !== "" && s !== "null") ? esc(s) : "\u2014";

  const p = palette; // shorthand
  const c = (hex: string) => hex; // pass-through (already include # where needed)

  const es  = report.executiveSummary;
  const fin = report.financials;
  const str = report.strategy;
  const mkt = report.marketAnalysis;
  const tch = report.techSpend;
  const esg = report.esg;
  const swt = report.swot;
  const grw = report.growthOpportunities;
  const rsk = report.riskAssessment;
  const dx  = report.digitalTransformation;

  // Inline style helpers
  const card  = `background:${p.bgCard};border:1px solid #${p.border};border-radius:8px;padding:16px;`;
  const label = `font-size:0.75rem;text-transform:uppercase;color:${p.textMuted};margin-bottom:4px;`;
  const h2    = `font-size:1.25rem;color:${p.accent};border-bottom:1px solid #${p.border};padding-bottom:8px;margin:2rem 0 1rem;`;
  const tag   = (bg: string, text: string) =>
    `display:inline-block;background:${bg};color:${text};border-radius:4px;padding:2px 8px;font-size:0.75rem;margin:2px;`;

  const tagAccent  = tag(p.accentLight, p.accentText);
  const tagPositive = tag(p.accentLight, p.positive);  // reuse tint, swap text
  const tagWarning  = tag(p.accentLight, p.warning);
  const tagNegative = tag(p.accentLight, p.negative);

  return `<div style="font-family:Arial,sans-serif;background:${p.bgPage};color:${p.textPrimary};padding:40px;max-width:900px;margin:0 auto">

  <!-- Header -->
  <div style="margin-bottom:2rem">
    <div style="color:${p.textMuted};font-size:0.875rem;margin-bottom:4px">Stellanor Insight Generator</div>
    <h1 style="font-size:2.5rem;color:${p.accent};margin:0 0 0.25rem">${esc(report.companyName)}</h1>
    <div style="color:${p.textMuted}">${esc(report.industry)} \u00b7 Generated ${formatDate(new Date())}</div>
  </div>

  <!-- Executive Summary -->
  <h2 style="${h2}">Executive Summary</h2>
  <p style="color:${p.textSecondary};line-height:1.6">${esc(es.companyOverview)}</p>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:1rem 0">
    <div style="${card}"><div style="${label}">CEO</div><div style="font-weight:bold;color:${p.textPrimary}">${val(es.ceo)}</div></div>
    <div style="${card}"><div style="${label}">Employees</div><div style="font-weight:bold;color:${p.textPrimary}">${val(es.employees)}</div></div>
    <div style="${card}"><div style="${label}">Founded</div><div style="font-weight:bold;color:${p.textPrimary}">${val(es.founded)}</div></div>
    <div style="${card}"><div style="${label}">Headquarters</div><div style="font-weight:bold;color:${p.textPrimary}">${val(es.headquarters)}</div></div>
  </div>
  ${es.highlights?.length ? `<ul style="color:${p.textSecondary}">${es.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
  ${es.keyExecutives?.length ? `<div style="${card};margin-top:1rem"><div style="${label}">Key Executives</div>${es.keyExecutives.map(e => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #${p.border}"><span style="font-weight:bold;color:${p.textPrimary}">${esc(e.name)}</span><span style="color:${p.textSecondary}">${esc(e.title)}</span></div>`).join("")}</div>` : ""}

  <!-- Financials -->
  <h2 style="${h2}">Financials</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Revenue</div><div style="font-size:1.5rem;font-weight:bold;color:${p.textPrimary}">${val(fin.revenue)}</div><div style="color:${p.positive};font-size:0.875rem">${val(fin.revenueGrowth)}</div></div>
    <div style="${card}"><div style="${label}">Net Income</div><div style="font-size:1.5rem;font-weight:bold;color:${p.textPrimary}">${val(fin.netIncome)}</div></div>
    <div style="${card}"><div style="${label}">EBITDA</div><div style="font-size:1.5rem;font-weight:bold;color:${p.textPrimary}">${val(fin.ebitda)}</div></div>
    <div style="${card}"><div style="${label}">Market Cap</div><div style="font-size:1.5rem;font-weight:bold;color:${p.textPrimary}">${val(fin.marketCap)}</div></div>
  </div>
  ${fin.keyMetrics?.length ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:1rem">${fin.keyMetrics.map(m => `<div style="${card}"><div style="${label}">${esc(m.label)}</div><div style="font-weight:bold;color:${p.textPrimary}">${val(m.value)}</div></div>`).join("")}</div>` : ""}
  ${fin.revenueHistory?.length ? `<div style="${card};margin-bottom:1rem">${fin.revenueHistory.map(r => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #${p.border}"><span style="color:${p.textPrimary};font-weight:bold">${esc(r.year)}</span><span style="color:${p.textSecondary}">${esc(r.revenue)}</span><span style="color:${p.positive}">${esc(r.growth)}</span></div>`).join("")}</div>` : ""}
  ${fin.outlook ? `<p style="color:${p.textSecondary}">${esc(fin.outlook)}</p>` : ""}

  <!-- Strategy -->
  <h2 style="${h2}">Strategy</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Vision</div><p style="color:${p.textSecondary};font-style:italic">${val(str.vision)}</p></div>
    <div style="${card}"><div style="${label}">Mission</div><p style="color:${p.textSecondary};font-style:italic">${val(str.mission)}</p></div>
  </div>
  ${str.coreInitiatives?.length ? str.coreInitiatives.map((init, i) => `<p style="color:${p.textSecondary}"><strong style="color:${p.textPrimary}">${i + 1}. ${esc(init.title)}</strong> <span style="${tagAccent}">${esc(init.timeline)}</span><br>${esc(init.description)}</p>`).join("") : ""}
  ${str.summary ? `<p style="color:${p.textSecondary}">${esc(str.summary)}</p>` : ""}
  ${str.geographicFocus?.length ? `<div style="${card};margin-top:1rem"><div style="${label}">Geographic Focus</div><div>${str.geographicFocus.map(r => `<span style="${tagAccent}">${esc(r)}</span>`).join(" ")}</div></div>` : ""}

  <!-- Market Analysis -->
  <h2 style="${h2}">Market Analysis</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Total Addressable Market</div><div style="font-weight:bold;color:${p.textPrimary}">${val(mkt.totalAddressableMarket)}</div></div>
    <div style="${card}"><div style="${label}">Market Share</div><div style="font-weight:bold;color:${p.textPrimary}">${val(mkt.marketShare)}</div></div>
    <div style="${card}"><div style="${label}">Position</div><div style="font-weight:bold;color:${p.textPrimary}">${val(mkt.marketPosition)}</div></div>
  </div>
  ${mkt.competitors?.length ? `<div style="${card};margin-bottom:1rem">${mkt.competitors.map(c => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #${p.border}"><span style="font-weight:bold;color:${p.textPrimary}">${esc(c.name)}</span><span style="color:${p.textSecondary}">${esc(c.strength)}</span><span style="${c.threat==='high'?tagNegative:c.threat==='medium'?tagWarning:tagPositive}">${esc(c.threat)}</span></div>`).join("")}</div>` : ""}
  ${mkt.summary ? `<p style="color:${p.textSecondary}">${esc(mkt.summary)}</p>` : ""}

  <!-- Tech Spend -->
  <h2 style="${h2}">Technology &amp; IT Spend</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Annual IT Budget</div><div style="font-weight:bold;color:${p.textPrimary}">${val(tch.annualITBudget)}</div></div>
    <div style="${card}"><div style="${label}">IT as % Revenue</div><div style="font-weight:bold;color:${p.textPrimary}">${val(tch.itBudgetAsPercentRevenue)}</div></div>
  </div>
  ${tch.cloudPlatforms?.length ? `<div style="${card};margin-bottom:1rem"><div style="${label}">Cloud Platforms</div>${tch.cloudPlatforms.map(pl => `<span style="${tagAccent}">${esc(pl)}</span>`).join(" ")}</div>` : ""}
  ${tch.keyVendors?.length ? `<div style="${card};margin-bottom:1rem"><div style="${label}">Key Vendors</div>${tch.keyVendors.map(v => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #${p.border}"><span style="font-weight:bold;color:${p.textPrimary}">${esc(v.vendor)}</span><span style="color:${p.textMuted}">${esc(v.category)}</span><span style="color:${p.textSecondary}">${esc(v.relationship)}</span></div>`).join("")}</div>` : ""}
  ${tch.summary ? `<p style="color:${p.textSecondary}">${esc(tch.summary)}</p>` : ""}

  <!-- ESG -->
  <h2 style="${h2}">ESG</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">ESG Rating</div><div style="font-weight:bold;color:${p.textPrimary}">${val(esg.overallRating)}</div></div>
    <div style="${card}"><div style="${label}">Net Zero</div><div style="font-weight:bold;color:${p.textPrimary}">${val(esg.netZeroTarget)}</div></div>
    <div style="${card}"><div style="${label}">Governance</div><div style="font-weight:bold;color:${p.textPrimary}">${val((esg as any).governanceRating)}</div></div>
    <div style="${card}"><div style="${label}">Board Diversity</div><div style="font-weight:bold;color:${p.textPrimary}">${val((esg as any).boardDiversity)}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Environmental</div><ul style="color:${p.textSecondary}">${(esg.environmentalInitiatives ?? []).map(i => `<li>🌱 ${esc(i)}</li>`).join("")}</ul></div>
    <div style="${card}"><div style="${label}">Social</div><ul style="color:${p.textSecondary}">${(esg.socialInitiatives ?? []).map(i => `<li>🤝 ${esc(i)}</li>`).join("")}</ul></div>
  </div>
  ${esg.summary ? `<p style="color:${p.textSecondary}">${esc(esg.summary)}</p>` : ""}

  <!-- SWOT -->
  <h2 style="${h2}">SWOT Analysis</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><h3 style="color:${p.positive};font-size:1rem;margin-bottom:0.5rem">Strengths</h3><ul style="color:${p.textSecondary}">${swt.strengths.map(s => `<li><strong style="color:${p.textPrimary}">${esc(s.title)}</strong> \u2014 ${esc(s.detail)}</li>`).join("")}</ul></div>
    <div style="${card}"><h3 style="color:${p.negative};font-size:1rem;margin-bottom:0.5rem">Weaknesses</h3><ul style="color:${p.textSecondary}">${swt.weaknesses.map(w => `<li><strong style="color:${p.textPrimary}">${esc(w.title)}</strong> \u2014 ${esc(w.detail)}</li>`).join("")}</ul></div>
    <div style="${card}"><h3 style="color:${p.info};font-size:1rem;margin-bottom:0.5rem">Opportunities</h3><ul style="color:${p.textSecondary}">${swt.opportunities.map(o => `<li><strong style="color:${p.textPrimary}">${esc(o.title)}</strong> \u2014 ${esc(o.detail)}</li>`).join("")}</ul></div>
    <div style="${card}"><h3 style="color:${p.warning};font-size:1rem;margin-bottom:0.5rem">Threats</h3><ul style="color:${p.textSecondary}">${swt.threats.map(t => `<li><strong style="color:${p.textPrimary}">${esc(t.title)}</strong> \u2014 ${esc(t.detail)}</li>`).join("")}</ul></div>
  </div>

  <!-- Growth Opportunities -->
  <h2 style="${h2}">Growth Opportunities</h2>
  ${grw.totalOpportunityValue ? `<div style="${card};margin-bottom:1rem"><div style="${label}">Total Opportunity Value</div><div style="font-size:1.5rem;font-weight:bold;color:${p.accent}">${esc(grw.totalOpportunityValue)}</div></div>` : ""}
  <p style="color:${p.textSecondary}">${esc(grw.summary)}</p>
  ${grw.opportunities.map(o => `<div style="${card};margin-bottom:8px"><strong style="color:${p.textPrimary}">${esc(o.title)}</strong> <span style="${tagAccent}">${val(o.potentialValue)}</span><p style="color:${p.textSecondary};margin:4px 0 0">${esc(o.description)}</p></div>`).join("")}

  <!-- Risk Assessment -->
  <h2 style="${h2}">Risk Assessment</h2>
  <p style="color:${p.textSecondary}">${esc(rsk.summary)}</p>
  ${rsk.risks?.map(r => `<div style="${card};margin-bottom:8px"><strong style="color:${p.textPrimary}">${esc(r.title)}</strong> <span style="${tagWarning}">${esc(r.category)}</span><p style="color:${p.textSecondary};margin:4px 0 0">${esc(r.description)}</p><p style="color:${p.textMuted};font-size:0.75rem;margin-top:4px">Impact: ${esc(r.impact)} \u00b7 Likelihood: ${esc(r.likelihood)}</p></div>`).join("") ?? ""}

  <!-- Digital Transformation -->
  <h2 style="${h2}">Digital Transformation</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem">
    <div style="${card}"><div style="${label}">Maturity Level</div><div style="font-weight:bold;color:${p.textPrimary}">${val(dx.maturityLevel)}</div></div>
    <div style="${card}"><div style="${label}">Maturity Score</div><div style="font-weight:bold;color:${p.textPrimary}">${val(dx.maturityScore)}/10</div></div>
  </div>
  ${dx.summary ? `<p style="color:${p.textSecondary}">${esc(dx.summary)}</p>` : ""}
  ${dx.keyInitiatives?.length ? `<div style="${card}">${dx.keyInitiatives.map(init => `<div style="padding:8px 0;border-bottom:1px solid #${p.border}"><span style="${tagAccent}">${esc(init.status.replace("_"," "))}</span> <strong style="color:${p.textPrimary};margin-left:6px">${esc(init.title)}</strong><p style="color:${p.textSecondary};margin:4px 0 0;font-size:0.875rem">${esc(init.description)}</p></div>`).join("")}</div>` : ""}

  <!-- Footer -->
  <div style="margin-top:3rem;padding-top:1rem;border-top:1px solid #${p.border};font-size:0.75rem;color:${p.textMuted}">
    <p>Generated by Stellanor Insight Generator \u00b7 ${formatDate(new Date())} \u00b7 For internal use only.</p>
    <p>This report was generated using AI and may contain inaccuracies. Always verify data before making strategic decisions.</p>
  </div>
</div>`;
}

// ─── PPTX export ───────────────────────────────────────────────────────────────

export async function exportToPPTX(report: ReportData): Promise<void> {
  const pptxgen = (await import("pptxgenjs")).default;
  const prs = new pptxgen();
  const pal = getExportPalette();

  prs.layout = "LAYOUT_WIDE";
  prs.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });

  // Strip # for pptxgenjs (it wants bare hex)
  const hex = (c: string) => c.replace("#", "");
  const BG     = hex(pal.bgPage);
  const CARD   = hex(pal.bgCard);
  const ACCENT = hex(pal.accent);
  const TEXT   = hex(pal.textPrimary);
  const MUTED  = hex(pal.textSecondary);
  const BORDER = pal.border;
  const POS    = hex(pal.positive);
  const NEG    = hex(pal.negative);
  const WARN   = hex(pal.warning);

  const addSlide = (title: string, content: (slide: ReturnType<typeof prs.addSlide>) => void) => {
    const slide = prs.addSlide();
    slide.background = { color: BG };
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.6, fill: { color: CARD } });
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0.6, w: 13.33, h: 0.04, fill: { color: ACCENT } });
    slide.addText(title, { x: 0.4, y: 0.1, w: 10, h: 0.45, fontSize: 16, bold: true, color: TEXT, fontFace: "Arial" });
    slide.addText("SN", { x: 12.3, y: 0.1, w: 0.8, h: 0.45, fontSize: 14, bold: true, color: ACCENT, fontFace: "Arial", align: "right" });
    content(slide);
    return slide;
  };

  // Cover
  const cover = prs.addSlide();
  cover.background = { color: BG };
  cover.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: ACCENT } });
  cover.addText("Stellanor", { x: 0.4, y: 1.5, w: 12, h: 0.6, fontSize: 14, color: ACCENT, fontFace: "Arial" });
  cover.addText(report.companyName, { x: 0.4, y: 2.2, w: 12, h: 1.2, fontSize: 48, bold: true, color: TEXT, fontFace: "Arial" });
  cover.addText("Strategic Intelligence Report", { x: 0.4, y: 3.5, w: 12, h: 0.5, fontSize: 20, color: MUTED, fontFace: "Arial" });
  cover.addText(`Generated ${formatDate(new Date())} · Stellanor Insight Generator`, { x: 0.4, y: 6.8, w: 12, h: 0.4, fontSize: 10, color: MUTED, fontFace: "Arial" });

  // Executive Summary
  addSlide("Executive Summary", (slide) => {
    const es = report.executiveSummary;
    const fields: [string, string][] = [
      ["CEO", String(es.ceo ?? "")],
      ["Founded", String(es.founded ?? "")],
      ["Employees", String(es.employees ?? "")],
      ["HQ", String(es.headquarters ?? "")],
      ["Exchange", String(es.stockExchange ?? "Private")],
    ];
    fields.forEach(([label, value], i) => {
      const x = i < 3 ? 0.4 : 4.6;
      const y = 0.9 + (i % 3) * 0.5;
      slide.addText(label + ":", { x, y, w: 1.5, h: 0.35, fontSize: 10, color: MUTED, fontFace: "Arial" });
      slide.addText(value, { x: x + 1.5, y, w: 2.5, h: 0.35, fontSize: 10, bold: true, color: TEXT, fontFace: "Arial" });
    });
    slide.addText(es.companyOverview, { x: 0.4, y: 2.4, w: 12.5, h: 1.2, fontSize: 11, color: MUTED, fontFace: "Arial", wrap: true });
    es.highlights.forEach((h, i) => {
      slide.addText(`• ${h}`, { x: 0.4, y: 3.8 + i * 0.45, w: 12.5, h: 0.4, fontSize: 11, color: TEXT, fontFace: "Arial" });
    });
  });

  // Financials
  addSlide("Financial Overview", (slide) => {
    const fin = report.financials;
    const metrics: [string, string][] = [
      ["Revenue", String(fin.revenue ?? "")],
      ["Growth", String(fin.revenueGrowth ?? "")],
      ["Net Income", String(fin.netIncome ?? "")],
      ["Market Cap", String(fin.marketCap ?? "")],
    ];
    metrics.forEach(([label, value], i) => {
      const x = 0.4 + (i % 2) * 6.4;
      const y = 0.85 + Math.floor(i / 2) * 1.5;
      slide.addShape(prs.ShapeType.rect, { x, y, w: 6, h: 1.2, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(label, { x: x + 0.2, y: y + 0.1, w: 5.6, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(value, { x: x + 0.2, y: y + 0.45, w: 5.6, h: 0.6, fontSize: 22, bold: true, color: TEXT, fontFace: "Arial" });
    });
    slide.addText(String(fin.outlook ?? ""), { x: 0.4, y: 4.1, w: 12.5, h: 0.8, fontSize: 11, color: MUTED, fontFace: "Arial", wrap: true });
  });

  // Strategy
  addSlide("Strategy", (slide) => {
    const s = report.strategy;
    slide.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.85, w: 6, h: 1.6, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Vision", { x: 0.6, y: 0.9, w: 5.6, h: 0.25, fontSize: 9, color: MUTED, fontFace: "Arial" });
    slide.addText(s.vision ?? "N/A", { x: 0.6, y: 1.2, w: 5.6, h: 1.0, fontSize: 10, italic: true, color: TEXT, fontFace: "Arial", wrap: true });
    slide.addShape(prs.ShapeType.rect, { x: 6.9, y: 0.85, w: 6, h: 1.6, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Mission", { x: 7.1, y: 0.9, w: 5.6, h: 0.25, fontSize: 9, color: MUTED, fontFace: "Arial" });
    slide.addText(s.mission ?? "N/A", { x: 7.1, y: 1.2, w: 5.6, h: 1.0, fontSize: 10, italic: true, color: TEXT, fontFace: "Arial", wrap: true });
    s.coreInitiatives?.slice(0, 4).forEach((init, i) => {
      const y = 2.7 + i * 1.0;
      slide.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.85, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(`${i + 1}. ${init.title}`, { x: 0.6, y: y + 0.08, w: 8, h: 0.3, fontSize: 11, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(init.timeline, { x: 10.5, y: y + 0.08, w: 2.2, h: 0.3, fontSize: 9, color: ACCENT, fontFace: "Arial", align: "right" });
      slide.addText(init.description, { x: 0.6, y: y + 0.4, w: 12, h: 0.35, fontSize: 9, color: MUTED, fontFace: "Arial", wrap: true });
    });
  });

  // Market Analysis
  addSlide("Market Analysis", (slide) => {
    const m = report.marketAnalysis;
    const metrics: [string, string][] = [
      ["Total Addressable Market", String(m.totalAddressableMarket ?? "")],
      ["Market Share", String(m.marketShare ?? "")],
      ["Market Position", String(m.marketPosition ?? "")],
    ];
    metrics.forEach(([label, value], i) => {
      const x = 0.4 + i * 4.3;
      slide.addShape(prs.ShapeType.rect, { x, y: 0.85, w: 3.9, h: 1.1, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(label, { x: x + 0.2, y: 0.9, w: 3.5, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(value || "N/A", { x: x + 0.2, y: 1.25, w: 3.5, h: 0.5, fontSize: 18, bold: true, color: TEXT, fontFace: "Arial" });
    });
    slide.addText("Top Competitors", { x: 0.4, y: 2.2, w: 12, h: 0.3, fontSize: 11, bold: true, color: ACCENT, fontFace: "Arial" });
    m.competitors?.slice(0, 5).forEach((c, i) => {
      const y = 2.6 + i * 0.55;
      slide.addText(c.name, { x: 0.6, y, w: 3, h: 0.4, fontSize: 10, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(c.strength, { x: 3.8, y, w: 6, h: 0.4, fontSize: 9, color: MUTED, fontFace: "Arial" });
      const tc = c.threat === "high" ? NEG : c.threat === "medium" ? WARN : POS;
      slide.addText(c.threat, { x: 10.5, y, w: 2.2, h: 0.4, fontSize: 9, bold: true, color: tc, fontFace: "Arial", align: "right" });
    });
    if (m.summary) slide.addText(m.summary, { x: 0.4, y: 5.6, w: 12.5, h: 0.8, fontSize: 10, color: MUTED, fontFace: "Arial", wrap: true });
  });

  // Tech Spend
  addSlide("Technology & IT Spend", (slide) => {
    const t = report.techSpend;
    [["Annual IT Budget", t.annualITBudget], ["IT as % Revenue", t.itBudgetAsPercentRevenue]].forEach(([label, value], i) => {
      const x = 0.4 + i * 6.4;
      slide.addShape(prs.ShapeType.rect, { x, y: 0.85, w: 6, h: 1.1, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(String(label), { x: x + 0.2, y: 0.9, w: 5.6, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(String(value ?? "N/A"), { x: x + 0.2, y: 1.25, w: 5.6, h: 0.5, fontSize: 18, bold: true, color: TEXT, fontFace: "Arial" });
    });
    if (t.cloudPlatforms?.length) {
      slide.addText("Cloud Platforms", { x: 0.4, y: 2.2, w: 12, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(t.cloudPlatforms.join("  ·  "), { x: 0.4, y: 2.5, w: 12, h: 0.35, fontSize: 11, bold: true, color: TEXT, fontFace: "Arial" });
    }
    t.keyVendors?.slice(0, 5).forEach((v, i) => {
      const y = 3.1 + i * 0.55;
      slide.addText(v.vendor, { x: 0.6, y, w: 3, h: 0.4, fontSize: 10, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(v.category, { x: 3.8, y, w: 3, h: 0.4, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(v.relationship, { x: 7, y, w: 5.5, h: 0.4, fontSize: 9, color: MUTED, fontFace: "Arial" });
    });
    if (t.summary) slide.addText(t.summary, { x: 0.4, y: 6.2, w: 12.5, h: 0.8, fontSize: 10, color: MUTED, fontFace: "Arial", wrap: true });
  });

  // ESG
  addSlide("ESG", (slide) => {
    const e = report.esg;
    const cards: [string, string][] = [
      ["ESG Rating", String(e.overallRating ?? "")],
      ["Net Zero Target", String(e.netZeroTarget ?? "")],
      ["Governance", String((e as any).governanceRating ?? "")],
      ["Board Diversity", String((e as any).boardDiversity ?? "")],
    ];
    cards.forEach(([label, value], i) => {
      const x = 0.4 + i * 3.2;
      slide.addShape(prs.ShapeType.rect, { x, y: 0.85, w: 2.9, h: 1.1, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(label, { x: x + 0.15, y: 0.9, w: 2.6, h: 0.25, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(value || "N/A", { x: x + 0.15, y: 1.2, w: 2.6, h: 0.5, fontSize: 14, bold: true, color: TEXT, fontFace: "Arial" });
    });
    slide.addShape(prs.ShapeType.rect, { x: 0.4, y: 2.2, w: 6.1, h: 2.8, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Environmental Initiatives", { x: 0.6, y: 2.3, w: 5.8, h: 0.3, fontSize: 10, bold: true, color: POS, fontFace: "Arial" });
    e.environmentalInitiatives?.slice(0, 4).forEach((item, i) => {
      slide.addText(`🌱 ${item}`, { x: 0.6, y: 2.7 + i * 0.5, w: 5.8, h: 0.4, fontSize: 9, color: TEXT, fontFace: "Arial" });
    });
    slide.addShape(prs.ShapeType.rect, { x: 6.9, y: 2.2, w: 6.1, h: 2.8, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Social Initiatives", { x: 7.1, y: 2.3, w: 5.8, h: 0.3, fontSize: 10, bold: true, color: hex(pal.info), fontFace: "Arial" });
    e.socialInitiatives?.slice(0, 4).forEach((item, i) => {
      slide.addText(`🤝 ${item}`, { x: 7.1, y: 2.7 + i * 0.5, w: 5.8, h: 0.4, fontSize: 9, color: TEXT, fontFace: "Arial" });
    });
    if (e.summary) slide.addText(e.summary, { x: 0.4, y: 5.3, w: 12.5, h: 1.0, fontSize: 10, color: MUTED, fontFace: "Arial", wrap: true });
  });

  // Growth Opportunities
  addSlide("Growth Opportunities", (slide) => {
    const g = report.growthOpportunities;
    if (g.totalOpportunityValue) {
      slide.addText("Total Opportunity Value", { x: 0.4, y: 0.85, w: 5, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      slide.addText(g.totalOpportunityValue, { x: 0.4, y: 1.1, w: 8, h: 0.5, fontSize: 22, bold: true, color: ACCENT, fontFace: "Arial" });
    }
    g.opportunities.slice(0, 4).forEach((opp, i) => {
      const y = 1.8 + i * 1.2;
      slide.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 1.05, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(opp.title, { x: 0.6, y: y + 0.08, w: 7, h: 0.3, fontSize: 11, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(opp.potentialValue ?? "", { x: 8, y: y + 0.08, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: ACCENT, fontFace: "Arial", align: "right" });
      const confColor = opp.confidence === "high" ? POS : opp.confidence === "medium" ? WARN : NEG;
      slide.addText(opp.confidence ?? "", { x: 10.8, y: y + 0.08, w: 2, h: 0.3, fontSize: 9, color: confColor, fontFace: "Arial", align: "right" });
      slide.addText(opp.description, { x: 0.6, y: y + 0.45, w: 12, h: 0.5, fontSize: 9, color: MUTED, fontFace: "Arial", wrap: true });
    });
  });

  // SWOT
  addSlide("SWOT Analysis", (slide) => {
    const swot = report.swot;
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const quadrants = [
      { label: "Strengths",    items: swot.strengths,    x: 0.4, y: 0.85, bg: isDay ? "f0fdf4" : "052e16", lc: POS },
      { label: "Weaknesses",   items: swot.weaknesses,   x: 6.9, y: 0.85, bg: isDay ? "fef2f2" : "450a0a", lc: NEG },
      { label: "Opportunities",items: swot.opportunities,x: 0.4, y: 4.0,  bg: isDay ? "eff6ff" : "1e3a5f", lc: hex(pal.info) },
      { label: "Threats",      items: swot.threats,      x: 6.9, y: 4.0,  bg: isDay ? "fffbeb" : "4c3a1d", lc: WARN },
    ];
    quadrants.forEach(({ label, items, x, y, bg, lc }) => {
      slide.addShape(prs.ShapeType.rect, { x, y, w: 6.1, h: 2.8, fill: { color: bg }, line: { color: BORDER, width: 1 } });
      slide.addText(label, { x: x + 0.15, y: y + 0.1, w: 5.8, h: 0.3, fontSize: 11, bold: true, color: lc, fontFace: "Arial" });
      items.slice(0, 3).forEach((item: { title: string }, idx) => {
        slide.addText(`• ${item.title}`, { x: x + 0.15, y: y + 0.5 + idx * 0.55, w: 5.8, h: 0.45, fontSize: 10, color: TEXT, fontFace: "Arial" });
      });
    });
  });

  // Risks
  addSlide("Risk Assessment", (slide) => {
    report.riskAssessment.risks.slice(0, 5).forEach((risk, i) => {
      const y = 0.85 + i * 1.1;
      slide.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.95, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      slide.addText(risk.title, { x: 0.6, y: y + 0.08, w: 7, h: 0.3, fontSize: 11, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(`${risk.category} · Impact: ${risk.impact} · Likelihood: ${risk.likelihood}`, { x: 0.6, y: y + 0.45, w: 8, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
      const rc = risk.impact === "high" ? NEG : risk.impact === "medium" ? WARN : POS;
      slide.addText(risk.impact.toUpperCase(), { x: 11, y: y + 0.25, w: 1.7, h: 0.4, fontSize: 11, bold: true, color: rc, fontFace: "Arial", align: "right" });
    });
  });

  // Digital Transformation
  addSlide("Digital Transformation", (slide) => {
    const dx = report.digitalTransformation;
    slide.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.85, w: 6, h: 1.2, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Maturity Level", { x: 0.6, y: 0.9, w: 5.6, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
    slide.addText(((dx.maturityLevel ?? "N/A").charAt(0).toUpperCase() + (dx.maturityLevel ?? "").slice(1)), { x: 0.6, y: 1.25, w: 5.6, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: "Arial" });
    slide.addShape(prs.ShapeType.rect, { x: 6.9, y: 0.85, w: 6, h: 1.2, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
    slide.addText("Maturity Score", { x: 7.1, y: 0.9, w: 5.6, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial" });
    slide.addText(`${dx.maturityScore ?? "N/A"}/10`, { x: 7.1, y: 1.25, w: 5.6, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: "Arial" });
    dx.keyInitiatives?.slice(0, 4).forEach((init, i) => {
      const y = 2.3 + i * 0.9;
      slide.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.75, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
      const sc = init.status === "live" ? POS : init.status === "in_progress" ? WARN : hex(pal.info);
      slide.addText(init.status.replace("_", " "), { x: 0.6, y: y + 0.08, w: 1.5, h: 0.25, fontSize: 8, bold: true, color: sc, fontFace: "Arial" });
      slide.addText(init.title, { x: 2.2, y: y + 0.08, w: 8, h: 0.25, fontSize: 10, bold: true, color: TEXT, fontFace: "Arial" });
      slide.addText(init.description, { x: 2.2, y: y + 0.38, w: 10.5, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial", wrap: true });
    });
  });

  prs.writeFile({ fileName: `${report.companyName.replace(/\s+/g, "_")}_Stellanor_Report.pptx` });
}

// ─── HTML download export ──────────────────────────────────────────────────────

export function exportToHTML(report: ReportData): void {
  const palette = getExportPalette();
  const p = palette;
  const esc = (s: unknown) => String(s ?? "N/A").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(report.companyName)} — Stellanor Intelligence Report</title>
<style>
  body { font-family: Arial, sans-serif; background: ${p.bgPage}; color: ${p.textPrimary}; margin: 0; padding: 40px; }
  .container { max-width: 900px; margin: 0 auto; }
  h2 { font-size: 1.25rem; color: ${p.accent}; border-bottom: 1px solid #${p.border}; padding-bottom: 8px; margin: 2rem 0 1rem; }
  h3 { font-size: 1rem; color: ${p.textPrimary}; }
  p, li { color: ${p.textSecondary}; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 1rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 1rem; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 1rem; }
  .card { background: ${p.bgCard}; border: 1px solid #${p.border}; border-radius: 8px; padding: 16px; }
  .label { font-size: 0.75rem; text-transform: uppercase; color: ${p.textMuted}; margin-bottom: 4px; }
  .value { font-size: 1.5rem; font-weight: bold; color: ${p.textPrimary}; }
  .value-sm { font-size: 1rem; font-weight: bold; color: ${p.textPrimary}; }
  ul { padding-left: 1.5rem; }
  .tag { display:inline-block; background:${p.accentLight}; color:${p.accentText}; border-radius:4px; padding:2px 8px; font-size:0.75rem; margin:2px; }
  .tag-pos { display:inline-block; background:${p.accentLight}; color:${p.positive}; border-radius:4px; padding:2px 8px; font-size:0.75rem; margin:2px; }
  .tag-neg { display:inline-block; background:${p.accentLight}; color:${p.negative}; border-radius:4px; padding:2px 8px; font-size:0.75rem; margin:2px; }
  .tag-warn { display:inline-block; background:${p.accentLight}; color:${p.warning}; border-radius:4px; padding:2px 8px; font-size:0.75rem; margin:2px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px; font-size: 0.75rem; text-transform: uppercase; color: ${p.textMuted}; border-bottom: 1px solid #${p.border}; }
  td { padding: 8px; font-size: 0.875rem; color: ${p.textSecondary}; border-bottom: 1px solid #${p.border}; }
  .bar-bg { height: 8px; border-radius: 4px; background: #${p.border}; }
  .bar-fill { height: 8px; border-radius: 4px; background: ${p.accent}; }
  .divider { border: none; border-top: 1px solid #${p.border}; margin: 8px 0; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #${p.border}; font-size: 0.75rem; color: ${p.textMuted}; }
  @media (max-width: 640px) { .grid-4, .grid-3 { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<div class="container">
${buildFullReportHTML(report, palette)}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.companyName.replace(/\s+/g, "_")}_Stellanor_Report.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Investor Presentation PPTX ────────────────────────────────────────────────

export async function exportInvestorPPTX(
  presentation: { title: string; date: string; slides: any[]; disclaimer?: string },
  companyName: string,
): Promise<void> {
  const pptxgen = (await import("pptxgenjs")).default;
  const prs = new pptxgen();
  const pal = getExportPalette();
  const hex = (c: string) => c.replace("#", "");

  prs.layout = "LAYOUT_WIDE";
  prs.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });

  const BG    = hex(pal.bgPage);
  const CARD  = hex(pal.bgCard);
  const ACCENT= hex(pal.accent);
  const TEXT  = hex(pal.textPrimary);
  const MUTED = hex(pal.textSecondary);
  const BDR   = pal.border;

  const addStyledSlide = (slideNum: number, title: string, content: (slide: ReturnType<typeof prs.addSlide>) => void) => {
    const slide = prs.addSlide();
    slide.background = { color: BG };
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.65, fill: { color: CARD } });
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0.65, w: 13.33, h: 0.04, fill: { color: ACCENT } });
    slide.addText(String(slideNum), { x: 0.25, y: 0.12, w: 0.45, h: 0.4, fontSize: 11, bold: true, color: ACCENT, fontFace: "Arial" });
    slide.addText(title, { x: 0.8, y: 0.12, w: 10.5, h: 0.4, fontSize: 15, bold: true, color: TEXT, fontFace: "Arial" });
    slide.addText("SN", { x: 12.3, y: 0.12, w: 0.8, h: 0.4, fontSize: 13, bold: true, color: ACCENT, fontFace: "Arial", align: "right" });
    content(slide);
    return slide;
  };

  const cover = prs.addSlide();
  cover.background = { color: BG };
  cover.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.1, h: 7.5, fill: { color: ACCENT } });
  cover.addText("Stellanor", { x: 0.4, y: 1.5, w: 12, h: 0.5, fontSize: 13, color: ACCENT, fontFace: "Arial" });
  cover.addText(companyName, { x: 0.4, y: 2.1, w: 12.5, h: 1.4, fontSize: 44, bold: true, color: TEXT, fontFace: "Arial" });
  cover.addText("Investor Presentation", { x: 0.4, y: 3.6, w: 12, h: 0.5, fontSize: 20, color: MUTED, fontFace: "Arial" });
  cover.addText(`${presentation.date} · Generated by Stellanor Insight Generator`, { x: 0.4, y: 6.8, w: 12, h: 0.4, fontSize: 9, color: MUTED, fontFace: "Arial" });

  presentation.slides.forEach((slide: any) => {
    addStyledSlide(slide.slideNumber, slide.title, (s) => {
      if (slide.headline) {
        s.addText(slide.headline, { x: 0.4, y: 0.85, w: 12.5, h: 0.45, fontSize: 13, color: ACCENT, fontFace: "Arial", italic: true });
      }
      if (slide.metric?.value) {
        s.addShape(prs.ShapeType.rect, { x: 9.8, y: 0.82, w: 3.1, h: 0.9, fill: { color: CARD }, line: { color: ACCENT, width: 1 } });
        s.addText(slide.metric.label ?? "", { x: 9.9, y: 0.87, w: 2.9, h: 0.25, fontSize: 8, color: MUTED, fontFace: "Arial" });
        s.addText(slide.metric.value, { x: 9.9, y: 1.1, w: 2.9, h: 0.45, fontSize: 18, bold: true, color: ACCENT, fontFace: "Arial" });
      }
      const bullets: string[] = slide.bullets ?? [];
      bullets.forEach((b: string, i: number) => {
        s.addText(`• ${b}`, { x: 0.4, y: 1.55 + i * 0.7, w: slide.metric?.value ? 9.0 : 12.5, h: 0.6, fontSize: 11, color: TEXT, fontFace: "Arial", wrap: true });
      });
    });
  });

  if (presentation.disclaimer) {
    const dis = prs.addSlide();
    dis.background = { color: BG };
    dis.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.65, fill: { color: CARD } });
    dis.addShape(prs.ShapeType.rect, { x: 0, y: 0.65, w: 13.33, h: 0.04, fill: { color: BDR } });
    dis.addText("Disclaimer", { x: 0.4, y: 0.12, w: 12, h: 0.4, fontSize: 15, bold: true, color: TEXT, fontFace: "Arial" });
    dis.addText(presentation.disclaimer, { x: 0.4, y: 1.0, w: 12.5, h: 5.5, fontSize: 10, color: MUTED, fontFace: "Arial", wrap: true, valign: "top" });
  }

  prs.writeFile({ fileName: `${companyName.replace(/\s+/g, "_")}_Investor_Presentation.pptx` });
}
