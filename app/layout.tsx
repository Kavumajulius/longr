import type { Metadata } from "next";
import "./globals.css";
import "./onboarding.css";
import "./auth.css";
/* eslint-disable @next/next/no-page-custom-font */

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "LONGR - Your Daily Longevity Feed",
  description:
    "Food-first longevity guidance for choosing, preparing, pairing, and timing everyday foods.",
  openGraph: {
    title: "LONGR - Your Daily Longevity Feed",
    description:
      "Food-first longevity guidance for choosing, preparing, pairing, and timing everyday foods.",
    type: "website",
    images: [{ url: "/og.png", width: 1735, height: 907, alt: "LONGR - Your Daily Longevity Feed" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LONGR - Your Daily Longevity Feed",
    description:
      "Food-first longevity guidance for choosing, preparing, pairing, and timing everyday foods.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
