import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Behind The Diary — Private Screening",
  description: "A private screening experience.",
  openGraph: {
    title: "Behind The Diary — Private Screening",
    description: "A private screening experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">{children}</body>
    </html>
  );
}
