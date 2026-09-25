"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getProduct } from "@/lib/catalog";
import { deliveryWindow } from "@/lib/hours";
import { formatCad } from "@/lib/money";
import { quote } from "@/lib/quote";
import { useStore } from "@/lib/store";
import { useNow } from "../useNow";

export function PaymentScreen() {
  const router = useRouter();
  const { cart, address, passActive, placeOrder } = useStore();
  const now = useNow(15_000);
  const windowState = deliveryWindow(new Date(now));
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const lines = cart.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    return [{ priceCents: product.priceCents, qty: line.qty, driedEquivalentMg: product.driedEquivalentMg }];
  });
  const priced = quote({
    lines,
    passActive,
    inZone: Boolean(address?.inZone),
  });
  const blocked =
    lines.length === 0 || priced.overLimit || !address?.inZone || !windowState.open || placing;

  return (
    <div className="stack">
      <Link href="/checkout" className="back">
        Checkout
      </Link>
      <p className="kicker">BlazePay · sample</p>
      <h1>Sample payment</h1>
      <section className="pay-panel">
        <p>No card number is collected. This step does not contact BlazePay and does not charge anything.</p>
        <p className="price-lg num">{formatCad(priced.totalCents)}</p>
        <p className="fine">
          Delivery on this sample order: {formatCad(priced.deliveryFeeCents)}
          {priced.membershipApplied ? " · Delivery Pass" : ""}.
        </p>
      </section>
      {!windowState.open && <p className="notice bad">{windowState.detail}</p>}
      {priced.overLimit && <p className="notice bad">Checkout is blocked because the cart is over 30 g.</p>}
      {!address?.inZone && lines.length > 0 && (
        <p className="notice bad">An in-zone address is required before the sample payment.</p>
      )}
      {error && <p className="notice bad">{error}</p>}
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={blocked}
        onClick={() => {
          setPlacing(true);
          const id = placeOrder();
          if (!id) {
            setPlacing(false);
            setError("The sample order could not be placed. Check the limit, the address, and the delivery window.");
            return;
          }
          router.push(`/orders/${id}`);
        }}
      >
        Confirm sample payment
      </button>
    </div>
  );
}
