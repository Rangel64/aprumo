---
schema: 1
sprint: 01
status: planejada
meta: "Demo pública do Aprumo no ar com o fluxo Mapa > Jornada > estudo > mini-simulado > redação por partes com IA, repositório novo e público, vídeo e descrição submetidos até 30/11/2026 23h59."
historias: [US-048, US-045, US-002, US-005, US-004, US-001, US-049, US-006, US-010, US-009, US-011, US-012, US-013, US-042, US-043, US-044, US-046, US-047, US-014, US-016, US-018]
proximo_passo: "PO aprovar o plano; liberar as autorizações pendentes de ok (seção Ambiente); iniciar a etapa 0 (T1 e T2) em 24/11."
---
# Sprint 01: Aprumo na Hack Brasil 2026 (fase H)

## Meta
Demo pública no ar com o fluxo Mapa > Jornada > estudo > mini-simulado > redação por partes com IA; repositório novo e público; vídeo e descrição submetidos até 30/11/2026 (meta interna 20h; prazo oficial 23h59).

## Período, equipe e cortes
- Período: 24 a 30/11/2026 (7 dias). Equipe de 4, uma faixa por pessoa: Pessoa A (Plataforma), Pessoa B (Mapa e Jornada), Pessoa C (Estudo e conteúdo), Pessoa D (Redação com IA); nomes a definir no dia 1. Cada pessoa usa agentes de IA.
- Congelar funcionalidades: 29/11 às 12h. Submissão: meta interna 30/11 às 20h; prazo 23h59. Repositório congelado de 30/11 a 12/12 (só `app_config` no painel).
- Linha de corte, nesta ordem: US-016, depois US-018, depois US-014.

| Checkpoint | Pergunta | Se falhar |
|---|---|---|
| 27/11 | Jornada e Mapa ok? | Corta US-016 (remove `/cronograma` do menu) |
| 28/11 meio-dia | Redação ok? | Corta US-018; C ajuda D |
| 29/11 meio-dia | Início estável? | Corta US-014: `/inicio` redireciona para `/jornada` |
| 29/11 12h | Congelamento | Só correção crítica depois |
| 30/11 20h | Submissão feita | Folga até 23h59 |

## Histórias (21, fase H)
| Faixa | Histórias |
|---|---|
| A | US-045, US-046, US-048, US-001, US-002, US-004, US-005, US-014 |
| B | US-006, US-009, US-010, US-011, US-016 |
| C | US-012, US-013, US-018, US-049 |
| D | US-042, US-043, US-044, US-047 (A apoia; gravação com todos em 29/11) |

## Contrato compartilhado (fixado antes das faixas)
Etapa 0 (24/11, até 14h, tarefas T1 e T2, faixa A): pacotes instalados, contratos v1 (`src/contracts/*`, inclusive `content.ts`, `fixtures.ts`), migration 0001 (schema inteiro com RLS, sem `reserve_ai_usage`), `app_config`, `src/server/config.ts`, `content/config.json` e seed de config, repositório novo e público, deploy vazio. É pré-condição das demais faixas, que trabalham sobre `fixtures.ts` até lá. Depois, `src/contracts/` muda só por adição, com PR revisado por quem consome. Detalhes: [plano](../../arquitetura/plano-hackathon.md) (seção 3) e [briefings](../../arquitetura/briefings/README.md).

## Tarefas
Modo: trunk-based, branch curta `faixa-x/...`, PR com CI verde, merge na main ao menos 2 vezes por dia; cada pessoa com clone próprio; agentes de IA de cada pessoa em `git worktree` próprio. Perfil DoD "hackathon" salvo indicação. Datas são prazos previstos.

