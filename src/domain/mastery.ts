/**
 * Regra de domínio do mini-simulado (RN-007). Pura: sem I/O, sem relógio.
 * Os valores de `total` e `thresholdPct` vêm de `app_config` e do banco, nunca fixos aqui.
 */

export type MasteryInput = {
  correct: number;
  total: number;
  thresholdPct: number;
};

export type MasteryEvaluation = MasteryInput & { passed: boolean };

/** Passa quando `correct * 100 / total >= thresholdPct`. `total` <= 0 nunca passa. */
export function evaluateMastery({ correct, total, thresholdPct }: MasteryInput): MasteryEvaluation {
  if (!Number.isFinite(total) || total <= 0) {
    return { correct, total, thresholdPct, passed: false };
  }
  // Multiplicação em vez de divisão: sem erro de ponto flutuante (ex.: 4*100 >= 80*5).
  const passed = correct * 100 >= thresholdPct * total;
  return { correct, total, thresholdPct, passed };
}
