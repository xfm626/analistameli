import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analista MeLI",
  description: "Analista MeLI - Scraping y análisis de listados.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="bg-slateBg text-slate-900 dark:bg-slate-950 dark:text-slate-50">{children}</body>
    </html>
  );
}