| Tarefa | Faixa | Histórias | Arquivos/faixa exclusiva | Depende de | Data alvo | Modo | Perfil DoD | Status |
|---|---|---|---|---|---|---|---|---|
| T1 Repositório novo e público, pnpm (política e lockfile), instala todos os pacotes, create-next-app, Supabase dev e prod, Vercel gru1, CI, deploy vazio, limites Free/Hobby | A | US-045 | `package.json`, lockfile, configs, `vercel.json`, `.github/`, `.env.example`, `supabase/config.toml`, `docs/adr/`, `docs/evidencias/` | - | 24/11 | workspace | infra | pendente |
| T2 Contratos v1, migration 0001, `app_config`, `config.ts`, `content/config.json`, seed de config | A | base de todas | `src/contracts/*`, `src/lib/supabase/*`, `src/server/config.ts`, migration 0001, `content/config.json` | T1 | 24/11 até 14h | workspace | sensível (RLS) | pendente |
| T3 Auth, layout e nav, trigger de profile, aviso de dados de teste, entrada | A | US-001, 002, 004, 005 | `actions/auth.ts`, `features/auth`, `(auth)`, `(app)/layout.tsx`, `page.tsx`, `proxy.ts`/`middleware.ts`, `components/ui` | T2; D-030 | 25/11 | worktree | hackathon | pendente |
| T4 `seed.ts` v1 e conta demo | A | US-048 | `scripts/seed.ts` | T2, T12 (validador), T13 (conteúdos), T18 (`demo-essays.json`; ignora se faltar) | 25/11 | worktree | hackathon | pendente |
| T5 `/api/health`, cron diário, esqueleto do smoke e2e | A | US-046 | `api/health`, `api/cron`, `e2e/smoke.spec.ts`, config Playwright | T2, T3 | 26/11 | worktree | infra | pendente |
| T6 Início | A | US-014 | `actions`/`queries/home.ts`, `features/home`, `(app)/inicio` | T9, T10, T16, T18 | 27/11 | worktree | hackathon | pendente |
| T7 Revisão de segurança RLS com 2 usuários e Security Advisor (revisor em opus, roteiro de segurança) | A | US-046 | `docs/evidencias/faixa-a/` | T2, T3, T18 | 27/11 | em etapas | sensível | pendente |
| T8 Produção: primeiro dump, `db push`, deploy e seed de prod | A | US-046, US-048 | `aprumo-prod` (variáveis fora do repo) | T7 | 27/11 | em etapas | sensível | pendente |
| T9 Mapa: React Flow sobre fixture, drawer, filtro por estado; Trilha | B | US-006, 009, 010 | `(app)/{mapa,trilhas}`, `features/map`, `queries/{map,trail}.ts`, `e2e/faixa-b.spec.ts` | T2; `trail.json` de C (24/11 18h) | 24 a 26/11 (Mapa real 26/11) | worktree | hackathon | pendente |
| T10 Criar Jornada, `/jornada`, `addContentsToJourney` | B | US-011 | `(app)/jornada`, `features/journey`, `actions/journey.ts`, `queries/journey.ts` | T9, T2 | 26/11 (D usa neste dia) | worktree | hackathon | pendente |
| T11 Cronograma: disponibilidade, `schedule.ts` + teste, gerar, "Começar sessão" | B | US-016 | `(app)/cronograma`, `features/schedule`, `actions/schedule.ts`, `queries/schedule.ts`, `domain/schedule.ts` | T10 | 27 a 28/11 (cortável 1º) | worktree | hackathon | pendente |
| T12 Validador de `content/`, testes Vitest, lista dos 18 e fontes, `trail.json`, `essay-topics.json` | C | US-049 | `scripts/validate-content.ts`, `src/domain/content/__tests__/*`, `content/trail.json`, `content/essay-topics.json` | T2 (formato) | 24/11 (JSON até 18h) | worktree | hackathon | pendente |
| T13 Seis conteúdos completos, página de conteúdo (seções, fonte, pergunta rápida) | C | US-049, 012 | `content/**`, `(app)/conteudos`, `features/study`, `queries/content.ts` | T12 | 25/11 | worktree | hackathon | pendente |
| T14 Mini-simulado, `submitQuizAttempt`, `mastery.ts` + teste, nó acende | C | US-013 | `features/quiz`, `actions/{study,quiz}.ts`, `queries/quiz.ts`, `domain/mastery.ts`, `e2e/faixa-c.spec.ts` | T13 | 26/11 | worktree | sensível (gabarito, escrita servidor) | pendente |
| T15 Conteúdos 7 a 18 e revisão de fontes | C | US-049 | `content/**` | T13 | 27 a 28/11 | worktree | hackathon | pendente |
| T16 Flashcards, `reviewFlashcard`, `flashcard-scheduler.ts` + teste | C | US-018 | `(app)/revisar`, `features/flashcards`, `actions/flashcards.ts`, `queries/flashcards.ts`, `domain/flashcard-scheduler.ts` | T14 | 27 a 28/11 (cortável 2º) | worktree | hackathon | pendente |
| T17 Adapter de IA, Fake, prompt v1, corpus, comparação D-010 (24/11 tarde), contas com limite de gasto | D | US-042 | `server/ai/**`, `scripts/eval-essay.ts`, `content/essays/**`, `docs/arquitetura/avaliacao-modelos.md` | T2; D-010 | 24 a 25/11 | worktree | sensível (IA com custo, segredos) | pendente |
| T18 `reserve_ai_usage` (migration), `quota.ts` + teste, rota `/api/essays/feedback` com pós-validação, `demo-essays.json` | D | US-042, 043 | `api/essays`, `domain/quota.ts`, `queries/essay.ts`, migration da faixa | T17, T2 | 25/11 | worktree | sensível (RLS, custo) | pendente |
| T19 Telas `/redacao` e retorno com 5 competências e aviso RN-014 | D | US-042, 043 | `(app)/redacao`, `features/essay`, `e2e/faixa-d.spec.ts` | T18 | 26/11 | worktree | hackathon | pendente |
| T20 Sugestão de competência fraca, reservas com IA desligada ou teto, kill switch | D | US-044, 043 | `features/essay`, `server/ai/**` | T19, T10, T13 | 27/11 | worktree | sensível | pendente |
| T21 Endurecer redação: timeouts, nova tentativa, p95 | D | US-042 | `server/ai/**`, `api/essays` | T20 | 28/11 | worktree | hackathon | pendente |
| T22 e2e smoke verde em prod, README, monitor de uptime | A | US-045, 046 | `README.md`, `e2e/smoke.spec.ts` | T8 | 28/11 | workspace | infra | pendente |
| T23 Congelamento, QA cruzado, dump diário, seed de prod com 18 conteúdos, release candidate | A (todas apoiam) | todas | - | T15, T21, T22 | 29/11 (12h) | em etapas | hackathon | pendente |
| T24 Vídeo (até 3 min) e descrição da submissão | D (A apoia; gravação com todos) | US-047 | `docs/evidencias/faixa-d/` | T23 | 29/11 | workspace | hackathon | pendente |
| T25 Submissão e tag `v1.0-submissao` | A | US-047, 045 | - | T24 | 30/11 até 20h | workspace | hackathon | pendente |

