import { Hero } from "@/components/landing/hero";
import { FlowSection } from "@/components/landing/flow-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { FinalCTA } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <main className="bg-zinc-950 min-h-screen selection:bg-emerald-500/30">
      <Hero />
      <FlowSection />
      <FeaturesGrid />
      <FinalCTA />

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-xs text-zinc-600">
          <span className="font-mono tracking-wider">PublisherPilot</span>
          <span className="text-zinc-700">© 2026 — Todos os direitos reservados</span>
        </div>
      </footer>
    </main>
  );
}
