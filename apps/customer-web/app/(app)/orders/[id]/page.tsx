import type { Metadata } from "next";
import { OrderScreen } from "@/components/screens/OrderScreen";

export const metadata: Metadata = { title: "Order" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderScreen id={id} />;
}
