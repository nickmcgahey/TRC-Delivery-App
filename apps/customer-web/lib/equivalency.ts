import type { ProductForm } from "./types";

/**
 * Grams of each form that equal 1 g dried cannabis.
 * Public possession table from the delivery plan (Appendix B).
 * Seeds are count-based (1 seed = 1 g dried) and are not in the sample catalog.
 */
export const GRAMS_EQUAL_TO_ONE_DRIED_GRAM: Record<ProductForm, number> = {
  dried: 1,
  fresh: 5,
  edible: 15,
  liquid: 70,
  concentrate: 0.25,
};

export const LIMIT_MG = 30_000;

export function driedEquivalentMg(form: ProductForm, amountMg: number): number {
  const factor = GRAMS_EQUAL_TO_ONE_DRIED_GRAM[form];
  return Math.round(amountMg / factor);
}

export function formatGramsFromMg(mg: number): string {
  const grams = Math.round(mg / 10) / 100;
  return grams.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formLabel(form: ProductForm): string {
  switch (form) {
    case "dried":
      return "Dried cannabis";
    case "fresh":
      return "Fresh cannabis";
    case "edible":
      return "Edible";
    case "liquid":
      return "Liquid product";
    case "concentrate":
      return "Concentrate";
  }
}
