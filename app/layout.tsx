import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArticleForge Studio",
  description: "Plataforma editorial para gerar, editar e exportar artigos com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">{children}</body>
    </html>
  );
}
