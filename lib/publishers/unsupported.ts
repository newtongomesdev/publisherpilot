import type { PublisherConnector } from "@/lib/publishers/types";

export function createUnsupportedPublisher(name: string, label: string): PublisherConnector {
  return {
    name,
    label,
    async validateConfig() {
      return { ok: true };
    },
    async publish() {
      throw new Error(`${label} connector ainda nao foi implementado para publicacao.`);
    },
  };
}
