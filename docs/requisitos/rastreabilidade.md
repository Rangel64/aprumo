# Matriz de rastreabilidade

Projeto sem código. Status inicial: planejado. Coluna Fase: H = hackathon (vigente); pós = pós-hackathon. Componente/arquivo e teste serão preenchidos pelos especialistas na implementação.

| US | Fase | UC | RF | Componente/arquivo | Teste | Status |
|---|---|---|---|---|---|---|
| US-001 | H | UC-001 | RF-001 (RNF-024) | - | - | planejado |
| US-002 | H | UC-001 | RF-002 (Google pós, D-028) | - | - | planejado |
| US-003 | pós | UC-001 | RF-003 | - | - | planejado |
| US-004 | H | UC-001 | RF-004 | - | - | planejado |
| US-005 | H | UC-002 | RF-005, RF-006 | - | - | planejado |
| US-006 | H | - | RF-007 (RNF-024) | src/app/(app)/mapa/ (page, loading, error), src/features/map/ (MapCanvas.tsx, MapFilters.tsx, map-model.ts), src/components/ui/MapNode.tsx, src/server/queries/map.ts (T9, em PR) | src/features/map/__tests__/map-model.test.ts, src/features/map/__tests__/reviewed-today.test.ts, src/server/queries/__tests__/map.test.ts; e2e/faixa-b.spec.ts ("mostra nós e ligações") | testado (e2e local com Supabase, docs/evidencias/sprint-01/resumo-t9.md; T9 em PR, não mergeada; não verificados: aresta related e nós em estudo e bloqueado) |
| US-007 | pós | - | (RNF-009) | - | - | planejado |
| US-008 | pós | - | RF-018, (RNF-012) | - | - | planejado |
| US-009 | H | UC-004 | RF-008 (RNF-024) | src/app/(app)/mapa/ (page.tsx, parseStateFilter), src/features/map/MapFilters.tsx, src/features/map/NodeDrawer.tsx (role=dialog), src/features/map/MapCanvas.tsx (onNodeClick) (T9, em PR) | src/features/map/__tests__/map-model.test.ts; e2e/faixa-b.spec.ts ("filtra por estado e trata valor inválido como todos"; "drawer: abre com o nó...") | testado (e2e local com Supabase, docs/evidencias/sprint-01/resumo-t9.md; 11 de 11 após correção de F1 e F2; não verificados: estado estudando com nós visíveis; divergências do Figma em D-037) |
| US-010 | H | UC-003 | RF-010 (RN-020; RNF-024) | src/app/(app)/trilhas/[slug]/ (page, loading, error, not-found), src/server/queries/trail.ts (getTrail), src/features/map/TrailCard.tsx (T9, em PR) | e2e/faixa-b.spec.ts ("a Trilha mostra nome, objetivo, quantidade e origem; slug inexistente dá 404"; o teste confere só o texto "Trilha não encontrada", não o status) | testado (e2e local com Supabase, resumo-t9.md; /trilhas/inexistente responde HTTP 200, ver D-053; D-032 segue aberta sobre o Gherkin da US-010) |
| US-011 | H | UC-003 | RF-011 a RF-016 (RNF-024) | - | - | planejado |
| US-012 | H | UC-004 | RF-017, RF-018, RF-022 (RNF-024) | src/app/(app)/conteudos/[slug] (page, loading, error, not-found), src/features/study, src/server/queries/content.ts, src/server/actions/study.ts, content/*.json (1 a 6, T13; mergeado pelo PR #7, 0eac146) | src/features/study/__tests__/safe-url.test.ts e quick-question.test.ts; roteiro verify.mjs (fora do repositório, D-052; docs/evidencias/sprint-01/US-012/resultado.json): 6 de 6 links de fonte http(s), foco visível, aria-live com a resposta; o e2e versionado não cobre a US-012 diretamente | testado (e2e local com Supabase pelo roteiro verify.mjs, docs/evidencias/sprint-01/US-012/ e resumo.md; não verificados: conferência lado a lado com Figma (sem registro nas evidências) e conferência humana das páginas da Cartilha) |
| US-013 | H | UC-004 | RF-009, RF-020, RF-021 (RN-007; RNF-024) | src/domain/mastery.ts, src/features/quiz (QuizForm.tsx, quiz-state.ts), src/server/actions/quiz.ts, src/server/queries/quiz.ts, src/app/(app)/conteudos/[slug]/mini-simulado/ (T14, mergeada pelo PR #9, c41a892); nó aceso no Mapa (T9, em PR) | src/domain/mastery.test.ts; src/features/quiz/__tests__/quiz-state.test.ts; src/server/actions/__tests__/quiz.test.ts; e2e/faixa-c.spec.ts (4 testes, incluindo o nó aceso; 11 de 11 na rodada 2 do resumo-t9.md); roteiro verify.mjs (fora do repositório, D-052; docs/evidencias/sprint-01/US-013/resultado.json) | testado (e2e local com Supabase, docs/evidencias/sprint-01/resumo.md, resumo-t9.md e US-013/; não verificados: T14-5 (chute no cliente) em runtime, screenshot lado a lado com Figma; D-051 aberta, limite de tentativas, R-18) |
| US-014 | H | - | RF-023 (RNF-024) | - | - | planejado |
| US-015 | pós | UC-002 | RF-024 | - | - | planejado |
| US-016 | H | UC-009 | RF-043 (F1; RNF-024) | - | - | planejado |
| US-017 | pós | UC-004 | RF-019, RF-020 | - | - | planejado |
| US-018 | H | UC-005 | RF-025 (RN-007; RNF-024) | src/app/(app)/revisar/ (page, loading, error), src/features/flashcards (FlashcardSession.tsx, flashcards-state.ts), src/domain/flashcard-scheduler.ts, src/server/queries/flashcards.ts (getDueFlashcards), src/server/actions/flashcards.ts (reviewFlashcard; não escreve em content_progress) (T16, KAN-47, implementada na branch faixa-c/KAN-47-flashcards, aguardando merge) | src/domain/flashcard-scheduler.test.ts; src/server/queries/__tests__/flashcards.test.ts; src/server/actions/__tests__/flashcards.test.ts; src/features/flashcards/__tests__/flashcards-state.test.ts (unitários); e2e/flashcards.spec.ts (e2e real: Playwright no Edge, Supabase local, suíte completa 14 passed; caso da fila: cartão vencido aparece, cartão com estado futuro e conteúdo sem content_progress não aparecem, "1 de 2 cartas"); evidência de tela docs/evidencias/faixa-c/flashcards-lado-a-lado.png. Não verificado no e2e: cartão com due_on = hoje (coberto só pelo teste unitário da query); fidelidade visual só por comparação lado a lado | testado (unit + e2e; evidência em docs/evidencias/faixa-c/flashcards-lado-a-lado.png) |
| US-019 | pós | UC-006 | RF-027 a RF-029 | - | - | planejado |
| US-020 | pós | UC-006 | RF-030 | - | - | planejado |
| US-021 | pós | - | RF-032 | - | - | planejado |
| US-022 | pós | - | (RNF-010) | - | - | planejado |
| US-023 | pós | UC-004 | RF-033 | - | - | planejado |
| US-024 | pós | UC-006 | RF-031 | - | - | planejado |
| US-025 | pós | - | RF-034 | - | - | planejado |
| US-026 | pós | UC-008 | RF-035 | - | - | planejado |
| US-027 | pós | UC-007 | RF-036 | - | - | planejado |
| US-028 | pós | - | RF-037 | - | - | planejado |
| US-029 | pós | - | RF-038, RF-039 | - | - | planejado |
| US-030 | pós | UC-006 | RF-040 | - | - | planejado |
| US-031 | pós | UC-009 | RF-041, RF-042 (evolui RF-043) | - | - | planejado |
| US-032 | pós | UC-009 | RF-013 | - | - | planejado |
| US-033 | pós | UC-005 | RF-026 | - | - | planejado |
| US-034 | pós | UC-012 | RF-044 | - | - | planejado |
| US-035 | pós | UC-012 | RF-045, RF-046 | - | - | planejado |
| US-036 | pós | UC-012 | RF-047 | - | - | planejado |
| US-037 | pós | UC-010 | RF-048 | - | - | planejado |
| US-038 | pós | UC-010 | RF-049 | - | - | planejado |
| US-039 | pós | UC-010 | RF-050, RF-051 | - | - | planejado |
| US-040 | pós | UC-011 | RF-052 | - | - | planejado |
| US-041 | pós | UC-011 | RF-053 | - | - | planejado |
| US-042 | H | UC-013 | RF-054 (RNF-024) | - | - | planejado |
| US-043 | H | UC-013 | RF-055, RF-056 (RN-022, RN-014, D-020; RNF-024) | - | - | planejado |
| US-044 | H | UC-013 | RF-057 (D-019; RNF-024) | - | - | planejado |
| US-045 | H | - | RF-058 (RNF-019, RNF-021) | - | - | planejado |
| US-046 | H | - | RF-059 (RNF-016, RNF-018, RNF-022, RNF-023; D-025, D-026) | src/app/api/health/route.ts, src/app/api/cron/daily/route.ts, vercel.json, playwright.config.ts, e2e/smoke.spec.ts (T5 mergeada pelo PR #8, c2cf114) | src/app/api/health/route.test.ts, src/app/api/cron/daily/route.test.ts; e2e/smoke.spec.ts (2 de 2 com Supabase local); health 200 e cron 401/200 verificados em runtime local (docs/evidencias/sprint-01/resumo.md) | implementado (T5 mergeada, PR #8; 200 com banco local verificado; reposição da demo não verificada; demoReset=skipped até a T4) |
| US-047 | H | - | RF-061 | - | - | planejado |
| US-048 | H | - | RF-060 (RNF-017) | - | - | planejado |
| US-049 | H | - | RF-062 (RN-018) | scripts/validate-content.ts, src/domain/content/validate.ts, content/trail.json, content/essay-topics.json, content/competency-map.json, content/conteudos-e-fontes.md (T12, na main); content/*.json de 1 a 6 (T13, em PR) | src/domain/content/__tests__/validate.test.ts; validador com 0 erros e 18 pendentes (T12) | implementado parcial (T12 na main; 6 de 18 conteúdos em PR; 7 a 18 na T15) |

Cobertura: RF-001 a RF-062 aparecem em pelo menos uma história.

RNF-024 (design segue o protótipo do Figma, fase H) está ligado às histórias de UI da fase H: US-001, US-006, US-009 a US-014, US-016, US-018 e US-042 a US-044 (D-036). A evidência de fidelidade fica em `docs/evidencias/faixa-x/`; o status `testado` segue a regra geral desta matriz (`docs/evidencias/sprint-NN/US-xxx/`, quando houver verificação em Docker).
