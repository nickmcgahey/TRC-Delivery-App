import { LIMIT_MG } from "./equivalency";
import { hstCents, SAMPLE_DELIVERY_FEE_CENTS } from "./money";

export type QuoteLine = {
  priceCents: number;
  qty: number;
  driedEquivalentMg: number;
};

export type Quote = {
  subtotalCents: number;
  driedEquivalentMg: number;
  listDeliveryFeeCents: number;
  membershipApplied: boolean;
  deliveryFeeCents: number;
  hstCents: number;
  totalCents: number;
  overLimit: boolean;
};

export function quote(input: {
  lines: QuoteLine[];
  passActive: boolean;
  inZone: boolean;
}): Quote {
  const subtotalCents = input.lines.reduce((sum, line) => sum + line.priceCents * line.qty, 0);
  const driedEquivalentMg = input.lines.reduce(
    (sum, line) => sum + line.driedEquivalentMg * line.qty,
    0,
  );
  const listDeliveryFeeCents = input.inZone ? SAMPLE_DELIVERY_FEE_CENTS : 0;
  const membershipApplied = input.passActive && input.inZone;
  const deliveryFeeCents = membershipApplied ? 0 : listDeliveryFeeCents;
  const taxCents = hstCents(subtotalCents + deliveryFeeCents);
  return {
    subtotalCents,
    driedEquivalentMg,
    listDeliveryFeeCents,
    membershipApplied,
    deliveryFeeCents,
    hstCents: taxCents,
    totalCents: subtotalCents + deliveryFeeCents + taxCents,
    overLimit: driedEquivalentMg > LIMIT_MG,
  };
}
