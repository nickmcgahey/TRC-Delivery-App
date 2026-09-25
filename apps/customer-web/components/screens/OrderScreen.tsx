"use client";

import Link from "next/link";
import { formatWhen } from "@/lib/dates";
import { formatGramsFromMg } from "@/lib/equivalency";
import { formatCad } from "@/lib/money";
import { useStore } from "@/lib/store";
import { TrackingView } from "../TrackingView";
import { useNow } from "../useNow";

export function OrderScreen({ id }: { id: string }) {
  const { orders } = useStore();
  const now = useNow(1000);
  const order = orders.find((item) => item.id === id);

  if (!order) {
    return (
      <div className="stack">
        <h1>Order not in this browser</h1>
        <p className="fine">Sample orders stay in local storage on this device.</p>
        <Link href="/orders" className="btn btn-primary">
          Order history
        </Link>
      </div>
    );
  }

  const recent = now - order.placedAt < 15 * 60 * 1000;

  return (
    <div className="stack">
      {recent && (
        <section className="card confirm">
          <p className="kicker">Sample order confirmed</p>
          <h1>{order.id}</h1>
          <p>No payment was processed. This confirmation is stored only in this browser.</p>
        </section>
      )}
      {!recent && (
        <section>
          <p className="kicker">Sample order</p>
          <h1>{order.id}</h1>
        </section>
      )}
      <p className="fine">{formatWhen(order.placedAt)}</p>
      <p>{order.addressLabel}</p>
      <TrackingView placedAt={order.placedAt} />
      <section className="card">
        <h2>Receipt</h2>
        <ul className="plain">
          {order.lines.map((line) => (
            <li key={line.productId}>
              {line.name} × {line.qty}
              <span className="num"> {formatCad(line.unitPriceCents * line.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd className="num">{formatCad(order.subtotalCents)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd className="num">{formatCad(order.deliveryFeeCents)}</dd>
          </div>
          <div>
            <dt>HST</dt>
            <dd className="num">{formatCad(order.hstCents)}</dd>
          </div>
          <div className="grand">
            <dt>Total</dt>
            <dd className="num">{formatCad(order.totalCents)}</dd>
          </div>
        </dl>
        <p className="fine">
          {formatGramsFromMg(order.driedEquivalentMg)} g dried equivalent.
          {order.membershipApplied ? " Delivery fee included with Delivery Pass." : " Sample per-delivery fee."}
        </p>
      </section>
      <Link href="/orders" className="text-link">
        All sample orders
      </Link>
    </div>
  );
}
