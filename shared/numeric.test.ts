/**
 * Regression tests for the headcount inflation bug.
 * Run: npx tsx shared/numeric.test.ts
 */
import assert from "node:assert/strict";
import { numericTokens, parseNumericField, normaliseHeadcount, parseMoney, percentChange, crossCheckHeadcountAgainstRevenue } from "./numeric.js";
import { sanitiseNumericFields, assertRulePathsExist } from "./reportFieldRules.js";
import { ReportDataSchema } from "./schema.js";

let pass = 0;
const t = (name: string, fn: () => void) => {
  try { fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e: any) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
};

console.log("\nnumericTokens - never welds numbers together");
t("range stays two tokens", () => assert.deepEqual(numericTokens("422-458"), [422, 458]));
t("thousands separators survive", () => assert.deepEqual(numericTokens("10,000-12,000"), [10000, 12000]));
t("single value", () => assert.deepEqual(numericTokens("~1,200"), [1200]));
t("no digits", () => assert.deepEqual(numericTokens("Unknown"), []));

console.log("\nnormaliseHeadcount - the actual Colt regression");
t("422-458 never becomes 422,458", () => {
  const hc = normaliseHeadcount("422-458")!;
  assert.equal(hc.display, "422 to 458");
  assert.equal(hc.isEstimate, true);
  assert.ok(!hc.display.includes("422,458"), "must not concatenate range bounds");
});
t("en dash range handled", () => assert.equal(normaliseHeadcount("40–50")!.display, "40 to 50"));
t("10,000-12,000 does not become 1,000,012,000", () => {
  assert.equal(normaliseHeadcount("10,000-12,000")!.display, "10,000 to 12,000");
});
t("plain number formats cleanly", () => {
  const hc = normaliseHeadcount("330000")!;
  assert.equal(hc.display, "330,000");
  assert.equal(hc.isEstimate, false);
});
t("already-formatted number is stable", () => assert.equal(normaliseHeadcount("62,000")!.display, "62,000"));
t("approx marker preserved", () => {
  const hc = normaliseHeadcount("~500")!;
  assert.equal(hc.display, "~500");
  assert.equal(hc.isEstimate, true);
});
t("500+ treated as estimate", () => assert.equal(normaliseHeadcount("500+")!.isEstimate, true));
t("null-ish returns null", () => {
  for (const v of [null, "", "null", "N/A", "Unknown"]) assert.equal(normaliseHeadcount(v), null, String(v));
});
t("bounds alone cannot catch 422,458 - it is plausible in isolation", () => {
  const hc = normaliseHeadcount("422458")!;
  assert.equal(hc.warning, null, "422,458 is Amazon-scale but not out of bounds");
  assert.equal(hc.display, "422,458");
});
t("absurd magnitudes are still bounded", () => {
  assert.ok(normaliseHeadcount("9,000,000")!.warning, "9M employees must warn");
});
t("cross-check catches what bounds cannot", () => {
  const xc = crossCheckHeadcountAgainstRevenue("422,458", "$109M");
  assert.equal(xc.ok, false);
  assert.match(xc.message!, /order of magnitude/);
});
t("the correct Colt figure passes the cross-check", () => {
  assert.equal(crossCheckHeadcountAgainstRevenue("422 to 458", "$109M").ok, true);
});
t("cross-check stays quiet when either side is missing", () => {
  assert.equal(crossCheckHeadcountAgainstRevenue("422-458", null).ok, true);
  assert.equal(crossCheckHeadcountAgainstRevenue(null, "$109M").ok, true);
});
t("prose with two unrelated numbers is not silently merged", () => {
  const p = parseNumericField("Q3 2024 headcount 500");
  assert.equal(p.kind, "unparseable");
});

console.log("\nparseMoney - unit-aware comparison");
t("$1.2B", () => assert.equal(parseMoney("$1.2B"), 1.2e9));
t("£950M", () => assert.equal(parseMoney("£950M"), 950e6));
t("€4.6bn", () => assert.equal(parseMoney("€4.6bn"), 4.6e9));
t("range is not a scalar", () => assert.equal(parseMoney("$109M-$233.7M"), null));
t("growth across a unit boundary is correct", () => {
  const g = percentChange("$1.2B", "$950M")!;
  assert.ok(Math.abs(g - 26.32) < 0.1, `expected ~26.3%, got ${g}`);
});
t("old digit-strip approach was wrong", () => {
  const naive = parseFloat("$1.2B".replace(/[^0-9.]/g, "")) / parseFloat("$950M".replace(/[^0-9.]/g, ""));
  assert.ok(naive < 0.01, "demonstrates the old bug: 1.2 vs 950");
});

console.log("\nsanitiseNumericFields - end to end on the Colt report shape");
t("employees normalised and flagged", () => {
  const report: any = {
    executiveSummary: { employees: "422-458", founded: "2010" },
    financials: { revenue: "$109M-$233.7M", netIncome: null, ebitda: null, marketCap: null, stockPrice: null, revenueGrowth: null, revenueHistory: [] },
    marketAnalysis: { totalAddressableMarket: null, marketShare: null },
    techSpend: { annualITBudget: null },
    growthOpportunities: { totalOpportunityValue: "$3.5-8.1B", opportunities: [{ potentialValue: "$2-5B" }] },
  };
  const issues = sanitiseNumericFields(report);
  assert.equal(report.executiveSummary.employees, "422 to 458");
  assert.ok(issues.some(i => i.path === "executiveSummary.employees" && i.severity === "warn"));
  assert.ok(issues.some(i => i.path === "financials.revenue" && /range returned/.test(i.message)),
    "revenue range must be flagged");
  assert.ok(!issues.some(i => i.label === "Total opportunity value"), "TAM-style ranges are legitimate");
});
t("a dropped section is an error, a missing optional leaf is only a warning", () => {
  const dropped = sanitiseNumericFields({ executiveSummary: { employees: "500", founded: "2010" } });
  assert.ok(dropped.some(i => i.path === "financials.revenue" && i.severity === "error" && /dead guard/.test(i.message)),
    "an absent financials container must be an error");

  const optional = sanitiseNumericFields({
    executiveSummary: { employees: "500", founded: "2010" },
    financials: { revenue: "$10M", netIncome: null, ebitda: null, marketCap: null, revenueGrowth: null, revenueHistory: [] },
    marketAnalysis: { totalAddressableMarket: null, marketShare: null },
    techSpend: { annualITBudget: null },
    growthOpportunities: { totalOpportunityValue: null, opportunities: [] },
  });
  const stockPrice = optional.find(i => i.path === "financials.stockPrice");
  assert.equal(stockPrice?.severity, "warn", "an omitted optional field must not be an error");
  assert.equal(optional.filter(i => i.severity === "error").length, 0, "no spurious errors on a well-formed report");
});

console.log("\nassertRulePathsExist - the meta-fix");
t("every field rule resolves against the Zod schema", () => {
  const bad = assertRulePathsExist(ReportDataSchema);
  assert.deepEqual(bad, [], `rules pointing at non-existent paths: ${bad.join(", ")}`);
});
t("the old dead guard path would have been caught", () => {
  const shape = (ReportDataSchema as any).shape.financials.shape;
  assert.ok(!("employees" in shape), "financials.employees must not exist - proving the old guard was dead code");
});

console.log(`\n${pass} assertions passed\n`);
