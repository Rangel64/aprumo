import { describe, expect, it } from "vitest";
import {
  MSG,
  addDays,
  buildCreateInput,
  daysRemaining,
  fieldFromActionError,
  formatDeadline,
  minDeadline,
  minDeadlineAt,
  parseSlugList,
  remainingLabel,
  resolvePreselect,
  validateForm,
  validateFormAt,
  type Catalog,
  type FormValues,
} from "../journey-model";

// "Hoje" fixo e distante: nada depende do relógio.
const TODAY = "2099-01-10";

const catalog: Catalog = {
  trails: [{ id: "t1", slug: "enem-redacao", name: "ENEM: Redação", objective: "Obj" }],
  contents: [
    { id: "c1", slug: "tese", title: "Tese" },
    { id: "c2", slug: "coesao", title: "Coesão" },
    { id: "c3", slug: "proposta", title: "Proposta" },
  ],
};

const valid: FormValues = {
  baseType: "contents",
  trailId: null,
  contentIds: ["c1"],
  goal: "Escrever bem",
  deadline: "2099-01-11",
};

describe("parseSlugList", () => {
  it("separa por vírgula, remove repetidos e descarta formato inválido", () => {
    expect(parseSlugList("tese,coesao,tese, ,../x,A_B,proposta-final")).toEqual([
      "tese",
      "coesao",
      "proposta-final",
    ]);
  });
  it("aceita ausente e valor repetido (array)", () => {
    expect(parseSlugList(undefined)).toEqual([]);
    expect(parseSlugList(["tese", "coesao"])).toEqual(["tese", "coesao"]);
  });
});

describe("resolvePreselect", () => {
  it("trilha válida define a base Trilha", () => {
    expect(resolvePreselect(catalog, { trilha: "enem-redacao" })).toEqual({
      baseType: "trail",
      trailId: "t1",
      contentIds: [],
    });
  });
  it("conteúdos válidos definem a base Conteúdos e ignoram slugs desconhecidos", () => {
    expect(resolvePreselect(catalog, { conteudos: "coesao,nao-existe,tese" })).toEqual({
      baseType: "contents",
      trailId: "t1",
      contentIds: ["c1", "c2"], // ordem do catálogo, não da URL
    });
  });
  it("tudo inválido cai na Trilha padrão; sem Trilha, em conteúdos vazios", () => {
    expect(resolvePreselect(catalog, { trilha: "xx", conteudos: "yy" })).toEqual({
      baseType: "trail",
      trailId: "t1",
      contentIds: [],
    });
    expect(resolvePreselect({ trails: [], contents: catalog.contents }, {})).toEqual({
      baseType: "contents",
      trailId: null,
      contentIds: [],
    });
  });
});

describe("datas", () => {
  it("minDeadline é amanhã, com virada de mês e ano", () => {
    expect(minDeadline(TODAY)).toBe("2099-01-11");
    expect(addDays("2099-12-31", 1)).toBe("2100-01-01");
    expect(addDays("2096-02-28", 1)).toBe("2096-02-29"); // bissexto
  });
  it("formatDeadline mostra dd/mm/aaaa", () => {
    expect(formatDeadline("2099-12-31")).toBe("31/12/2099");
    expect(formatDeadline("lixo")).toBe("lixo");
  });
  it("daysRemaining e rótulos", () => {
    expect(daysRemaining("2099-01-20", TODAY)).toBe(10); // 20 - 10
    expect(daysRemaining("2099-01-10", TODAY)).toBe(0);
    expect(daysRemaining("2099-01-08", TODAY)).toBe(-2);
    expect(daysRemaining("x", TODAY)).toBeNull();
    expect(remainingLabel(10)).toBe("faltam 10 dias");
    expect(remainingLabel(1)).toBe("falta 1 dia");
    expect(remainingLabel(0)).toBe("vence hoje");
    expect(remainingLabel(-1)).toBe("prazo vencido há 1 dia");
    expect(remainingLabel(-2)).toBe("prazo vencido há 2 dias");
    expect(remainingLabel(null)).toBe("");
  });
});

