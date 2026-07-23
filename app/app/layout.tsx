import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "OutreachPro — Cold Email Automation",
  description:
    "Professional cold email outreach automation platform. Upload leads, connect senders, build sequences, and track results.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", inter.variable)}>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
