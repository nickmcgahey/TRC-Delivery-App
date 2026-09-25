"use client";

import { useState } from "react";
import { orderProgress, pointAlong, ROUTE, TRACKING_STAGES } from "@/lib/tracking";
import { useNow } from "./useNow";

export function TrackingView({ placedAt }: { placedAt: number }) {
  const now = useNow(200);
  const [replayAt, setReplayAt] = useState<number | null>(null);
  const progress = orderProgress(replayAt ?? placedAt, now);
  const point = pointAlong(progress.progress);
  const path = ROUTE.map((stop, index) => `${index === 0 ? "M" : "L"}${stop.x} ${stop.y}`).join(" ");

  return (
    <div className="stack">
      <p className="status-now" role="status">
        {progress.stage.label}
      </p>
      <ol className="timeline">
        {TRACKING_STAGES.map((stage, index) => {
          const state = index < progress.index ? "done" : index === progress.index ? "now" : "wait";
          return (
            <li key={stage.id} className={state}>
              <span className="dot" aria-hidden="true" />
              <span>{stage.label}</span>
            </li>
          );
        })}
      </ol>
      <div className="map-wrap">
        <svg viewBox="0 0 320 190" role="img" aria-label="Map placeholder with a simulated driver position">
          <rect width="320" height="190" rx="18" fill="#e3eee4" />
          <rect x="16" y="22" width="72" height="46" rx="6" fill="#efe6d4" />
          <rect x="104" y="22" width="64" height="46" rx="6" fill="#efe6d4" />
          <rect x="186" y="64" width="104" height="46" rx="6" fill="#efe6d4" />
          <rect x="70" y="112" width="96" height="42" rx="6" fill="#efe6d4" />
          <path d={path} fill="none" stroke="#d9cfc0" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={ROUTE[0].x} cy={ROUTE[0].y} r="4.5" fill="#8a4b32" />
          <circle cx={ROUTE[ROUTE.length - 1].x} cy={ROUTE[ROUTE.length - 1].y} r="4.5" fill="#24382c" />
          <text x={ROUTE[0].x} y="176" textAnchor="middle" fontSize="11" fill="#4a433b">
            Store
          </text>
          <text x={ROUTE[ROUTE.length - 1].x} y="30" textAnchor="middle" fontSize="11" fill="#4a433b">
            Door
          </text>
          <circle cx={point.x} cy={point.y} r="8" fill="#24382c" stroke="#f4efe6" strokeWidth="3" />
        </svg>
        <p className="fine">Map placeholder. The driver marker moves on a timer. This is not live GPS.</p>
      </div>
      {progress.delivered && (
        <p className="fine">
          Sample delivery complete. At a real door, staff check identification if the recipient appears under 25.
        </p>
      )}
      <button type="button" className="btn btn-ghost" onClick={() => setReplayAt(Date.now())}>
        Replay simulated trip
      </button>
    </div>
  );
}