## Ambiente (checklist, em 2026-11-24)
| Item | Situação |
|---|---|
| Docker | não atendido: CLI presente (cliente 29.8.0, contexto desktop-linux), mas o daemon não responde (`docker info` falha). Pedir ao usuário para ligar o Docker Desktop; agentes não o iniciam. Impacto: só a faixa A usa Docker/Supabase local; B, C e D aplicam migrations no `aprumo-dev`. Não bloqueia a sprint, só a verificação local da faixa A (D-033) |
| Git | a pasta não é repositório git e não tem `origin`; o repositório de entrega será criado pela faixa A (T1), novo e público, sem fork |
| Portas 3000, 54321, 54322 | livres |
| Navegadores | Chrome e Edge instalados |
| Node e pnpm | Node v24.20.0, pnpm 11.25.0 |
| Stack | Next.js + Supabase; sem Prisma nem `JWT_SECRET` local |
| `/security-review` | não roda sem `origin`; a revisão de segurança (RLS, segredos, IA com custo) usa o `revisor` em opus com roteiro de segurança, registrada na sprint (T2, T7, T14, T17, T18, T20) |
| pnpm e lockfile | `devops` define a política de instalação do pnpm na T1 e é dono do lockfile |
| `.env` | agentes nunca leem nem criam `.env` |

