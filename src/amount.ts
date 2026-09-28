/**
 * Parse a Polish-formatted amount into integer grosze (SPEC issue 04).
 * Shared pure module: used by the entry form; its rules mirror the API's
 * integer-grosze validation.
 *
 * The sign never comes from the input — it comes from the Dodaj/Zabierz
 * action — so negative input is rejected.
 */
export function parseAmountInput(input: string): number | null {
  const trimmed = input.trim();
  // Up to 7 whole złoty, optional separator with 1–2 decimals (comma or dot).
  if (!/^\d{1,7}([,.]\d{1,2})?$/.test(trimmed)) return null;

  const [wholePart, decimalPart = ""] = trimmed.split(/[,.]/);
  const whole = Number.parseInt(wholePart, 10);
  const decimals = decimalPart ? Number.parseInt(decimalPart.padEnd(2, "0"), 10) : 0;

  return whole * 100 + decimals;
}
