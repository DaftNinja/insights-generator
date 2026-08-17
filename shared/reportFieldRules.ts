/**
 * Registry of every report field that reaches the UI as a number, plus the
 * machinery to sanitise them in one place.
 *
 * WHY THIS EXISTS
 * The previous headcount guard sanitised `financials.employees`. That path has
 * never existed - `employees` lives on `executiveSummary`. The guard was dead
 * code from the day it was written and no test or type error caught it, because
 * it ran against an `any`-cast object. `assertRulePathsExist()` below closes
 * that hole: a rule pointing at a path the schema does not define is a build
 * failure, not a silent no-op.
 */

import {
  normaliseHeadcount,
  parseNumericField,
  isNullish,
  crossCheckHeadcountAgainstRevenue,
} from "./numeric.js";

export type FieldKind = "headcount" | "money" | "percent" | "year" | "money-range-ok";

export type FieldRule = {
  /** Dot path into ReportData. `[]` marks an array to map over. */
  path: string;
  kind: FieldKind;
  /** Human label used in warnings and confidence signals. */
  label: string;
};

/**
 * Every numeric field rendered as a headline value somewhere in the client or
 * the HTML/PPTX export. Adding a numeric card to the UI means adding it here.
 */
export const NUMERIC_FIELD_RULES: FieldRule[] = [
  { path: "executiveSummary.employees",            kind: "headcount",      label: "Employees" },
  { path: "executiveSummary.founded",              kind: "year",           label: "Founded" },
  { path: "financials.revenue",                    kind: "money",          label: "Revenue" },
  { path: "financials.netIncome",                  kind: "money",          label: "Net income" },
  { path: "financials.ebitda",                     kind: "money",          label: "EBITDA" },
  { path: "financials.marketCap",                  kind: "money",          label: "Market cap" },
  { path: "financials.stockPrice",                 kind: "money",          label: "Stock price" },
  { path: "financials.revenueGrowth",              kind: "percent",        label: "Revenue growth" },
  { path: "financials.revenueHistory[].revenue",   kind: "money",          label: "Revenue history" },
  { path: "marketAnalysis.totalAddressableMarket", kind: "money-range-ok", label: "TAM" },
  { path: "marketAnalysis.marketShare",            kind: "percent",        label: "Market share" },
  { path: "techSpend.annualITBudget",              kind: "money-range-ok", label: "IT budget" },
  { path: "growthOpportunities.totalOpportunityValue", kind: "money-range-ok", label: "Total opportunity value" },
  { path: "growthOpportunities.opportunities[].potentialValue", kind: "money-range-ok", label: "Opportunity value" },
];

export type FieldIssue = {
  path: string;
  label: string;
  severity: "warn" | "error";
  message: string;
  before: string;
  after: string;
};

// ─── Path helpers ─────────────────────────────────────────────────────────────

type Visit = (holder: Record<string, unknown>, key: string, fullPath: string) => void;

/**
 * Walk a dot path, expanding `[]` segments across arrays, and visit each leaf holder.
 *
 * Distinguishes two kinds of miss, because they mean very different things:
 *  - `parentMissing`: a container on the way to the field is absent. The model
 *    dropped a whole section, or a rule points somewhere that does not exist.
 *  - `keyMissing`: the container is there but the leaf key is not. Usually just
 *    an optional field the model chose not to populate.
 */
function visitPath(
  root: unknown,
  path: string,
  visit: Visit,
): { visited: number; parentMissing: boolean; keyMissing: boolean } {
  const segments = path.split(".");
  let parentMissing = false;
  let keyMissing = false;
  let visited = 0;

  const walk = (node: unknown, i: number, acc: string) => {
    if (node == null || typeof node !== "object") { parentMissing = true; return; }

    const seg = segments[i];
    const isArray = seg.endsWith("[]");
    const key = isArray ? seg.slice(0, -2) : seg;
    const obj = node as Record<string, unknown>;
    const last = i === segments.length - 1;

    if (last && !isArray) {
      if (!(key in obj)) { keyMissing = true; return; }
      visit(obj, key, acc ? `${acc}.${key}` : key);
      visited++;
      return;
    }

    const next = obj[key];
    if (isArray) {
      // An empty array is a legitimate result, not a missing container.
      if (!Array.isArray(next)) { parentMissing = true; return; }
      next.forEach((el, idx) => walk(el, i + 1, `${acc ? acc + "." : ""}${key}[${idx}]`));
      visited += next.length === 0 ? 1 : 0;
      return;
    }
    walk(next, i + 1, acc ? `${acc}.${key}` : key);
  };

  walk(root, 0, "");
  return { visited, parentMissing, keyMissing };
}

// ─── Sanitisation ─────────────────────────────────────────────────────────────

