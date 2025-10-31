"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
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
