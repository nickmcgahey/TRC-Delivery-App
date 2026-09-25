"use client";

import { LIMIT_MG, formatGramsFromMg } from "@/lib/equivalency";
import { deliveryWindow } from "@/lib/hours";
import { useNow } from "./useNow";

export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="M24 11.5v16.5M24 28c0 5-7 7.5-10 11M24 28c0 5 8 7 11.5 10.5M24 18.5C18 18.5 14 14 11.5 12M24 18.5C30 18.5 34.5 13.5 37.5 12"
        fill="none"
        stroke="#f4efe6"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RetailSeal({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "seal compact" : "seal"} aria-label="Ontario retail seal placeholder">
      <div className="seal-badge" aria-hidden="true">
        <span>Seal</span>
        <strong>ON</strong>
      </div>
      <div>
        <p className="kicker">Ontario cannabis retail seal</p>
        <p className="seal-title">Placeholder</p>
        {!compact && (
          <p className="fine">
            The official seal is not shown here. Licence details below are placeholders and are not a real CRSA
            display.
          </p>
        )}
      </div>
    </section>
  );
}

export function LicenceFacts() {
  return (
    <dl className="facts">
      <div>
        <dt>Retailer</dt>
        <dd>Twisted Roots Cannabis</dd>
      </div>
      <div>
        <dt>Store</dt>
        <dd>Oshawa, Ontario — address placeholder</dd>
      </div>
      <div>
        <dt>CRSA licence</dt>
        <dd>Placeholder — not a real number</dd>
      </div>
      <div>
        <dt>Licensed name</dt>
        <dd>Placeholder</dd>
      </div>
    </dl>
  );
}

export function HoursBanner() {
  const now = useNow(30_000);
  const windowState = deliveryWindow(new Date(now));
  return (
    <div className={windowState.open ? "hours open" : "hours closed"} role="status">
      <p className="hours-title">{windowState.headline}</p>
      <p>{windowState.detail}</p>
    </div>
  );
}

export function GramMeter({ mg }: { mg: number }) {
  const over = mg > LIMIT_MG;
  const ratio = Math.min(1, mg / LIMIT_MG);
  const warn = !over && mg >= LIMIT_MG * 0.8;
  const tone = over ? "over" : warn ? "warn" : "ok";
  return (
    <section className={`meter-block ${tone}`}>
      <div className="row spread">
        <h2>Dried equivalent</h2>
        <p className="num">
          {formatGramsFromMg(mg)} g <span className="fine">/ 30.00 g</span>
        </p>
      </div>
      <div
        className="meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={30}
        aria-valuenow={Number((mg / 1000).toFixed(2))}
        aria-valuetext={`${formatGramsFromMg(mg)} grams of 30 grams dried equivalent${over ? ", over the limit, checkout blocked" : ""}`}
      >
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
      {over ? (
        <p className="block-copy">
          Checkout is blocked. This order is {formatGramsFromMg(mg)} g dried equivalent. The public possession
          limit is 30.00 g. Remove items to continue.
        </p>
      ) : (
        <p className="fine">{formatGramsFromMg(LIMIT_MG - mg)} g remaining in this order.</p>
      )}
    </section>
  );
}
