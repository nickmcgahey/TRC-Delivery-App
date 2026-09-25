/** Ontario HST, in percent. */
export const HST_PERCENT = 13;

export const MEMBERSHIP_PRICE_CENTS = 799;

/** Sample in-zone per-delivery fee. Not a live rate. */
export const SAMPLE_DELIVERY_FEE_CENTS = 499;

export function hstCents(preTaxCents: number): number {
  return Math.round((preTaxCents * HST_PERCENT) / 100);
}

export function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export const MEMBERSHIP_TAX_CENTS = hstCents(MEMBERSHIP_PRICE_CENTS);
export const MEMBERSHIP_TOTAL_CENTS = MEMBERSHIP_PRICE_CENTS + MEMBERSHIP_TAX_CENTS;
