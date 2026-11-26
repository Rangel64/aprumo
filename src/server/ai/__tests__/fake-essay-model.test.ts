import { describe, expect, it } from "vitest";
import { EssayFeedbackAISchema, ESSAY_PARTS } from "../../../contracts/essay";
import { FakeEssayModel } from "../fake-essay-model";
import type { EssayFeedbackInput } from "../types";

const topic = { title: "Tema de teste", motivatingText: "Texto motivador de teste." };
const longText =
  "Este é um parágrafo fictício do Aluno Demo, escrito só para testar o modelo fake. ".repeat(4);

describe("FakeEssayModel", () => {
  it("é determinístico: mesma entrada, mesma saída", async () => {
    const model = new FakeEssayModel();
    const input: EssayFeedbackInput = { topic, part: "development", text: longText };
    const a = await model.generate(input);
    const b = await model.generate(input);
    expect(a).toEqual(b);
  });

  it("entradas diferentes podem variar a nota, mas sempre válidas pelo schema", async () => {
    const model = new FakeEssayModel();
    for (const part of ESSAY_PARTS) {
      for (const text of ["", "curto", longText, `${longText} outra coisa`]) {
        const { output, modelKey } = await model.generate({ topic, part, text });
        expect(EssayFeedbackAISchema.safeParse(output).success).toBe(true);
        expect(modelKey).toBe("fake");
      }
    }
  });

  it("nunca reescreve: evidence é trecho literal e curto do texto do aluno", async () => {
    const model = new FakeEssayModel();
    const { output } = await model.generate({ topic, part: "introduction", text: longText });
    const evidence = output.competencies.flatMap((c) => c.evidence);
    expect(evidence.length).toBeGreaterThan(0);
    for (const e of evidence) {
      expect(longText.includes(e)).toBe(true);
      expect(e.length).toBeLessThanOrEqual(120);
    }
    // Nenhum item de orientação repete uma frase inteira do aluno.
    const guidance = output.competencies.flatMap((c) => [...c.strengths, ...c.improvements]);
    for (const g of guidance) expect(longText.includes(g)).toBe(false);
  });

  it("C5 só é avaliável na conclusão", async () => {
    const model = new FakeEssayModel();
    const intro = await model.generate({ topic, part: "introduction", text: longText });
    const concl = await model.generate({ topic, part: "conclusion", text: longText });
    expect(intro.output.competencies[4].assessable).toBe(false);
    expect(intro.output.competencies[4].scoreEstimate).toBeNull();
    expect(concl.output.competencies[4].assessable).toBe(true);
  });

  it("respeita o signal já cancelado", async () => {
    const model = new FakeEssayModel();
    const controller = new AbortController();
    controller.abort();
    await expect(
      model.generate({ topic, part: "development", text: longText }, { signal: controller.signal }),
    ).rejects.toThrow();
  });
});
