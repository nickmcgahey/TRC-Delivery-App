import type { Metadata } from "next";
import { ProductScreen } from "@/components/screens/ProductScreen";

export const metadata: Metadata = { title: "Sample product" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductScreen id={id} />;
}
