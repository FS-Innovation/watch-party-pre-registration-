import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Behind The Diary — Private Screening",
  description: "Find your people. Watch together. Actually connect.",
  openGraph: {
    title: "Behind The Diary — Private Screening",
    description: "Find your people. Watch together. Actually connect.",
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