Autorizações pendentes de ok do usuário (não concedidas; D-034): (a) commit inicial do repositório novo; (b) commits locais dos agentes só em branches de worktree, nunca na main; (c) commit na main dos docs de planejamento depois do ok do PO ao plano. Merge na main e push só com ok explícito.

## Riscos
| Risco | Mitigação |
|---|---|
| R-09: escopo de 6 dias com 4 devs não cabe | Linha de corte US-016, US-018, US-014; checkpoints 27/11, 28/11 e 29/11; fatias independentes |
| R-14: Supabase Free pausa o banco ou não tem backup; limites menores que o previsto | Monitor externo a cada 5 min, cron diário, dump manual diário de 29/11 a 12/12 e antes de cada `db push`; limites confirmados no dia 1 (RNF-022, RNF-023, D-027) |
| R-15: cobrança de IA acima do teto | Limite de gasto mensal no console de cada provedor no dia 1; teto global e `ai_enabled` em `app_config` (RNF-018, D-026) |
| Latência ou timeout da IA | Estado pendente com `aria-live`, timeout de 45 s, 1 nova tentativa, p95 medido no D-010; reservas gravadas |
| Conta demo pública esgotada ou desconfigurada | `essay_daily_limit_demo`, reset diário por cron, cadastro livre como alternativa |
| RLS errada ou fraude de domínio | Escritas conquistadas só no servidor, gabarito sem política, teste com 2 usuários em 27/11, Security Advisor |
| Integração tardia entre faixas | Contratos e fixtures na etapa 0; merge 2 vezes por dia; preview por PR |
| Conteúdo (18 conteúdos, 90 questões) é gargalo | 6 conteúdos em 25/11; todos ajudam; nunca publicar sem fonte |
| Saída da IA fora do schema ou reescrita (RN-023) | `Output.object` + zod, pós-validação, critério eliminatório no D-010 |
| Segredos no repositório público | `.env.example` sem valores, push protection, `server-only`, varredura do histórico |
| Docker desligado | Só afeta a verificação local da faixa A (D-033) |

## Decisões em aberto
Ver [pendencias.md](../pendencias.md).
| ID | Tema | Quando decidir |
|---|---|---|
| D-010 | Modelo de IA (comparação em 24/11, decisão em 25/11, ADR-005) | 25/11 |
| D-020 | Teto global de custo de IA (US$ 20 provisório) | dia 1 |
| D-030 | Regras de senha e recuperação na demo | antes de T3 |
| D-031 | Quem ajusta teste quebrado de outra faixa (proposta: o dono do teste) | dia 1 |
| D-032 | Divergência possível de Gherkin em US-010 e US-018 | na implementação |
| D-033 | Ligar o Docker Desktop ou aceitar rodar sem Supabase local | dia 1 |
| D-034 | Autorizações de commit (a, b, c acima) | antes de T1 |
| - | Dono do dump diário e do monitor (D-029: sem escala; ponto de atenção do grupo) | dia 1 |

## Andamento
| Data | Feito | Bloqueios |
|---|---|---|

## Review
| US | Resultado (feito / não feito) | Motivo |
|---|---|---|

## Métricas
- Planejadas: 21
- Entregues: -
- Retrabalho: -
- Aprovação na 1ª revisão: - de 21
- Ciclos de correção: -
- Testes planejados x executados: - x -
- Problemas pós-entrega: -
- Registros M: M-024..

| Agente | Modelo | Quantidade |
|---|---|---|

## Registro de execução