describe("validateForm (RN-002)", () => {
  it("formulário válido não tem erros", () => {
    expect(validateForm(valid, TODAY)).toEqual({});
  });
  it("sem meta e sem prazo: mensagem em cada campo", () => {
    expect(validateForm({ ...valid, goal: "  ", deadline: "" }, TODAY)).toEqual({
      goal: MSG.goalRequired,
      deadline: MSG.deadlineRequired,
    });
  });
  it("meta: limites 3 e 200 (com trim)", () => {
    expect(validateForm({ ...valid, goal: " ab " }, TODAY).goal).toBe(MSG.goalShort);
    expect(validateForm({ ...valid, goal: "abc" }, TODAY).goal).toBeUndefined();
    expect(validateForm({ ...valid, goal: "a".repeat(200) }, TODAY).goal).toBeUndefined();
    expect(validateForm({ ...valid, goal: "a".repeat(201) }, TODAY).goal).toBe(MSG.goalLong);
  });
  it("prazo: hoje e passado rejeitados, amanhã aceito, data inexistente inválida", () => {
    expect(validateForm({ ...valid, deadline: TODAY }, TODAY).deadline).toBe(MSG.deadlinePast);
    expect(validateForm({ ...valid, deadline: "2098-12-31" }, TODAY).deadline).toBe(
      MSG.deadlinePast,
    );
    expect(validateForm({ ...valid, deadline: "2099-01-11" }, TODAY).deadline).toBeUndefined();
    expect(validateForm({ ...valid, deadline: "2099-02-30" }, TODAY).deadline).toBe(
      MSG.deadlineInvalid,
    );
  });
  it("base: Trilha exige trailId; Conteúdos exige ao menos 1", () => {
    expect(validateForm({ ...valid, baseType: "trail", trailId: null }, TODAY).base).toBe(
      MSG.baseTrail,
    );
    expect(validateForm({ ...valid, baseType: "trail", trailId: "t1" }, TODAY)).toEqual({});
    expect(validateForm({ ...valid, contentIds: [] }, TODAY).base).toBe(MSG.baseContents);
  });
});

describe("buildCreateInput e fieldFromActionError", () => {
  it("monta a entrada da action com meta aparada e metodologia none", () => {
    expect(buildCreateInput({ ...valid, goal: "  Meta  " })).toEqual({
      base: { type: "contents", contentIds: ["c1"] },
      goalDescription: "Meta",
      deadline: "2099-01-11",
      methodology: "none",
    });
    expect(buildCreateInput({ ...valid, baseType: "trail", trailId: "t1" }).base).toEqual({
      type: "trail",
      trailId: "t1",
    });
  });
  it("mapeia o campo do erro da action", () => {
    expect(fieldFromActionError("goalDescription")).toBe("goal");
    expect(fieldFromActionError("deadline")).toBe("deadline");
    expect(fieldFromActionError("base.contentIds")).toBe("base");
    expect(fieldFromActionError("base")).toBe("base");
    expect(fieldFromActionError("outro")).toBeNull();
    expect(fieldFromActionError(undefined)).toBeNull();
  });
});

describe("validateFormAt / minDeadlineAt (hoje recalculado por instante)", () => {
  const v: FormValues = {
    baseType: "contents",
    trailId: null,
    contentIds: ["c1"],
    goal: "Minha meta",
    deadline: "2099-03-11",
  };
  // 2099-03-11T01:00Z = 2099-03-10 22:00 em Brasília (UTC-3): hoje é 10, amanhã é 11 (válido).
  const before = new Date("2099-03-11T01:00:00Z");
  // 2099-03-11T03:00Z = 2099-03-11 00:00 em Brasília: hoje é 11, prazo 11 deixa de valer.
  const after = new Date("2099-03-11T03:00:00Z");

  it("usa o dia de Brasília do instante informado", () => {
    expect(minDeadlineAt(before)).toBe("2099-03-11");
    expect(minDeadlineAt(after)).toBe("2099-03-12");
  });

  it("o mesmo prazo vale antes da meia-noite e é rejeitado depois", () => {
    expect(validateFormAt(v, before)).toEqual({});
    expect(validateFormAt(v, after).deadline).toBe(MSG.deadlinePast);
  });
});
