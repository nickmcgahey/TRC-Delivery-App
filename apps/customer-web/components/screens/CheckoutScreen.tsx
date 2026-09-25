"use client";

import Link from "next/link";
import { getProduct, sampleName } from "@/lib/catalog";
import { formatGramsFromMg } from "@/lib/equivalency";
import { deliveryWindow } from "@/lib/hours";
import { formatCad } from "@/lib/money";
import { quote } from "@/lib/quote";
import { useStore } from "@/lib/store";
import { useNow } from "../useNow";
import { HoursBanner } from "../ui";

export function CheckoutScreen() {
  const { cart, address, passActive } = useStore();
  const now = useNow(15_000);
  const windowState = deliveryWindow(new Date(now));
  const detailed = cart.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    return [{ line, product }];
  });
  const priced = quote({
    lines: detailed.map(({ line, product }) => ({
      priceCents: product.priceCents,
      qty: line.qty,
      driedEquivalentMg: product.driedEquivalentMg,
    })),
    passActive,
    inZone: Boolean(address?.inZone),
  });

  if (detailed.length === 0) {
    return (
      <div className="stack">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse sample products
        </Link>
      </div>
    );
  }

  const reasons: string[] = [];
  if (priced.overLimit) reasons.push("This cart is over the 30 g dried-equivalent limit.");
  if (!address) reasons.push("Add a delivery address.");
  else if (!address.inZone) reasons.push("This address is outside the delivery zone.");
  if (!windowState.open) reasons.push("The delivery window is closed.");
  const canContinue = reasons.length === 0;

  return (
    <div className="stack">
      <p className="kicker">Sample checkout</p>
      <h1>Checkout</h1>
      <HoursBanner />

      <section className="card">
        <h2>Address</h2>
        {address ? (
          <>
            <p>
              {address.line1}, {address.city}, {address.province} {address.postal}
            </p>
            <p className={address.inZone ? "fine ok-text" : "fine bad-text"}>
              {address.inZone ? "Inside the sample delivery zone." : "Outside the sample delivery zone."}
            </p>
          </>
        ) : (
          <p>No address yet.</p>
        )}
        <Link href="/address" className="text-link">
          Change address
        </Link>
      </section>

      <section className={priced.membershipApplied ? "fee-card member" : "fee-card"}>
        <div className="row spread">
          <h2>Delivery</h2>
          <p className="num price-lg">{address?.inZone ? formatCad(priced.deliveryFeeCents) : "—"}</p>
        </div>
        {!address?.inZone ? (
          <p>No delivery fee is added, because this address is outside the sample zone.</p>
        ) : priced.membershipApplied ? (
          <>
            <p>Delivery fee included with your Delivery Pass.</p>
            <p className="fine">
              Sample in-zone fee without a Pass: {formatCad(priced.listDeliveryFeeCents)}. This line is set to $0.00
              for an active member.
            </p>
          </>
        ) : (
          <>
            <p>Sample per-delivery fee inside the zone.</p>
            <p className="fine">
              An active Delivery Pass sets this line to $0.00. The Pass is a separate monthly charge and is not a
              discount on cannabis.
            </p>
          </>
        )}
      </section>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd className="num">{formatCad(priced.subtotalCents)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd className="num">{formatCad(priced.deliveryFeeCents)}</dd>
        </div>
        <div>
          <dt>HST (13%)</dt>
          <dd className="num">{formatCad(priced.hstCents)}</dd>
        </div>
        <div className="grand">
          <dt>Total</dt>
          <dd className="num">{formatCad(priced.totalCents)}</dd>
        </div>
      </dl>
      <p className="fine">
        Dried equivalent {formatGramsFromMg(priced.driedEquivalentMg)} g of 30.00 g. Sample prices. HST in this
        prototype is 13% of the product subtotal plus the delivery fee.
      </p>

      <ul className="plain">
        {detailed.map(({ line, product }) => (
          <li key={product.id}>
            {sampleName(product.name)} × {line.qty}
            <span className="num"> {formatCad(product.priceCents * line.qty)}</span>
          </li>
        ))}
      </ul>

      {reasons.length > 0 && (
        <div className="notice bad" role="status">
          {reasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>
      )}

      {canContinue ? (
        <Link href="/checkout/pay" className="btn btn-primary btn-block">
          Continue to sample payment
        </Link>
      ) : (
        <button type="button" className="btn btn-primary btn-block" disabled>
          Sample payment unavailable
        </button>
      )}
      {!passActive && (
        <Link href="/membership" className="text-link">
          See Delivery Pass
        </Link>
      )}
    </div>
  );
}
