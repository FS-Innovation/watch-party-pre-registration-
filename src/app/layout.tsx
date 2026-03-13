import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOAC Watch Party — Private Screening",
  description: "An exclusive screening for people who show up.",
  openGraph: {
    title: "DOAC Watch Party — Private Screening",
    description: "An exclusive screening for people who show up.",
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
