import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopScreen } from "@/components/screens/ShopScreen";

export const metadata: Metadata = { title: "Shop" };

export default function Page() {
  return (
    <Suspense fallback={<p className="fine">Loading the sample catalog…</p>}>
      <ShopScreen />
    </Suspense>
  );
}
