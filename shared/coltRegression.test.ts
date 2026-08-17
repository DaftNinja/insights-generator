/**
 * End-to-end reproduction of the Colt Data Centre Services report.
 * Feeds the exact model output that produced the bad report through the old
 * and new pipelines and compares what each renderer would print.
 *
 * Run: npx tsx shared/coltRegression.test.ts
 */
import assert from "node:assert/strict";
import { sanitiseNumericFields } from "./reportFieldRules.js";

/** Part A exactly as the model returned it for Colt, before any sanitisation. */
const rawPartA = () => ({
  companyName: "Colt Data Centre Services",
  executiveSummary: { employees: "422-458", founded: "2010", ceo: "See company website for current CEO" },
  financials: {
    revenue: "$109M-$233.7M", netIncome: null, ebitda: null, marketCap: null,
    stockPrice: null, revenueGrowth: null, revenueHistory: [],
  },
  marketAnalysis: { totalAddressableMarket: null, marketShare: null },
  techSpend: { annualITBudget: null },
  growthOpportunities: {
    totalOpportunityValue: "$3.5-8.1B",
    opportunities: [{ potentialValue: "$2-5B" }],
  },
});

// The two renderers, as they were.
const oldDashboardRender = (v: string) => {
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? v : n.toLocaleString("en-GB");
};
const exportRender = (v: string) => v; // export.ts printed the raw value

console.log("\n─── Before the fix ───");
const before = rawPartA();
const beforeDash = oldDashboardRender(before.executiveSummary.employees);
const beforeExport = exportRender(before.executiveSummary.employees);
console.log(`  model returned : "${before.executiveSummary.employees}"`);
console.log(`  dashboard card : "${beforeDash}"`);
console.log(`  HTML export    : "${beforeExport}"`);
console.log(`  agree?         : ${beforeDash === beforeExport ? "yes" : "NO - same report, two different numbers"}`);

assert.equal(beforeDash, "422,458", "reproduces the reported bug");
assert.notEqual(beforeDash, beforeExport, "reproduces the dashboard/export divergence");

console.log("\n─── After the fix ───");
const after = rawPartA();
const issues = sanitiseNumericFields(after);
const afterValue = after.executiveSummary.employees;
console.log(`  model returned : "422-458"`);
console.log(`  normalised to  : "${afterValue}"`);
console.log(`  dashboard card : "${afterValue}"   (renders verbatim)`);
console.log(`  HTML export    : "${exportRender(afterValue)}"   (renders verbatim)`);
console.log(`  agree?         : yes`);

assert.equal(afterValue, "422 to 458");
assert.ok(!afterValue.includes("422,458"));

console.log("\n─── Validator output that would now appear in Railway logs ───");
for (const i of issues) {
  console.log(`  ${i.severity === "error" ? "❌" : "⚠️ "} [${i.label}] ${i.path}: ${i.message}`);
}
assert.ok(issues.length > 0, "the bad report must not pass silently");
assert.ok(issues.some(i => i.path === "executiveSummary.employees"), "headcount must be flagged");
assert.ok(issues.some(i => i.path === "financials.revenue"), "the 2x revenue range must be flagged");

console.log("\n─── Counterfactual: what if the model had returned 422458 as a plain number? ───");
const plain: any = rawPartA();
plain.executiveSummary.employees = "422458";
plain.financials.revenue = "$109M";
const plainIssues = sanitiseNumericFields(plain);
const crossCheck = plainIssues.find(i => i.label === "Employees vs revenue");
console.log(`  ${crossCheck ? "❌ " + crossCheck.message : "not caught"}`);
assert.ok(crossCheck, "revenue-per-head cross-check must catch a plausible-looking but wrong headcount");

console.log("\nAll Colt regression assertions passed\n");

// ─── Part A / Part B split ────────────────────────────────────────────────────
// The generator builds a report from two model calls. executiveSummary,
// financials and marketAnalysis come from Part A; techSpend, growthOpportunities,
// esg, swot, riskAssessment and digitalTransformation come from Part B.
//
// The registry was first wired to validate Part A alone. Three rules then
// reported their containers as absent on every single report, and because those
// are errors the confidence signal failed, forcing every report to red. A guard
// pointed at paths missing from the object it was handed - the exact failure
// this registry exists to prevent, reproduced by its own wiring.

const partAOnly = () => ({
  executiveSummary: { employees: "450", founded: "2010" },
  financials: { revenue: "$100M-$500M", netIncome: null, ebitda: null, marketCap: null, revenueGrowth: null, revenueHistory: [] },
  marketAnalysis: { totalAddressableMarket: null, marketShare: null },
});
const partBOnly = () => ({
  techSpend: { annualITBudget: null },
  growthOpportunities: { totalOpportunityValue: "$3.5-8.1B", opportunities: [{ potentialValue: "$2-5B" }] },
});

console.log("\n─── Part A alone: reproduces the false errors ───");
const aOnly = sanitiseNumericFields(partAOnly());
const falseErrors = aOnly.filter(i => i.severity === "error");
for (const i of falseErrors) console.log(`  ❌ ${i.path}: ${i.message}`);
assert.equal(falseErrors.length, 3, "expected the three Part B containers to be reported absent");

console.log("\n─── Merged report: clean ───");
const merged: any = { ...partAOnly(), ...partBOnly() };
const mergedIssues = sanitiseNumericFields(merged);
const realErrors = mergedIssues.filter(i => i.severity === "error");
for (const i of mergedIssues) console.log(`  ${i.severity === "error" ? "❌" : "⚠️ "} ${i.path}: ${i.message}`);
assert.equal(realErrors.length, 0, "a well-formed merged report must raise no errors");
assert.ok(mergedIssues.some(i => i.path === "financials.revenue" && /range returned/.test(i.message)),
  "the 5x revenue range must now reach the validator instead of being truncated upstream");

console.log("\nPart A/B split assertions passed\n");
