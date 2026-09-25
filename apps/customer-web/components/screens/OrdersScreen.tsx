"use client";

import Link from "next/link";
import { formatWhen } from "@/lib/dates";
import { formatCad } from "@/lib/money";
import { useStore } from "@/lib/store";
import { orderProgress } from "@/lib/tracking";
import { useNow } from "../useNow";

export function OrdersScreen() {
  const { orders } = useStore();
  const now = useNow(1000);

  return (
    <div className="stack">
      <h1>Orders</h1>
      <p className="fine">Sample history stored in this browser only.</p>
      <ul className="order-list">
        {orders.map((order) => {
          const progress = orderProgress(order.placedAt, now);
          return (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`}>
                <span>
                  <strong>{order.id}</strong>
                  <span className="fine">{formatWhen(order.placedAt)}</span>
                </span>
                <span>
                  <span className="pill">{progress.stage.label}</span>
                  <span className="num">{formatCad(order.totalCents)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
