export const TRACKING_STAGES = [
  { id: "confirmed", label: "Confirmed", afterMs: 0 },
  { id: "preparing", label: "Preparing", afterMs: 3_000 },
  { id: "out_for_delivery", label: "Out for delivery", afterMs: 7_000 },
  { id: "nearby", label: "Nearby", afterMs: 16_000 },
  { id: "delivered", label: "Delivered", afterMs: 22_000 },
] as const;

export type StageId = (typeof TRACKING_STAGES)[number]["id"];

export const ROUTE = [
  { x: 46, y: 150 },
  { x: 46, y: 92 },
  { x: 156, y: 92 },
  { x: 156, y: 42 },
  { x: 274, y: 42 },
];

export function orderProgress(placedAt: number, now: number) {
  const elapsed = Math.max(0, now - placedAt);
  let index = 0;
  TRACKING_STAGES.forEach((stage, stageIndex) => {
    if (elapsed >= stage.afterMs) index = stageIndex;
  });
  const start = TRACKING_STAGES[2].afterMs;
  const end = TRACKING_STAGES[TRACKING_STAGES.length - 1].afterMs;
  let progress = 0;
  if (elapsed >= end) progress = 1;
  else if (elapsed > start) progress = (elapsed - start) / (end - start);
  return {
    elapsed,
    index,
    stage: TRACKING_STAGES[index],
    progress,
    delivered: index === TRACKING_STAGES.length - 1,
  };
}

export function pointAlong(progress: number): { x: number; y: number } {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < ROUTE.length - 1; i += 1) {
    const length = Math.hypot(ROUTE[i + 1].x - ROUTE[i].x, ROUTE[i + 1].y - ROUTE[i].y);
    lengths.push(length);
    total += length;
  }
  let remaining = Math.min(1, Math.max(0, progress)) * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] === 0 ? 0 : remaining / lengths[i];
      return {
        x: ROUTE[i].x + (ROUTE[i + 1].x - ROUTE[i].x) * t,
        y: ROUTE[i].y + (ROUTE[i + 1].y - ROUTE[i].y) * t,
      };
    }
    remaining -= lengths[i];
  }
  return ROUTE[ROUTE.length - 1];
}
