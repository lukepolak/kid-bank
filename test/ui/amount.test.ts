import { describe, expect, it } from "vitest";
import { parseAmountInput } from "../../src/amount";

describe("parseAmountInput (Polish amount → grosze)", () => {
  it.each([
    ["149,50", 14950],
    ["149", 14900],
    ["149,5", 14950],
    ["0,01", 1],
    ["  149,50  ", 14950], // trimmed
    ["149.50", 14950], // dot tolerated like a comma
  ] as const)("parses %j into %d grosze", (input, expected) => {
    expect(parseAmountInput(input)).toBe(expected);
  });

  it.each([
    ["empty string", ""],
    ["only letters", "abc"],
    ["double separators", "1,2,3"],
    ["three decimals", "14,505"],
    ["negative input (sign comes from the Dodaj/Zabierz action)", "-50"],
    ["trailing separator", "149,"],
    ["polish space grouping", "1 149,50"],
  ] as const)("rejects %s", (_name, input) => {
    expect(parseAmountInput(input)).toBeNull();
  });
});
