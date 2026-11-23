import type { Metadata } from "next";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { BottomNav } from "@/components/common/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tsunagu Generations — Connecting the Past to the Present",
  description:
    "An intergenerational community platform connecting older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Header />
        <main className="flex-1 focus:outline-none pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
