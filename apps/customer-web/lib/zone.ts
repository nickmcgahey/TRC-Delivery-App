/** Sample Oshawa FSAs. Not a live geofence. */
export const SAMPLE_ZONE_FSAS = ["L1G", "L1H", "L1J", "L1K", "L1L"] as const;

export type ZoneCheck = {
  ok: boolean;
  inZone: boolean;
  message: string;
};

export function normalizePostal(postal: string): string {
  return postal.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPostal(postal: string): string {
  const compact = normalizePostal(postal);
  if (compact.length !== 6) return postal.trim().toUpperCase();
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function checkZone(input: { line1: string; city: string; postal: string }): ZoneCheck {
  const line1 = input.line1.trim();
  const city = input.city.trim();
  const postal = normalizePostal(input.postal);
  if (line1.length < 4 || city.length < 3 || !/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)) {
    return {
      ok: false,
      inZone: false,
      message:
        "Enter a street, a city, and a Canadian postal code. This check is sample data, not a live map.",
    };
  }

  const fsa = postal.slice(0, 3);
  const inZone = city.toLowerCase() === "oshawa" && SAMPLE_ZONE_FSAS.includes(fsa as (typeof SAMPLE_ZONE_FSAS)[number]);
  if (inZone) {
    return {
      ok: true,
      inZone: true,
      message: `In the sample Oshawa zone (${fsa}). A Delivery Pass covers the delivery fee here. It does not extend the zone.`,
    };
  }
  return {
    ok: true,
    inZone: false,
    message:
      "Outside the sample delivery zone. This prototype delivers only to sample Oshawa postal codes L1G, L1H, L1J, L1K, and L1L.",
  };
}
