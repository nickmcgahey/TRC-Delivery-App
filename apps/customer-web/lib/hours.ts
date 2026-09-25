export type DeliveryWindow = {
  open: boolean;
  clock: string;
  headline: string;
  detail: string;
};

export function deliveryWindow(now = new Date()): DeliveryWindow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  let hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + minute;
  const open = minutes >= 9 * 60 && minutes < 23 * 60;
  const clock = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return {
    open,
    clock,
    headline: open ? "Delivery window open" : "Delivery window closed",
    detail: open
      ? `Orders are accepted from 9:00 a.m. to 11:00 p.m. Eastern, and only while the store is open. Toronto time now: ${clock}.`
      : `Checkout is paused. Delivery orders are accepted from 9:00 a.m. to 11:00 p.m. Eastern, while the store is open. Toronto time now: ${clock}.`,
  };
}
