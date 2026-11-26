import type { EssayCompetencyAI, EssayFeedbackAI, EssayPart } from "../../contracts/essay";
import type {
  EssayFeedbackInput,
  EssayFeedbackModel,
  EssayFeedbackOptions,
  EssayFeedbackResult,
} from "./types";

export const FAKE_MODEL_KEY = "fake";

const SCORES = [80, 120, 160] as const;

/** Hash FNV-1a de 32 bits: determinístico, sem dependências. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Primeiro trecho literal curto (até 100 caracteres, sem cortar no meio de palavra quando dá). */
function literalSnippet(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= 100) return trimmed;
  const cut = trimmed.slice(0, 100);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
}

const ASSESSABLE: Record<EssayPart, readonly number[]> = {
  introduction: [1, 2, 3, 4],
  development: [1, 2, 3, 4],
  conclusion: [1, 4, 5],
};

const STRENGTH: Record<number, string> = {
  1: "Há trechos em que a escrita segue a norma formal com clareza.",
  2: "O texto mantém relação com o tema proposto.",
  3: "Há uma ideia central reconhecível para organizar a argumentação.",
  4: "Alguns elos entre as frases ajudam a leitura.",
  5: "A parte tenta apontar um caminho para o problema discutido.",
};

const IMPROVEMENT: Record<number, string> = {
  1: "Releia o texto procurando desvios de concordância, regência, pontuação e registro informal.",
  2: "Confira se o ponto de vista defendido cobre todo o recorte do tema, sem se afastar dele.",
  3: "Verifique se cada argumento está desenvolvido e ligado ao ponto de vista, sem informações soltas.",
  4: "Revise os conectivos e as retomadas: cada um deve expressar uma relação lógica clara.",
  5: "Confira se há ação, agente, meio, efeito e detalhamento, descritos com as suas palavras.",
};

/**
 * Modelo determinístico para dev, testes, e2e e CI: mesma entrada, mesma saída, sem rede e sem
 * chave. Sempre válido pelo schema e NUNCA reescreve o texto: só orienta, e `evidence` é um
 * trecho literal do próprio texto.
 */
export class FakeEssayModel implements EssayFeedbackModel {
  async generate(
    input: EssayFeedbackInput,
    opts: EssayFeedbackOptions = {},
  ): Promise<EssayFeedbackResult> {
    opts.signal?.throwIfAborted();
    const seed = hash(`${input.part}|${input.text}`);
    const snippet = literalSnippet(input.text);
    const assessableIds = ASSESSABLE[input.part];

    const competencies = [1, 2, 3, 4, 5].map((id): EssayCompetencyAI => {
      const assessable = assessableIds.includes(id);
      return {
        id,
        assessable,
        scoreEstimate: assessable ? SCORES[(seed + id) % SCORES.length] : null,
        strengths: assessable ? [STRENGTH[id]] : [],
        improvements: assessable ? [IMPROVEMENT[id]] : [],
        evidence: assessable && snippet && id === 1 ? [snippet] : [],
      };
    });

    const output: EssayFeedbackAI = {
      competencies,
      summary:
        "Retorno de demonstração (modelo fake, sem IA real). Releia sua parte com as orientações de cada competência e ajuste você mesmo o texto.",
    };
    return {
      output,
      usage: { inputTokens: Math.ceil(input.text.length / 4) + 600, outputTokens: 400 },
      modelKey: FAKE_MODEL_KEY,
      latencyMs: 0,
    };
  }
}
