"use client";

type ProgressStep = {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  detail?: string;
};

type ArticleProgressProps = {
  steps: ProgressStep[];
  currentPercent: number;
  error?: string | null;
};

function StepIcon({ status }: { status: ProgressStep["status"] }) {
  if (status === "completed") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900">
      <div className="h-2 w-2 rounded-full bg-zinc-600" />
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
      {percent > 0 && percent < 100 && (
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
          style={{ width: `${percent}%` }}
        >
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      )}
    </div>
  );
}

export function ArticleProgress({ steps, currentPercent, error }: ArticleProgressProps) {
  const activeStep = steps.find((s) => s.status === "active");
  const hasError = steps.some((s) => s.status === "error") || error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">
            {hasError ? "Erro na geração" : currentPercent >= 100 ? "Artigo pronto!" : "Gerando seu artigo..."}
          </h3>
          <span className={`text-sm font-mono font-medium ${hasError ? "text-rose-400" : "text-emerald-400"}`}>
            {currentPercent}%
          </span>
        </div>
        <ProgressBar percent={currentPercent} />
        {activeStep && (
          <p className="text-sm text-zinc-400 animate-pulse">{activeStep.detail || activeStep.description}</p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3 py-2">
            <StepIcon status={step.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    step.status === "completed"
                      ? "text-zinc-400"
                      : step.status === "active"
                        ? "text-zinc-100"
                        : step.status === "error"
                          ? "text-rose-400"
                          : "text-zinc-600"
                  }`}
                >
                  {step.label}
                </span>
                {step.status === "completed" && (
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">feito</span>
                )}
                {step.status === "active" && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                )}
              </div>
              {step.detail && step.status !== "pending" && (
                <p
                  className={`mt-0.5 text-xs ${
                    step.status === "error" ? "text-rose-400/80" : "text-zinc-500"
                  }`}
                >
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-800/50 bg-rose-950/50 p-4">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}
    </div>
  );
}

export function getStepsForPhase(
  phase: "creating" | "searching" | "generating" | "ready" | "error",
  sourceCount?: number,
  targetSourceCount?: number,
  progressDetail?: string,
): ProgressStep[] {
  const searchDetail = sourceCount && sourceCount > 0
    ? `${sourceCount}${targetSourceCount ? ` de ${targetSourceCount}` : ""} fontes encontradas`
    : undefined;

  // Determine which sub-step is active during "generating" phase
  let activeGenerateSubStep = "structure";
  if (progressDetail) {
    const detail = progressDetail.toLowerCase();
    if (detail.includes("secao") || detail.includes("section")) {
      activeGenerateSubStep = "sections";
    } else if (detail.includes("conclus") || detail.includes("faq") || detail.includes("closing")) {
      activeGenerateSubStep = "closing";
    } else if (detail.includes("format")) {
      activeGenerateSubStep = "format";
    }
  }

  const steps: ProgressStep[] = [
    {
      id: "create",
      label: "Criando projeto",
      description: "Salvando configuracoes do artigo no banco de dados",
      status: "pending",
    },
    {
      id: "search",
      label: "Pesquisando fontes",
      description: "Buscando referencias e dados relevantes na web",
      status: "pending",
      detail: searchDetail,
    },
    {
      id: "structure",
      label: "Criando estrutura",
      description: "Gerando titulo, outline e introducao com IA",
      status: "pending",
    },
    {
      id: "sections",
      label: "Escrevendo secoes",
      description: "A IA esta escrevendo cada secao do artigo (pode levar varios minutos)",
      status: "pending",
    },
    {
      id: "closing",
      label: "Gerando conclusao e FAQ",
      description: "Finalizando com conclusao, perguntas frequentes e fatos",
      status: "pending",
    },
    {
      id: "format",
      label: "Formatando artigo",
      description: "Convertendo para Markdown e preparando para visualizacao",
      status: "pending",
    },
  ];

  const phaseOrder = ["creating", "searching", "generating", "ready", "error"];
  const currentIndex = phaseOrder.indexOf(phase);

  return steps.map((step, i) => {
    let stepPhaseIndex: number;
    if (i === 0) stepPhaseIndex = 0;       // create
    else if (i === 1) stepPhaseIndex = 1;  // search
    else if (i <= 4) stepPhaseIndex = 2;   // structure, sections, closing
    else stepPhaseIndex = 3;               // format

    if (phase === "error") {
      if (currentIndex <= stepPhaseIndex) {
        return { ...step, status: currentIndex === stepPhaseIndex ? "error" : "pending" } as ProgressStep;
      }
    }

    if (stepPhaseIndex < currentIndex) {
      return { ...step, status: "completed" } as ProgressStep;
    }
    if (stepPhaseIndex === currentIndex) {
      if (phase === "ready") return { ...step, status: "completed" } as ProgressStep;
      if (phase === "error") return { ...step, status: "error" } as ProgressStep;

      // During "generating", only the matching sub-step should be active
      if (phase === "generating") {
        return { ...step, status: step.id === activeGenerateSubStep ? "active" : "pending" } as ProgressStep;
      }

      return { ...step, status: "active" } as ProgressStep;
    }
    return { ...step, status: "pending" } as ProgressStep;
  });
}

export function getPercentForPhase(phase: "creating" | "searching" | "generating" | "ready" | "error"): number {
  switch (phase) {
    case "creating":
      return 5;
    case "searching":
      return 25;
    case "generating":
      return 55;
    case "ready":
      return 100;
    case "error":
      return 100;
  }
}
