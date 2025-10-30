import "@/styles/globals.css";
import type { Metadata } from "next";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = {
  title: "AutoBench",
  description: "Daily LLM code benchmark with Supabase + Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
