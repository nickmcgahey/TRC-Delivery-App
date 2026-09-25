import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Twisted Roots",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <noscript>
        <p className="noscript">The sample shop needs JavaScript after you pass the preview gate.</p>
      </noscript>
    </Providers>
  );
}
