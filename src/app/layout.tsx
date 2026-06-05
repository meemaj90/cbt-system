import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nextora Academy CBT",
  description: "Computer-Based Testing System for Nextora Academy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
