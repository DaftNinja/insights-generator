/**
 * Canonical parsing and formatting for numeric display fields.
 *
 * THE ONE RULE THIS MODULE EXISTS TO ENFORCE:
 *   Never strip non-digit characters from a string and re-parse the remainder.
 *
 * `"422-458".replace(/[^0-9]/g, "")` yields `"422458"`. That is not a
 * sanitised number, it is two numbers welded together, and it silently
 * inflated a headcount by three orders of magnitude in production.
 * Everything below tokenises numbers individually and refuses to merge them.
 */

/** Matches one number token: 1, 40, 1,200, 233.7 - but never spans a separator. */
const NUM_TOKEN = /\d[\d,]*(?:\.\d+)?/g;

const NULLISH = new Set([
  "", "null", "n/a", "na", "none", "unknown", "not disclosed", "not available", "-", "—",
]);

/** Words and symbols that mark a figure as soft rather than reported. */
const APPROX_MARKERS = /(~|≈|\bc\.|\bca\.|\bcirca\b|\bapprox|\bestimat|\bover\b|\bmore than\b|\bunder\b|\bfewer than\b|\+\s*$)/i;

/**
 * Decide whether the text sitting between two numbers joins them into a range.
 * Has to cope with units and currency symbols clinging to each end:
 * "$109M-$233.7M" leaves a gap of "M-$", "40 to 50" leaves " to ".
 */
function isRangeSeparator(gap: string): boolean {
  const g = gap.trim().toLowerCase();
  if (g === "") return false;
  if (/\b(to|and|through)\b/.test(g)) return true;
  const stripped = g.replace(/[a-z$£€¥%.,\s]/g, "");
  return stripped === "-" || stripped === "–" || stripped === "—";
}

export type ParsedNumeric =
  | { kind: "unknown"; raw: string }
  | { kind: "exact"; value: number; approx: boolean; raw: string }
  /**
   * `parts` is source order. `low`/`high` are numerically sorted and are only
   * meaningful for unitless quantities such as headcount - for money, "$950M-$1.2B"
   * sorts to low=1.2 which is nonsense. Money callers should use `kind` alone.
   */
  | { kind: "range"; low: number; high: number; parts: [number, number]; raw: string }
  | { kind: "unparseable"; raw: string; reason: string };

/**
 * Pull out every number in a string as a separate value.
 * "10,000-12,000" -> [10000, 12000]. Never [1000012000].
 */
