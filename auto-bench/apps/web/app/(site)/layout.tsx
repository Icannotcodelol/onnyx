"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {children}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
