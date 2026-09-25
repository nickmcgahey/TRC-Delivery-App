import { driedEquivalentMg } from "./equivalency";
import { hstCents, MEMBERSHIP_PRICE_CENTS } from "./money";
import type { CategoryId, Product, ProductForm } from "./types";

export const CATEGORIES: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "flower", label: "Flower" },
  { id: "pre-roll", label: "Pre-rolls" },
  { id: "vape", label: "Vapes" },
  { id: "edible", label: "Edibles" },
  { id: "beverage", label: "Beverages" },
];

type ProductInput = Omit<Product, "driedEquivalentMg">;

function withEquivalent(product: ProductInput): Product {
  return {
    ...product,
    driedEquivalentMg: driedEquivalentMg(product.form, product.amountMg),
  };
}

/**
 * Fictional catalog. Names, prices, and potency labels are sample data.
 * Dried equivalent uses the public possession table, not Breadstack.
 */
const RAW: ProductInput[] = [
  {
    id: "flower-north-field",
    name: "North Field Flower",
    category: "flower",
    cultivar: "Hybrid",
    form: "dried",
    amountMg: 3_500,
    netLabel: "3.5 g",
    equivalencyNote: "Dried flower counts gram for gram.",
    priceCents: 3200,
    summary: "Sample dried flower. 3.5 g net weight. Hybrid label.",
    samplePotency: "Sample label: 21% THC",
  },
  {
    id: "flower-ridge-line",
    name: "Ridge Line Flower",
    category: "flower",
    cultivar: "Indica",
    form: "dried",
    amountMg: 7_000,
    netLabel: "7 g",
    equivalencyNote: "Dried flower counts gram for gram.",
    priceCents: 5400,
    summary: "Sample dried flower. 7 g net weight. Indica label.",
    samplePotency: "Sample label: 19% THC",
  },
  {
    id: "flower-harbour",
    name: "Harbour Lot Flower",
    category: "flower",
    cultivar: "Sativa",
    form: "dried",
    amountMg: 14_000,
    netLabel: "14 g",
    equivalencyNote: "Dried flower counts gram for gram. Three bags are 42 g and block checkout.",
    priceCents: 9800,
    summary: "Sample dried flower. 14 g net weight. Sativa label.",
    samplePotency: "Sample label: 22% THC",
  },
  {
    id: "flower-creek-bed",
    name: "Creek Bed Flower",
    category: "flower",
    cultivar: "Hybrid",
    form: "dried",
    amountMg: 3_500,
    netLabel: "3.5 g",
    equivalencyNote: "Dried flower counts gram for gram.",
    priceCents: 2800,
    summary: "Sample dried flower. 3.5 g net weight. Hybrid label.",
    samplePotency: "Sample label: 17% THC",
  },
  {
    id: "preroll-trail",
    name: "Trail Marker Pre-Roll",
    category: "pre-roll",
    cultivar: "Hybrid",
    form: "dried",
    amountMg: 1_000,
    netLabel: "1 × 1 g",
    equivalencyNote: "Pre-roll contents are dried cannabis and count gram for gram.",
    priceCents: 1200,
    summary: "Sample pre-roll. 1 g dried cannabis. Hybrid label.",
    samplePotency: "Sample label: 18% THC",
  },
  {
    id: "preroll-five",
    name: "Five-Pack Pre-Rolls",
    category: "pre-roll",
    cultivar: "Indica",
    form: "dried",
    amountMg: 2_500,
    netLabel: "5 × 0.5 g",
    equivalencyNote: "2.5 g of dried cannabis in the pack.",
    priceCents: 2700,
    summary: "Sample pre-rolls. Five 0.5 g rolls, 2.5 g dried cannabis total. Indica label.",
    samplePotency: "Sample label: 20% THC",
  },
  {
    id: "vape-ridge",
    name: "Ridge Cart",
    category: "vape",
    cultivar: "Hybrid",
    form: "concentrate",
    amountMg: 500,
    netLabel: "0.5 g",
    equivalencyNote: "Concentrate: 0.25 g equals 1 g dried, so 0.5 g is 2.00 g dried equivalent.",
    priceCents: 3600,
    summary: "Sample vaporizer cartridge. 0.5 g concentrate. Hybrid label.",
    samplePotency: "Sample label: 80% THC",
  },
  {
    id: "vape-pier",
    name: "Pier Distillate Cart",
    category: "vape",
    cultivar: "Sativa",
    form: "concentrate",
    amountMg: 1_000,
    netLabel: "1 g",
    equivalencyNote: "Concentrate: 0.25 g equals 1 g dried, so 1 g is 4.00 g dried equivalent.",
    priceCents: 4800,
    summary: "Sample distillate cartridge. 1 g concentrate. Sativa label.",
    samplePotency: "Sample label: 85% THC",
  },
  {
    id: "edible-orchard",
    name: "Orchard Gummies",
    category: "edible",
    cultivar: "Blend",
    form: "edible",
    amountMg: 15_000,
    netLabel: "15 g",
    equivalencyNote: "Edible: 15 g equals 1 g dried.",
    priceCents: 1600,
    summary: "Sample edible gummies. 15 g net weight.",
    samplePotency: "Sample label: 10 mg THC total",
  },
  {
    id: "edible-maple",
    name: "Maple Square Chocolates",
    category: "edible",
    cultivar: "Blend",
    form: "edible",
    amountMg: 30_000,
    netLabel: "30 g",
    equivalencyNote: "Edible: 15 g equals 1 g dried, so 30 g is 2.00 g dried equivalent.",
    priceCents: 2200,
    summary: "Sample chocolate squares. 30 g net weight.",
    samplePotency: "Sample label: 10 mg THC total",
  },
  {
    id: "beverage-citrus",
    name: "Citrus Sparkling Beverage",
    category: "beverage",
    cultivar: "Blend",
    form: "liquid",
    amountMg: 355_000,
    netLabel: "355 ml",
    equivalencyNote:
      "Counted as 355 g of liquid product. 70 g of liquid equals 1 g dried, so this is about 5.07 g dried equivalent.",
    priceCents: 800,
    summary: "Sample sparkling beverage. 355 ml. No caffeine claim and no effect claim.",
    samplePotency: "Sample label: 5 mg THC total",
  },
  {
    id: "beverage-berry",
    name: "Berry Still Beverage",
    category: "beverage",
    cultivar: "Blend",
    form: "liquid",
    amountMg: 222_000,
    netLabel: "222 ml",
    equivalencyNote:
      "Counted as 222 g of liquid product. 70 g of liquid equals 1 g dried, so this is about 3.17 g dried equivalent.",
    priceCents: 700,
    summary: "Sample still beverage. 222 ml.",
    samplePotency: "Sample label: 2.5 mg THC total",
  },
];

export const PRODUCTS: Product[] = RAW.map(withEquivalent);

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function sampleName(name: string): string {
  return `Sample: ${name}`;
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function assertPrototypeInvariants(): void {
  const expectEq = (id: string, form: ProductForm, amountMg: number, dried: number) => {
    const product = getProduct(id);
    if (!product || product.driedEquivalentMg !== dried || driedEquivalentMg(form, amountMg) !== dried) {
      throw new Error(`Sample equivalency drifted for ${id}`);
    }
  };
  expectEq("flower-harbour", "dried", 14_000, 14_000);
  expectEq("vape-ridge", "concentrate", 500, 2_000);
  expectEq("edible-orchard", "edible", 15_000, 1_000);
  expectEq("beverage-citrus", "liquid", 355_000, 5_071);
  expectEq("beverage-berry", "liquid", 222_000, 3_171);
  if (hstCents(MEMBERSHIP_PRICE_CENTS) !== 104) {
    throw new Error("Delivery Pass HST drifted");
  }
}

assertPrototypeInvariants();