export function numericTokens(raw: unknown): number[] {
  const s = String(raw ?? "");
  const out: number[] = [];
  for (const m of s.matchAll(NUM_TOKEN)) {
    const n = Number(m[0].replace(/,/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function isNullish(raw: unknown): boolean {
  if (raw == null) return true;
  return NULLISH.has(String(raw).trim().toLowerCase());
}

/**
 * Parse a human-written count. Deliberately conservative: anything it is not
 * confident about comes back `unparseable` and must be rendered verbatim
 * rather than guessed at.
 */
export function parseNumericField(raw: unknown): ParsedNumeric {
  const s = String(raw ?? "").trim();
  if (isNullish(s)) return { kind: "unknown", raw: s };

  const tokens = numericTokens(s);
  if (tokens.length === 0) return { kind: "unparseable", raw: s, reason: "no digits found" };

  if (tokens.length === 1) {
    return { kind: "exact", value: tokens[0], approx: APPROX_MARKERS.test(s), raw: s };
  }

  if (tokens.length === 2) {
    // Only treat as a range if what sits between the two numbers is a range
    // separator. "Q3 2024: 500" has two tokens but is not a range.
    const matches = [...s.matchAll(NUM_TOKEN)];
    const gap = s.slice(matches[0].index! + matches[0][0].length, matches[1].index!);
    if (isRangeSeparator(gap)) {
      const [low, high] = tokens[0] <= tokens[1] ? [tokens[0], tokens[1]] : [tokens[1], tokens[0]];
      return { kind: "range", low, high, parts: [tokens[0], tokens[1]], raw: s };
    }
    return { kind: "unparseable", raw: s, reason: "two numbers with no range separator" };
  }

  return { kind: "unparseable", raw: s, reason: `${tokens.length} numbers found` };
}

// ─── Headcount ────────────────────────────────────────────────────────────────

/** Walmart, the largest private employer on earth, is ~2.1M. Anything above this is a parse bug. */
export const MAX_PLAUSIBLE_HEADCOUNT = 3_000_000;
export const MIN_PLAUSIBLE_HEADCOUNT = 1;

export type Headcount = {
  /** What to render. Already formatted; renderers must print this verbatim. */
  display: string;
  /** True when the figure is a range, approximation or web-search estimate. */
  isEstimate: boolean;
  /** Set when the input could not be trusted; surfaces in logs and confidence signals. */
  warning: string | null;
};

/**
 * Normalise a headcount into a canonical display string.
 * Ranges are PRESERVED and labelled, not silently collapsed - a range is
 * honest information and collapsing it to its lower bound invents precision.
 */
export function normaliseHeadcount(raw: unknown): Headcount | null {
  const parsed = parseNumericField(raw);

  switch (parsed.kind) {
    case "unknown":
      return null;

    case "exact": {
      const n = parsed.value;
      if (n < MIN_PLAUSIBLE_HEADCOUNT || n > MAX_PLAUSIBLE_HEADCOUNT) {
        return {
          display: parsed.raw,
          isEstimate: true,
          warning: `headcount ${n} outside plausible range ${MIN_PLAUSIBLE_HEADCOUNT}-${MAX_PLAUSIBLE_HEADCOUNT}`,
        };
      }
      return {
        display: (parsed.approx ? "~" : "") + n.toLocaleString("en-GB"),
        isEstimate: parsed.approx,
        warning: null,
      };
    }

    case "range": {
      const { low, high } = parsed;
      if (high > MAX_PLAUSIBLE_HEADCOUNT || low < MIN_PLAUSIBLE_HEADCOUNT) {
        return {
          display: parsed.raw,
          isEstimate: true,
          warning: `headcount range ${low}-${high} outside plausible bounds`,
        };
      }
      return {
        display: `${low.toLocaleString("en-GB")} to ${high.toLocaleString("en-GB")}`,
        isEstimate: true,
        warning: null,
      };
    }

    case "unparseable":
      return { display: parsed.raw, isEstimate: true, warning: `unparseable headcount: ${parsed.reason}` };
  }
}

// ─── Money ────────────────────────────────────────────────────────────────────

const UNIT_SCALE: Record<string, number> = {
  k: 1e3, m: 1e6, mm: 1e6, bn: 1e9, b: 1e9, t: 1e12,
};

/**
 * Convert "$1.2B" / "£950M" / "€4.6bn" to an absolute number so figures with
 * different units can be compared. Returns null rather than guessing.
 *
 * The old growth calculation did `revenue.replace(/[^0-9.]/g, "")`, which
 * compares 1.2 against 950 when moving from $950M to $1.2B and reports a
 * 99.9% collapse in revenue.
 */
export function parseMoney(raw: unknown): number | null {
  const s = String(raw ?? "").trim();
  if (isNullish(s)) return null;

  const tokens = numericTokens(s);
  if (tokens.length !== 1) return null; // ranges and multi-value strings are not a scalar

  const m = s.match(/(\d[\d,]*(?:\.\d+)?)\s*(k|mm|m|bn|b|t)?\b/i);
  if (!m) return null;

  const base = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;

  const unit = (m[2] ?? "").toLowerCase();
  const scale = unit ? (UNIT_SCALE[unit] ?? 1) : 1;
  const signed = /^\(|\)$|^-/.test(s) ? -Math.abs(base) : base;
  return signed * scale;
}

// ─── Cross-field plausibility ─────────────────────────────────────────────────

/**
 * Absolute bounds alone cannot catch this bug: 422,458 is a perfectly plausible
 * headcount in isolation (Amazon-scale). What makes it absurd is that it sits
 * next to $109M of revenue - about $258 of revenue per employee.
 *
 * Revenue per head is the cheapest cross-check available and it catches
 * order-of-magnitude headcount errors that no single-field rule can see.
 */
export const MIN_REVENUE_PER_EMPLOYEE = 10_000;
export const MAX_REVENUE_PER_EMPLOYEE = 25_000_000;

export function crossCheckHeadcountAgainstRevenue(
  employees: unknown,
  revenue: unknown,
): { ok: boolean; perHead: number | null; message: string | null } {
  const rev = parseMoney(revenue);
  const parsed = parseNumericField(employees);

  let heads: number | null = null;
  if (parsed.kind === "exact") heads = parsed.value;
  else if (parsed.kind === "range") heads = (parsed.low + parsed.high) / 2;

  if (rev == null || heads == null || heads <= 0) {
    return { ok: true, perHead: null, message: null };
  }

  const perHead = rev / heads;
  if (perHead < MIN_REVENUE_PER_EMPLOYEE) {
    return {
      ok: false, perHead,
      message: `implausible headcount: ${Math.round(heads).toLocaleString("en-GB")} employees against revenue of ${String(revenue)} is ${Math.round(perHead).toLocaleString("en-GB")} per employee - headcount is likely inflated by an order of magnitude`,
    };
  }
  if (perHead > MAX_REVENUE_PER_EMPLOYEE) {
    return {
      ok: false, perHead,
      message: `implausible headcount: ${Math.round(heads).toLocaleString("en-GB")} employees against revenue of ${String(revenue)} is ${Math.round(perHead).toLocaleString("en-GB")} per employee - headcount or revenue unit is likely wrong`,
    };
  }
  return { ok: true, perHead, message: null };
}

/** Growth between two money strings, unit-aware. Null when either side is not a scalar. */
export function percentChange(current: unknown, previous: unknown): number | null {
  const c = parseMoney(current);
  const p = parseMoney(previous);
  if (c == null || p == null || p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}
