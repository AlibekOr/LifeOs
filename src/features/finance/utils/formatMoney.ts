export function formatUzs(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} UZS`;
}

// 999,999,999,999 UZS: far beyond any realistic entry, and it keeps the amount
// well inside safe-integer range and on screen.
export const MAX_AMOUNT_DIGITS = 12;
export const MAX_AMOUNT = 999_999_999_999;

export function parseAmountInput(text: string): number | null {
  // Extra digits beyond the limit are ignored as the user types.
  const digits = text.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS);
  if (!digits) {
    return null;
  }
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

// Keeps the input readable while typing: "1500000" → "1,500,000".
export function formatAmountInput(text: string): string {
  const amount = parseAmountInput(text);
  return amount === null ? '' : amount.toLocaleString('en-US');
}
