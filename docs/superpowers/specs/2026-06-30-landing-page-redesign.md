# Spec: Landing Page Redesign - PublisherPilot

**Date:** 2026-06-30
**Topic:** Redesign da landing page para um estilo "Dark Analytical Canvas" focado em SaaS Moderno.
**Status:** Design Validado pelo Usuário.

## 1. Visão Geral
Transformar a landing page atual em uma experiência de "Página Longa" (Long-form Landing Page) que comunica autoridade técnica, precisão editorial e o poder da IA baseada em fatos reais.

## 2. Filosofia de Design: "Dark Analytical Canvas"
- **Atmosfera:** Um espaço de trabalho técnico, limpo e escuro.
- **Paleta de Cores:**
  - Base: `zinc-950` (#09090b)
  - Bordas/Grids: `zinc-900/50`
  - Acento 1 (Primário): `emerald-500` (Pesquisa/Validação)
  - Acento 2 (Secundário): `amber-500` (Geração/Criatividade)
- **Visual:** Grid técnico de fundo, iluminação radial suave (glow), tipografia sans-serif moderna.

## 3. Estrutura da Página

### Seção 1: Hero (O Impacto Inicial)
- **Fundo:** Padrão de grid técnico sutil + Glow centralizado Emerald/Amber.
- **Badge:** Tag flutuante "[ Pesquisa via SearXNG Ativa ]" com pulso de luz verde.
- **Headline:** "PublisherPilot" com gradiente branco para zinc-400.
- **Sub-headline:** Foco em "Arquitetura editorial baseada em evidências".
- **CTA:** Botão primário Emerald-500 com glow pulsante.

### Seção 2: O Fluxo da Verdade (Processo Editorial)
Diagrama técnico animado usando `framer-motion` para mostrar o caminho do dado:
1. **Descoberta:** Radar técnico escaneando o grid (SearXNG). Texto sobre fatos reais vs alucinações.
2. **Memória Semântica:** Representação de cubo de dados (ChromaDB). Texto sobre contexto permanente.
3. **Síntese:** Texto emergindo de luz âmbar (IA). Texto sobre escrita com autoridade.

### Seção 3: Multimodal Stack (Features)
Grid de cards técnicos minimalistas:
- **Audio Studio:** Ícone de onda sonora, foco em TTS.
- **Visual Engine:** Ícone de camadas/slides, foco em Carrosséis.
- **Distribuição:** Ícone de terminal/setas, foco em exportação.

### Seção 4: Call to Action Final
- Fundo com backlight Amber profundo.
- Headline: "Assuma o controle do seu fluxo editorial."
- Botão "Acessar Plataforma" proeminente.

## 4. Requisitos Técnicos
- **Framework:** Next.js (App Router).
- **Estilização:** Tailwind CSS.
- **Animações:** Framer Motion (para scroll-reveals e fluxos).
- **Ícones:** Lucide React (estilo fino/wireframe).
- **Tipografia:** Sans-serif padrão do sistema ou Geist (se disponível).

## 5. Assets & Imagens
- Não serão usados mockups de interface.
- Gráficos gerados via CSS/Framer Motion ou ícones técnicos.
- Background Gradients: Radiais suaves com alta difusão (blur-3xl).

## 6. Próximos Passos
1. Implementar estrutura de layout em `app/page.tsx`.
2. Criar componentes de seção (Hero, Flow, Features, CTA).
3. Aplicar animações de scroll.
