"use client";

import { useState } from "react";
import { formatDay } from "@/lib/dates";
import {
  formatCad,
  MEMBERSHIP_PRICE_CENTS,
  MEMBERSHIP_TAX_CENTS,
  MEMBERSHIP_TOTAL_CENTS,
  SAMPLE_DELIVERY_FEE_CENTS,
} from "@/lib/money";
import { useStore } from "@/lib/store";

export function MembershipScreen() {
  const { membership, passActive, joinPass, cancelPass, keepPass } = useStore();
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="stack">
      <p className="kicker">Delivery service</p>
      <h1>Delivery Pass</h1>
      <p>
        A monthly delivery membership. While it is active, the in-zone delivery fee on an order is $0.00. Cannabis
        prices stay the same.
      </p>

      <section className="card">
        <h2>Monthly price</h2>
        <dl className="totals">
          <div>
            <dt>Delivery Pass</dt>
            <dd className="num">{formatCad(MEMBERSHIP_PRICE_CENTS)}</dd>
          </div>
          <div>
            <dt>Ontario HST (13%)</dt>
            <dd className="num">{formatCad(MEMBERSHIP_TAX_CENTS)}</dd>
          </div>
          <div className="grand">
            <dt>Total per month</dt>
            <dd className="num">{formatCad(MEMBERSHIP_TOTAL_CENTS)}</dd>
          </div>
        </dl>
        <p className="fine">
          Sample in-zone delivery fee without a Pass: {formatCad(SAMPLE_DELIVERY_FEE_CENTS)} per order. Billed
          monthly until you cancel. Sample only — this prototype does not charge the card.
        </p>
      </section>

      <section className="card">
        <h2>What this is</h2>
        <ul className="plain">
          <li>A paid delivery service for addresses inside the delivery zone.</li>
          <li>No minimum order. The fee does not depend on how much cannabis is in the cart.</li>
          <li>No points, no free cannabis, no free accessories, and no contest.</li>
        </ul>
        <p className="fine">
          Draft wording for legal review: {formatCad(MEMBERSHIP_PRICE_CENTS)} plus HST is{" "}
          {formatCad(MEMBERSHIP_TOTAL_CENTS)} per month. It renews automatically each month until you cancel. You can
          cancel any time. If you cancel, you are not charged again, and the Pass stays active until the end of the
          paid month. It does not change cannabis prices.
        </p>
      </section>

      {passActive && membership ? (
        <section className="card">
          <p className="pill ok">{membership.cancelAtPeriodEnd ? "Cancels at period end" : "Active"}</p>
          <h2>{membership.cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDay(membership.currentPeriodEnd)}</h2>
          <p className="fine">Started {formatDay(membership.startedAt)}. Sample membership — no BlazePay charge was made.</p>
          {membership.cancelAtPeriodEnd ? (
            <button type="button" className="btn btn-primary btn-block" onClick={keepPass}>
              Keep Delivery Pass
            </button>
          ) : confirmCancel ? (
            <div className="stack">
              <p>Cancel at the end of this period? The Pass stays active until {formatDay(membership.currentPeriodEnd)}.</p>
              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={() => {
                  cancelPass();
                  setConfirmCancel(false);
                }}
              >
                Confirm cancel
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmCancel(false)}>
                Keep Delivery Pass
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmCancel(true)}>
              Cancel Delivery Pass
            </button>
          )}
        </section>
      ) : (
        <button type="button" className="btn btn-primary btn-block" onClick={joinPass}>
          Start Delivery Pass (sample) — {formatCad(MEMBERSHIP_TOTAL_CENTS)}/month
        </button>
      )}
    </div>
  );
}