/**
 * Normalise every registered numeric field on a generated report, in place.
 * Returns the issues found so callers can log them and feed the confidence score.
 *
 * Ranges are labelled, never silently collapsed. Implausible values are left
 * verbatim and flagged rather than coerced into a number that looks credible.
 */
export function sanitiseNumericFields(report: unknown): FieldIssue[] {
  const issues: FieldIssue[] = [];

  for (const rule of NUMERIC_FIELD_RULES) {
    const { visited, parentMissing, keyMissing } = visitPath(report, rule.path, (holder, key, fullPath) => {
      const before = String(holder[key] ?? "");
      if (isNullish(before)) return;

      if (rule.kind === "headcount") {
        const hc = normaliseHeadcount(before);
        if (!hc) return;
        if (hc.display !== before) {
          holder[key] = hc.display;
        }
        if (hc.warning) {
          issues.push({ path: fullPath, label: rule.label, severity: "error", message: hc.warning, before, after: String(holder[key]) });
        } else if (hc.isEstimate) {
          issues.push({ path: fullPath, label: rule.label, severity: "warn", message: "value is an estimate or range", before, after: String(holder[key]) });
        }
        return;
      }

      if (rule.kind === "money" || rule.kind === "percent" || rule.kind === "year") {
        const parsed = parseNumericField(before);
        if (parsed.kind === "range") {
          issues.push({
            path: fullPath, label: rule.label, severity: "warn",
            before, after: before,
            message: `range returned for a single-value field ("${before}") - flagged as estimate, not collapsed`,
          });
        } else if (parsed.kind === "unparseable") {
          issues.push({
            path: fullPath, label: rule.label, severity: "warn",
            before, after: before,
            message: `could not parse as a single ${rule.kind}: ${parsed.reason}`,
          });
        } else if (rule.kind === "year" && parsed.kind === "exact") {
          const y = parsed.value;
          const thisYear = new Date().getUTCFullYear();
          if (y < 1600 || y > thisYear) {
            issues.push({ path: fullPath, label: rule.label, severity: "error", before, after: before, message: `implausible year ${y}` });
          }
        }
        return;
      }
      // money-range-ok: ranges are legitimate (TAM, opportunity sizing). No action.
    });

    if (visited === 0) {
      // A missing container is a structural failure - the model dropped a whole
      // section, or this rule is a dead guard pointing at a path that does not
      // exist. A missing leaf key on a present container is usually just an
      // optional field the model left out.
      issues.push({
        path: rule.path, label: rule.label,
        severity: parentMissing ? "error" : "warn",
        before: "", after: "",
        message: parentMissing
          ? `container for ${rule.path} is absent - dropped section or dead guard`
          : `${rule.path} was not populated by the model`,
      });
      void keyMissing;
    }
  }

  // Cross-field checks. Single-field rules cannot catch an order-of-magnitude
  // headcount error, because the wrong number is plausible on its own.
  const r = report as any;
  const xc = crossCheckHeadcountAgainstRevenue(r?.executiveSummary?.employees, r?.financials?.revenue);
  if (!xc.ok && xc.message) {
    issues.push({
      path: "executiveSummary.employees",
      label: "Employees vs revenue",
      severity: "error",
      before: String(r?.executiveSummary?.employees ?? ""),
      after: String(r?.executiveSummary?.employees ?? ""),
      message: xc.message,
    });
  }

  return issues;
}

// ─── Build-time guard against dead rules ──────────────────────────────────────

/**
 * Assert every rule path exists in the Zod schema. Call this from a test.
 * This is the check that would have caught `financials.employees`.
 */
export function assertRulePathsExist(reportDataSchema: any): string[] {
  const bad: string[] = [];

  const unwrap = (s: any): any => {
    let cur = s;
    for (let i = 0; i < 12 && cur; i++) {
      const t = cur?._def?.typeName;
      if (t === "ZodOptional" || t === "ZodNullable" || t === "ZodDefault") { cur = cur._def.innerType; continue; }
      if (t === "ZodEffects") { cur = cur._def.schema; continue; }
      return cur;
    }
    return cur;
  };

  for (const rule of NUMERIC_FIELD_RULES) {
    let cur = unwrap(reportDataSchema);
    let ok = true;

    for (const seg of rule.path.split(".")) {
      const isArray = seg.endsWith("[]");
      const key = isArray ? seg.slice(0, -2) : seg;
      const shape = cur?._def?.typeName === "ZodObject" ? cur.shape : null;
      if (!shape || !(key in shape)) { ok = false; break; }
      cur = unwrap(shape[key]);
      if (isArray) {
        if (cur?._def?.typeName !== "ZodArray") { ok = false; break; }
        cur = unwrap(cur._def.type);
      }
    }

    if (!ok) bad.push(rule.path);
  }

  return bad;
}
