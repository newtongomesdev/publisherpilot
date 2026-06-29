import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PublisherPilot",
  description: "Plataforma editorial para gerar, editar e exportar artigos com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[#0a0a0b] text-zinc-50 antialiased selection:bg-emerald-500/30 font-[family-name:var(--font-inter)]">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0b] to-[#0a0a0b]"></div>
        {children}
      </body>
    </html>
  );
}
