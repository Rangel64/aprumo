---
schema: 1
sprint: 01
status: ativa
meta: "Demo pública do Aprumo no ar com o fluxo Mapa > Jornada > estudo > mini-simulado > redação por partes com IA, repositório novo e público, vídeo e descrição submetidos até 30/11/2026 23h59."
historias: [US-048, US-045, US-002, US-005, US-004, US-001, US-049, US-006, US-010, US-009, US-011, US-012, US-013, US-042, US-043, US-044, US-046, US-047, US-014, US-016, US-018]
proximo_passo: "T10 (KAN-41) implementada e verificada, aguardando PR e aceite do PO; T11 depende dela. Pendências novas: D-060 a D-063 e B-013 a B-018."
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
| T1 Repositório novo e público, pnpm (política e lockfile), instala todos os pacotes, create-next-app, Supabase dev e prod (região us-east-2, Ohio; D-046, desvio da D-009), Vercel iad1, CI, deploy vazio, limites Free/Hobby | A | US-045 | `package.json`, lockfile, configs, `vercel.json`, `.github/`, `.env.example`, `supabase/config.toml`, `docs/adr/`, `docs/evidencias/` | - | 24/11 | workspace | infra | concluída (PR #1, 73c91a3; CI verde; deploy na Vercel; variáveis cadastradas; secret scanning e push protection ativos); pendente só os 3 itens não verificados do ADR-002 |
| T2 Contratos v1, migration 0001, `app_config`, `config.ts`, `content/config.json`, seed de config; design system (tokens, componentes base, Entrada e layout fiéis ao Figma; RNF-024; 24/11 a 25/11) | A | base de todas | `src/contracts/*`, `src/lib/supabase/*`, `src/server/config.ts`, migration 0001, `content/config.json` | T1 | 24/11 até 14h | workspace | sensível (RLS) | concluída (PRs #2, #3 e #4; migration aplicada; RLS verificada 75/77 com 2 falsos negativos corrigidos; Advisor 0 erros) |
| T3 Auth, layout e nav, trigger de profile, aviso de dados de teste, entrada; design system (tokens, componentes base, Entrada e layout fiéis ao Figma; RNF-024; 24/11 a 25/11), fiel ao Figma com evidência em `docs/evidencias/faixa-a/` | A | US-001, 002, 004, 005 | `actions/auth.ts`, `features/auth`, `(auth)`, `(app)/layout.tsx`, `page.tsx`, `proxy.ts`/`middleware.ts`, `components/ui` | T2; D-030 | 25/11 | worktree | hackathon | concluída (PR #5, 8c02e64); pendente: foco/teclado e leitor de tela (e2e), evidência lado a lado, D-030 |
| T4 `seed.ts` v1 e conta demo | A | US-048 | `scripts/seed.ts` | T2, T12 (validador), T13 (conteúdos), T18 (`demo-essays.json`; ignora se faltar) | 25/11 | worktree | hackathon | feita (PR #12, merge d7dd8c9, aceita pelo PO em 2026-11-25; KAN-35; M-044 e M-045; DoD hackathon conferida para o código: lint, typecheck, 246 testes e build ok, e2e 14 de 14 em Supabase local, sem segredos no repo; seed no aprumo-dev verificado em 2026-11-25 (M-049); demo publicada não verificada, ver Andamento) |
| T5 `/api/health`, cron diário, esqueleto do smoke e2e | A | US-046 | `api/health`, `api/cron`, `e2e/smoke.spec.ts`, config Playwright | T2, T3 | 26/11 | worktree | infra | feita (PR #8, merge c2cf114; lint, typecheck, 125 testes e build ok; revisor com 1 bloqueante (paginação), corrigido; e2e 1 de 2 sem banco; 200 com banco e reposição da demo não verificados, ligar demoReset na T4) |
| T6 Início (fiel ao Figma com evidência em `docs/evidencias/faixa-a/`, RNF-024) | A | US-014 | `actions`/`queries/home.ts`, `features/home`, `(app)/inicio` | T9, T10, T16, T18 | 27/11 | worktree | hackathon | pendente |
| T7 Revisão de segurança RLS com 2 usuários e Security Advisor (revisor em opus, roteiro de segurança) | A | US-046 | `docs/evidencias/faixa-a/` | T2, T3, T18 | 27/11 | em etapas | sensível | pendente |
| T8 Produção: primeiro dump, `db push`, deploy e seed de prod | A | US-046, US-048 | `aprumo-prod` (variáveis fora do repo) | T7 | 27/11 | em etapas | sensível | pendente |
| T9 Mapa: React Flow sobre fixture, drawer, filtro por estado; Trilha; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-006, 009, 010 | `(app)/{mapa,trilhas}`, `features/map`, `queries/{map,trail}.ts`, `e2e/faixa-b.spec.ts` | T2; `trail.json` de C (24/11 18h) | 24 a 26/11 (Mapa real 26/11) | worktree | hackathon | andamento (em PR, aguardando merge; branch faixa-b/KAN-40-mapa; lint, typecheck, 189 testes e build ok; e2e local com Supabase 11 de 11; revisor sem bloqueante, 6 sugestões; diferenças do Mapa em relação ao Figma a confirmar em D-037; resumo-t9.md) |
| T10 Criar Jornada, `/jornada`, `addContentsToJourney`; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-011 | `(app)/jornada`, `features/journey`, `actions/journey.ts`, `queries/journey.ts` | T9, T2 | 26/11 (D usa neste dia) | worktree | hackathon | andamento: implementada e verificada, aguardando PR e aceite do PO (não feita; M-051) |
| T11 Cronograma: disponibilidade, `schedule.ts` + teste, gerar, "Começar sessão"; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-016 | `(app)/cronograma`, `features/schedule`, `actions/schedule.ts`, `queries/schedule.ts`, `domain/schedule.ts` | T10 | 27 a 28/11 (cortável 1º) | worktree | hackathon | pendente |
| T12 Validador de `content/`, testes Vitest, lista dos 18 e fontes, `trail.json`, `essay-topics.json` | C | US-049 | `scripts/validate-content.ts`, `src/domain/content/__tests__/*`, `content/trail.json`, `content/essay-topics.json` | T2 (formato) | 24/11 (JSON até 18h) | worktree | hackathon | feita |
| T13 Seis conteúdos completos, página de conteúdo (seções, fonte, pergunta rápida); fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-049, 012 | `content/**`, `(app)/conteudos`, `features/study`, `queries/content.ts` | T12 | 25/11 | worktree | hackathon | feita (PR #7, merge 0eac146; US-012 e US-049 seguem abertas) |
| T14 Mini-simulado, `submitQuizAttempt`, `mastery.ts` + teste, nó acende; fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-013 | `features/quiz`, `actions/{study,quiz}.ts`, `queries/quiz.ts`, `domain/mastery.ts`, `e2e/faixa-c.spec.ts` | T13 | 26/11 | worktree | sensível (gabarito, escrita servidor) | feita (PR #9, merge c41a892; lint, typecheck, 164 testes e build ok; revisor em opus sem bloqueante, 5 de 6 sugestões aplicadas; roteiro de segurança: itens 4 a 7 por análise e testes, itens 1 a 3 só por análise (RLS/GRANTs), payload, Network e REST real não verificáveis sem banco; US-013 testada em e2e local com Supabase (resumo.md e resumo-t9.md); não verificados: chute no cliente em runtime (T14-5) e screenshot lado a lado com Figma; D-051 aberta) |
| T15 Conteúdos 7 a 18 e revisão de fontes | C | US-049 | `content/**` | T13 | 27 a 28/11 | worktree | hackathon | feita (PRs #13 e #14, merges b03ed7e e 5a8e246, aceita pelo PO em 2026-11-25; 18 conteúdos, 90 questões e 54 flashcards; lint, typecheck, 246 testes, validador --strict e e2e 14 de 14 em Supabase local registrados nos lotes; build não consta nesses registros; seed no aprumo-dev verificado em 2026-11-25 (M-049); revisão humana D-054 a D-059 pendente; M-046, M-047, M-048) |
| T16 Flashcards, `reviewFlashcard`, `flashcard-scheduler.ts` + teste; fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-018 | `(app)/revisar`, `features/flashcards`, `actions/flashcards.ts`, `queries/flashcards.ts`, `domain/flashcard-scheduler.ts` | T14 | 27 a 28/11 (cortável 2º) | worktree | hackathon | feita (PR #11, merge 5cd789c; aceita pelo PO em 2026-11-25); bateria de 2026-11-25: lint, typecheck, 214 testes, build, e2e 14 de 14 com Supabase local, smoke em 1024 px e 375 px, rls:check 77 de 77 e flashcard_states entre dois usuários 8 de 8; revisor sem bug bloqueante; DoD hackathon conferido, exceto fluxo na demo publicada (verificado só em ambiente local); divergências visuais aceitas (D-043, M-040); B-004 e B-005 abertos |
| T17 Adapter de IA, Fake, prompt v1, corpus, comparação D-010 (24/11 tarde), contas com limite de gasto | D | US-042 | `server/ai/**`, `scripts/eval-essay.ts`, `content/essays/**`, `docs/arquitetura/avaliacao-modelos.md` | T2; D-010 | 24 a 25/11 | worktree | sensível (IA com custo, segredos) | pendente |
| T18 `reserve_ai_usage` (migration), `quota.ts` + teste, rota `/api/essays/feedback` com pós-validação, `demo-essays.json` | D | US-042, 043 | `api/essays`, `domain/quota.ts`, `queries/essay.ts`, migration da faixa | T17, T2 | 25/11 | worktree | sensível (RLS, custo) | pendente |
| T19 Telas `/redacao` e retorno com 5 competências e aviso RN-014; fiel ao Figma com evidência em `docs/evidencias/faixa-d/` (RNF-024; D-037 (a) antes de 26/11) | D | US-042, 043 | `(app)/redacao`, `features/essay`, `e2e/faixa-d.spec.ts` | T18 | 26/11 | worktree | hackathon | pendente |
| T20 Sugestão de competência fraca, reservas com IA desligada ou teto, kill switch; fiel ao Figma com evidência em `docs/evidencias/faixa-d/` (RNF-024) | D | US-044, 043 | `features/essay`, `server/ai/**` | T19, T10, T13 | 27/11 | worktree | sensível | pendente |
| T21 Endurecer redação: timeouts, nova tentativa, p95 | D | US-042 | `server/ai/**`, `api/essays` | T20 | 28/11 | worktree | hackathon | pendente |
| T22 e2e smoke verde em prod, README, monitor de uptime | A | US-045, 046 | `README.md`, `e2e/smoke.spec.ts` | T8 | 28/11 | workspace | infra | pendente |
| T23 Congelamento, QA cruzado, dump diário, seed de prod com 18 conteúdos, release candidate | A (todas apoiam) | todas | - | T15, T21, T22 | 29/11 (12h) | em etapas | hackathon | pendente |
| T24 Vídeo (até 3 min) e descrição da submissão | D (A apoia; gravação com todos) | US-047 | `docs/evidencias/faixa-d/` | T23 | 29/11 | workspace | hackathon | pendente |
| T25 Submissão e tag `v1.0-submissao` | A | US-047, 045 | - | T24 | 30/11 até 20h | workspace | hackathon | pendente |

## Execução por issue do Jira
Decisão do PO (2026-11-24): não executamos todas as tarefas em lote. A execução é por issue do Jira (projeto KAN): cada tarefa é pega uma a uma no Jira por qualquer integrante do grupo e pelos agentes de cada um; não é só o orquestrador que executa. O orquestrador não roda `/sprint-run` em lote; atua sob demanda, na issue que o PO indicar. A sprint ainda precisa ser criada e iniciada no quadro do Jira pelo PO (as ferramentas do orquestrador não criam sprint; D-039).

Fluxo por issue:
1. Pegar a issue KAN-nn no Jira.
2. Mover a issue para em andamento.
3. Fazer em branch curta `faixa-x/KAN-nn-slug`.
4. Abrir PR com CI verde. O merge na main segue D-034 (só com ok explícito).
5. Registrar a evidência: `docs/evidencias/faixa-x/` ou, quando houver verificação em Docker, `docs/evidencias/sprint-01/US-xxx/`.
6. Fechar a issue no Jira.
7. Quando a issue alterar arquivo, registrar o M-nnn em `docs/backlog/mudancas.md` e no CHANGELOG.

Correspondência com o Jira:

| Épico | Jira |
|---|---|
| E1 | KAN-1 |
| E2 | KAN-2 |
| E3 | KAN-3 |
| E4 | KAN-4 |
| E5 | KAN-5 |
| E9 | KAN-6 |
| E11 | KAN-7 |
| E15 | KAN-8 |
| E16 | KAN-9 |
| E17 | KAN-10 |

| História | Jira |
|---|---|
| US-001 | KAN-11 |
| US-002 | KAN-12 |
| US-004 | KAN-13 |
| US-005 | KAN-14 |
| US-006 | KAN-15 |
| US-009 | KAN-16 |
| US-010 | KAN-17 |
| US-011 | KAN-18 |
| US-012 | KAN-19 |
| US-013 | KAN-20 |
| US-018 | KAN-21 |
| US-042 | KAN-22 |
| US-043 | KAN-23 |
| US-044 | KAN-24 |
| US-016 | KAN-25 |
| US-014 | KAN-26 |
| US-049 | KAN-27 |
| US-045 | KAN-28 |
| US-046 | KAN-29 |
| US-047 | KAN-30 |
| US-048 | KAN-31 |

| Tarefa | Jira |
|---|---|
| T1 | KAN-32 |
| T2 | KAN-33 |
| T3 | KAN-34 |
| T4 | KAN-35 |
| T5 | KAN-36 |
| T6 | KAN-37 |
| T7 | KAN-38 |
| T8 | KAN-39 |
| T9 | KAN-40 |
| T10 | KAN-41 |
| T11 | KAN-42 |
| T12 | KAN-43 |
| T13 | KAN-44 |
| T14 | KAN-45 |
| T15 | KAN-46 |
| T16 | KAN-47 |
| T17 | KAN-48 |
| T18 | KAN-49 |
| T19 | KAN-50 |
| T20 | KAN-51 |
| T21 | KAN-52 |
| T22 | KAN-53 |
| T23 | KAN-54 |
| T24 | KAN-55 |
| T25 | KAN-56 |

## Ambiente (checklist, em 2026-11-24)
| Item | Situação |
|---|---|
| Docker | não atendido: CLI presente (cliente 29.8.0, contexto desktop-linux), mas o daemon não responde (`docker info` falha). Pedir ao usuário para ligar o Docker Desktop; agentes não o iniciam. Impacto: só a faixa A usa Docker/Supabase local; B, C e D aplicam migrations no `aprumo-dev`. Não bloqueia a sprint, só a verificação local da faixa A (D-033) |
| Git | repositório criado: github.com/Rangel64/aprumo (público, conta pessoal, não é fork, criado em 24/11/2026); origin existe; commit inicial 3ca1d5b com os docs; autor com e-mail noreply do GitHub |
| Supabase | `aprumo-dev` criado em us-east-2 (Ohio) em 24/11, vinculado ao worktree da KAN-32 (T1); desvio da D-009 (São Paulo), decidido pelo PO (D-046) |
| Portas 3000, 54321, 54322 | livres |
| Navegadores | Chrome e Edge instalados |
| Node e pnpm | Node v24.20.0, pnpm 11.25.0 |
| Stack | Next.js + Supabase; sem Prisma nem `JWT_SECRET` local |
| `/security-review` | agora tem `origin`. O plano mantém a revisão de segurança (RLS, segredos, IA com custo) com o `revisor` em opus e roteiro de segurança, registrada na sprint (T2, T7, T14, T17, T18, T20); pode usar também `/security-review` quando houver código |
| pnpm e lockfile | `devops` define a política de instalação do pnpm na T1 e é dono do lockfile |
| `.env` | agentes nunca leem nem criam `.env` |

Autorizações de commit (D-034): (a) commit inicial do repositório novo e (c) commit na main dos docs de planejamento foram concedidos pelo PO em 2026-11-24 (commit e push feitos pelo orquestrador a pedido). (b) commits locais dos agentes só em branches de worktree, nunca na main: ainda sem ok explícito, pendente. Merge na main e push só com ok explícito.

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
| R-18: força bruta no gabarito do mini-simulado (~15 chamadas deduzem as 5 respostas) | Risco conhecido, sem limite de tentativas na T14; proposta em D-051 (recomendação: adiar para depois do MVP) |
| Conteúdo (18 conteúdos, 90 questões) é gargalo | Lotes 1 (7 a 12, mergeado) e 2 (13 a 18, verificado) da T15 em 25/11: 18 conteúdos e 90 questões; falta o PR do lote 2, o aceite do PO e a revisão por professor (D-054, D-056, D-059); nunca publicar sem fonte |
| Saída da IA fora do schema ou reescrita (RN-023) | `Output.object` + zod, pós-validação, critério eliminatório no D-010 |
| Segredos no repositório público | `.env.example` sem valores, push protection, `server-only`, varredura do histórico |
| Docker desligado | Só afeta a verificação local da faixa A (D-033) |
| R-16: Fidelidade ao Figma consome tempo de UI | Design system e componentes base de A (T2 e T3) primeiro, que B, C e D reutilizam; conferência lado a lado por faixa com evidência em `docs/evidencias/faixa-x/`; se faltar tempo, a fidelidade visual cede ao Gherkin e a divergência é relatada (RNF-024, D-037); cortes seguem a ordem US-016, US-018, US-014 |

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
| D-034 | Autorizações de commit: (a) e (c) concedidas em 24/11; (b) pendente | antes de qualquer commit de agente na sprint |
| D-035 | Colaboradores do repositório (3 integrantes) e visibilidade pública desde já (baixa) | dia 1 |
| D-037 | Divergências do protótipo do Figma (redação com 5 etapas x 3 partes do RF-054, tema escuro, contraste do roxo, nome do modo de prova) (baixa) | antes de T19 (26/11) para a redação; demais antes da conferência de fidelidade |
| D-038 | Design cobre só as telas da fase H ou também as pós-hackathon (baixa) | dia 1 |
| - | Dono do dump diário e do monitor (D-029: sem escala; ponto de atenção do grupo) | dia 1 |

## Andamento
| Data | Feito | Bloqueios |
|---|---|---|
| 2026-11-24 | Sprint aprovada e ativada pelo PO; repositório Rangel64/aprumo criado e docs enviados à main (3ca1d5b) | D-033 Docker desligado; D-029 dono do dump/monitor; contratos v1 previstos para 14h de 24/11 ainda pendentes |
| 2026-11-24 | Épicos, histórias e tarefas criados no Jira (KAN-1 a KAN-56); sprint ainda não criada no quadro do Jira | Sprint a criar e iniciar pelo PO no Jira (D-039); ordem de pegada e quem pega a etapa 0 a definir (D-040) |
| 2026-11-24 | `aprumo-dev` criado em us-east-2 (Ohio), vinculado ao worktree da KAN-32 (T1); região decidida pelo PO em desvio da D-009 (D-046; Vercel iad1, prod em us-east-2 na T8) | - |
| 2026-11-24 | T1 (KAN-32): código mergeado na main (PR #1, merge 73c91a3, branch c771c14); pnpm install --frozen-lockfile, lint, typecheck, test e build passaram localmente; `aprumo-dev` com banco vazio, CLI vinculada e confirmação de e-mail desligada no painel; pendentes: Vercel, secret scanning e push protection, variáveis, CI verde, itens não verificados do ADR | T2 pode começar; Vercel e CI ainda por confirmar |
| 2026-11-24 | T1 (KAN-32) concluída: CI verde no PR e no push da main (2 execuções com sucesso); projeto Vercel "aprumo" ligado à main com deploy no ar; variáveis NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY cadastradas pelo PO; secret scanning e push protection ativos (API do GitHub); issue KAN-32 movida para Concluído no Jira; pendente só a verificação dos 3 itens do ADR-002 (uso não comercial do Hobby; iad1 e us-east-2 nos planos gratuitos; retomada de projeto pausado) | nenhum para a T2 |
| 2026-11-25 | T2 (KAN-33) concluída: PRs #2 (contratos v1, migration 0001 com RLS, clientes Supabase, config, seed de config; merge b44d70e), #3 (design system base; merge 0f78da3) e #4 (types.ts gerado do banco real e scripts/rls-check.ts; commit 569c7d1); migration 0001 aplicada em aprumo-dev pelo PO; seed de config com 10 chaves em app_config; scripts/rls-check.ts com 75 de 77 casos, os 2 FAIL eram falso negativo do script (corrigido no PR #4, reexecução na T7); revisão de segurança em opus sem bloqueantes (3 achados importantes corrigidos); Security Advisor com 0 erros e 2 avisos sobre public.rls_auto_enable() (D-047) e 2 sugestões "RLS Enabled No Policy" intencionais em app_config e question_keys; issue KAN-33 movida para Concluído no Jira; D-045 resolvida pelo PO ao mergear | nenhum; T3, T9, T12 e T17 liberadas (T3 aguarda D-030); T4 e T5 seguem dependendo também de T3, T12, T13 e T18 |
| 2026-11-25 | T3 (KAN-34) concluída pelo PR #5 (commit 3631c8b, merge 8c02e64): signUp, signIn e signOut; `src/proxy.ts` com `getUser`, cabeçalhos no-store e `/api` sem redirecionamento; telas Entrar e Cadastro; layout `(app)` com menu (inclui Redação, que o protótipo não lista); Entrada fiel ao Figma; páginas placeholder; design-preview removida. Verificação: lint, typecheck, 74 testes e build passaram; revisão de segurança (opus) sem bloqueantes, 2 importantes e 5 menores corrigidos; fluxo testado no navegador contra aprumo-dev (cadastro, sair, redirecionamentos, senha errada, e-mail repetido, celular 375 px) | Pendente: foco por teclado e leitor de tela (não verificados); evidência lado a lado não salva em arquivo; D-030 segue em aberto (sem tela de recuperação de senha) |
| 2026-11-25 | Incidente de deploy: após o merge do PR #5, o deploy de produção na Vercel falhou com "Creating Vercel Functions for this deployment is temporarily throttled" (limite temporário da plataforma, não erro de código; o build compilou e as rotas foram listadas). `pnpm run build` roda limpo localmente na main com variáveis placeholder. Ação: redeploy após alguns minutos. Regra do PO: `pnpm run build` é obrigatório antes de reportar tarefa pronta e antes do PR, junto de lint, typecheck e test, por quem implementa e pelo orquestrador | Redeploy de produção ainda a confirmar; D-049 aberta (reduzir deploys na Vercel e fixar `engines.node`) |
| 2026-11-24 | T12 (KAN-43) concluída pelo PR #6 (commit dbc5854): validador de content/ (scripts/validate-content.ts, src/domain/content/validate.ts e testes), content/trail.json, essay-topics.json, competency-map.json e conteudos-e-fontes.md; lint, typecheck, test e build ok; validador com 0 erros e 18 pendentes | T4 segue dependendo de T13 (merge), T18 e T3 |
| 2026-11-24 | T13 (KAN-44) em PR, aguardando merge (branch faixa-c/KAN-44-conteudos): 6 conteúdos em content/ (6 seções, 5 questões e 3 flashcards cada; fonte Cartilha A Redação do Enem 2026/INEP, páginas conferidas no texto do PDF), página /conteudos/[slug], markStudying (nunca rebaixa mastered) e links de fonte só http/https; lint, typecheck, 107 testes e build ok; validador com 0 erros e 12 pendentes; revisor com 0 bloqueantes. Não é história concluída: US-012 e US-049 seguem abertas | Não verificados: screenshot lado a lado com Figma; foco, teclado e aria-live (e2e); rota /conteudos/[slug]/mini-simulado inexistente até T14; BNCC e Matriz geral não conferidas; páginas da Cartilha por conferência humana; content/conteudos-e-fontes.md cita edição antiga da Cartilha (ajustar na T15). Diferenças aceitas do protótipo: sem Imprimir questão, vídeo, Book, Avaliação opcional, EM ESTUDO 68%, duração/nível e progresso de leitura |
| 2026-11-24 | T13 (KAN-44) mergeada pelo PR #7 (merge 0eac146); T13 passa a feita na sprint; US-012 e US-049 seguem abertas (sem história concluída) | Verificações da T13 ainda pendentes: screenshot lado a lado com Figma, foco, teclado e aria-live no e2e, rota do mini-simulado (T14) e conferência humana da Cartilha |
| 2026-11-24 | T5 (KAN-36) em PR, aguardando merge (branch faixa-a/KAN-36-health-cron-e2e): /api/health, /api/cron/daily, cron diário `0 9 * * *` (UTC, 06h em Brasília) em vercel.json com iad1, Playwright e esqueleto do smoke e2e; lint, typecheck, 125 testes e build ok; revisor com 1 bloqueante (paginação de ai_usage), corrigido; curl em runtime temporário e e2e 1 de 2 (registro M-036) | 200 com banco real e reposição da demo não verificados (sem service role no shell; demo-reset.ts é da T4); ligar demoReset na T4 (KAN-35); rodar e2e no preview com banco; horário do cron a confirmar com o grupo (D-050); conferir regra de contagem de reserved quando a T18 criar reserve_ai_usage. Rollback (infra): reverter o PR remove as rotas e o cron do vercel.json; sem schema/migration, sem rollback de dados |
| 2026-11-25 | T5 (KAN-36) mergeada pelo PR #8 (merge c2cf114); T5 passa a feita na sprint 01 (M-036 atualizado em M-037) | 200 com banco real e demoReset na T4 seguem pendentes; D-050 aberta |
| 2026-11-25 | T14 (KAN-45) em PR, aguardando merge (faixa-c, perfil sensível): `mastery.ts` puro (RN-007), `getQuizView` sem gabarito, `submitQuizAttempt` com correção só no servidor, promoção a mastered sem rebaixar, rota /conteudos/[slug]/mini-simulado, e2e pulado sem credenciais e seção de segurança em docs/evidencias/faixa-c/seguranca-quiz.md; lint, typecheck, 164 testes e build ok; revisor em opus sem bloqueante (M-037) | US-013 implementado, não testado: sem e2e com banco e sem a conta de teste; nó aceso no Mapa depende da T9 (test.fixme); foco, teclado, aria-live e screenshot não verificados; D-051 aberta (limite de tentativas, decisão do PO) |
| 2026-11-25 | T9 (KAN-40) em PR (branch faixa-b/KAN-40-mapa, aguardando merge): /mapa com React Flow, filtro por estado, drawer acessível, /trilhas/[slug], queries getMapView, getMapTrails e getTrail, e2e/faixa-b.spec.ts e teste do nó aceso em faixa-c (test.fixme removido); lint, typecheck, 189 testes e build ok; e2e local com Supabase: rodada 1 com 2 defeitos corrigidos (F1 clique de mouse, F2 regex do nó aceso), rodada 2 com 11 de 11 e2e e 17 de 17 checagens; celular 375 px sem rolagem horizontal; revisor com 0 bloqueantes e 6 sugestões (M-038) | Não verificados: aresta related (seed sem relações), nós em estudo e bloqueado; melhorias de acessibilidade do drawer (limpar selectedId ao mudar filtro, bloqueio de rolagem/inert, devolução de foco sem microtask) como melhoria futura; diferenças do Mapa a confirmar (D-037) |
| 2026-11-25 | T14 (KAN-45) mergeada pelo PR #9 (merge c41a892). Verificação em Supabase local (resumo.md): health 200; cron 401 sem segredo e com segredo errado, 200 com segredo certo (demoReset=skipped); gabarito ausente em 8 respostas de rede; question_keys 403; escritas REST 403; answers forjadas rejeitadas; service role fora de .next/static; mastered mantido. T5 (KAN-36) passa a ter 200 com banco local | US-013 testada em e2e local (com o nó aceso da T9). US-012 é testada pelo roteiro verify.mjs, que está fora do repositório (D-052). Não verificados: T14-5 em runtime, screenshot lado a lado com Figma (US-013), conferência humana da Cartilha (US-012), reposição da demo (T4, KAN-35); D-052 e D-053 abertas |
| 2026-11-25 | T16 (KAN-47): bateria completa após a implementação (M-042). lint e typecheck OK; vitest 214 passed; build OK; e2e suíte completa 14 passed (Edge, Supabase local, pnpm start), com o caso da fila e reset repetível da conta demo (3 rodadas passaram, 2 re-semeadas); 1ª rodada 9 de 13 falhou só por ambiente (build com NEXT_PUBLIC_SUPABASE_URL do .env.local e seed descartável incompleto); smoke de 7 rotas em 1024 px e 375 px sem erro de console, 4xx/5xx nem rolagem horizontal; rls:check 77 de 77; flashcard_states entre dois usuários 8 de 8 | T16 aguarda PR e aceite do PO (não feita); D-043 aberta (fila e rótulos Errei e Quase); due_on = hoje só no teste unitário; B-004 e B-005 abertos |
| 2026-11-25 | T16 (KAN-47) mergeada pelo PR #11 (merge 5cd789c; branch faixa-c/KAN-47-flashcards) e aceita pelo PO em 2026-11-25; T16 passa a feita na sprint 01 e US-018 a feita no backlog. Entrega: /revisar com 4 níveis (Errei, Rever, Quase, Sabia!), agendamento simples e reviewFlashcard sem escrever em content_progress (RN-007). DoD do perfil hackathon conferido: build, lint, typecheck, testes, e2e, smoke, revisor e registro M (M-040 a M-043); sem segredos (varredura de padrões no repositório: só placeholders) | Fluxo de revisão na demo publicada não verificado (só em Supabase local); D-032 segue aberta; B-003, B-004 e B-005 seguem abertos; D-043 resolvida (M-043) |
| 2026-11-25 | T4 (KAN-35) implementada na branch faixa-a/KAN-35-seed, sem PR ainda (M-044): scripts/seed.ts v1 com conta demo; guarda que recusa host não local sem --allow-remote e SEED_CONFIRM_REMOTE e sempre recusa "prod" no nome; reset transacional das redações por RPC em migration aditiva (0002); sem demo-essays.json o seed ignora reservas e redações com aviso. Verificação em Supabase local (Docker): db reset com 0001 e 0002; pnpm seed 2 vezes com contagens iguais; RPC com anon e authenticated negados, não-demo recusado e rollback ok; lint, typecheck, build e 246 testes ok; rls:check 77 de 77; e2e 14 de 14 (Edge); revisor sem bloqueante, ajustes aplicados. Corrige B-003 na branch | Não verificado no aprumo-dev remoto (precisa das credenciais do usuário); UI da demo só via e2e; T4 não feita até PR e aceite do PO. Para a integração: cron da T5 deve usar demo-reset; types.ts precisa de db:types após o db push; T8 aplicará a migration em prod; riscos B-006 a B-009 (baixa prioridade) |
| 2026-11-25 | T4 (KAN-35) mergeada pelo PR #12 (merge d7dd8c9; branch faixa-a/KAN-35-seed) e aceita pelo PO; T4 passa a feita na sprint 01; US-048 segue em sprint (seed de prod na T8 e conteúdos 7 a 18 na T15 pendentes); B-003 resolvido; D-041 resolvida pela função demo_replace_essays da migration 0002 (M-045) | Lembretes, não verificados (dependem de credenciais do PO): aplicar migration 0002 em aprumo-dev e em prod (T8); regenerar types com db:types; rodar seed no aprumo-dev; B-005 a B-009 seguem abertos
| 2026-11-25 | T15 (KAN-46), lote 1 (conteúdos 7 a 12) em andamento na branch faixa-c/KAN-46-conteudos-7-12, sem PR: 6 conteúdos em content/ com 30 questões e 18 flashcards; fontes da Cartilha com páginas conferidas no PDF oficial em 2026-11-25; livros só por obra e tema; revisor em 2 rodadas com gabaritos corrigidos (30 de 30); verificação: lint, typecheck, 246 testes, validador (12 com arquivo, 6 pendentes), seed 2 vezes com contagens iguais, Mapa com 12 nós, /revisar com 27 cartas e e2e 14 de 14 (Edge, Supabase local) (M-046). T15 não feita: lote 2 (13 a 18) pendente | Aguardando PR e aceite do PO; não verificado no aprumo-dev; conferência humana das páginas de Bechara, Cunha, Cintra e Manual de Redação (D-054); termo "tópico frasal" (D-055); revisão por professor (D-056); zoom e arestas do Mapa (D-057); coluna "Fontes sugeridas" (D-058); C5 sem conteúdo até o lote 2 (B-010) |
| 2026-11-25 | T15 (KAN-46), lote 2 (conteúdos 13 a 18) implementado e verificado na branch faixa-c/KAN-46-conteudos-13-18, sem PR: 6 conteúdos em content/ (regência e crase, pontuação e vírgula, registro formal e oralidade, proposta de intervenção com os 5 elementos, direitos humanos na proposta, conclusão, retomada e proposta), 30 questões e 18 flashcards; seção "Revisão de fontes (lote 2)" em content/conteudos-e-fontes.md; US-049 com 18 de 18 conteúdos (M-047). Verificação: revisor em 3 rodadas com achados corrigidos; lint, typecheck, 246 testes e validador --strict ok; e2e 14 de 14 (Edge, Supabase local); seed 2 vezes com as mesmas contagens (18 conteúdos, 108 seções, 90 questões, 90 question_keys, 54 flashcards, 22 arestas); C1=4, C2=5, C3=5, C4=3, C5=3; Mapa com 18 nós sem sobreposição e trilha com 18 itens; mini-simulados conferidos; /revisar com 54 cartas | T15 não feita: aguarda PR do lote 2 e aceite do PO; B-010 corrigido na branch, fecha no merge; não verificado no aprumo-dev; estados carregando, vazio e erro dos conteúdos fora do foco; revisão por professor e fontes de livros a conferir (D-054, D-056, D-059); no Mapa de 18 nós, três nós da última linha ficam abaixo da dobra em 1280x900 e o layout é assimétrico (D-057) |
| 2026-11-25 | T15 (KAN-46) fechada pelo PO: PR #13 mergeado (merge b03ed7e, lote 1, conteúdos 7 a 12) e PR #14 mergeado (merge 5a8e246, lote 2, conteúdos 13 a 18), com CI verde; T15 passa a feita na sprint 01 e US-049 a feita no backlog (18 de 18 conteúdos, 90 questões, 54 flashcards); B-010 resolvido no merge do PR #14; DoD hackathon conferida pelo PO (M-048) | Seed dos 18 conteúdos não carregado no aprumo-dev (avisar a faixa A e rodar o seed com credenciais do PO); seed de prod com os 18 conteúdos na T23; revisão humana das fontes e termos pendente (D-054 a D-059); D-057 (layout do Mapa com 18 nós) e B-011 abertas; build não consta nos registros dos lotes, a conferir |
| 2026-11-25 | Seed executado no aprumo-dev (M-049), a pedido do PO: duas execuções de `pnpm exec tsx --env-file=.env.local scripts/seed.ts --allow-remote` com a confirmação de remoto definida; saída "Destino: Supabase remoto de desenvolvimento (confirmado)"; contagens após a 1ª e a 2ª execução iguais (contents 18, content_edges 22, content_sections 108, questions 90, question_keys 90, flashcards 54, trails 1, trail_contents 18, competency_contents 20, essay_topics 3, profiles 2 (1 demo), content_progress 3, journeys 1, journey_contents 18, flashcard_states 9, essay_submissions 0, essay_feedbacks 0; app_config com 10 chaves). Conta demo: 3 dominados, Jornada ativa com prazo 2026-12-25. Lembrete "carregar seed no aprumo-dev" feito; T4 e T15 deixam de ter "não verificado" quanto ao seed | Pendentes: migration 0002 não aplicada no aprumo-dev (supabase db push com ok do PO); db:types depois dela; reservas e redações da demo ignoradas por falta de demo-essays.json (T18), seed a reexecutar quando existir; seed de prod na T23/T8; seção de execução em docs/evidencias/faixa-a/seed-idempotencia.md ainda não escrita (fora do escopo do analista) |
| 2026-11-25 | Migration 0002 (`demo_replace_essays`) aplicada no aprumo-dev com `supabase db push --remote --yes`, a pedido do PO e com a confirmação dele de que o projeto é o aprumo-dev (nome conferido pelo CLI); prévia `--dry-run` com só a 0002 pendente. Verificação no remoto: função public.demo_replace_essays existe; service_role executa e recusa usuário não-demo ("usuário não é a conta demo"); anon recebe "permission denied" (42501). Tipos regenerados com `supabase gen types typescript --remote` (só a função, Args {p_essays: Json, p_user_id: string}, Returns number); lint, typecheck e 246 testes ok (M-050; B-012 resolvido) | Permanecem: aplicar a 0002 no aprumo-prod na T8; seed de prod na T23; seed de novo quando demo-essays.json existir (T18). Processo: o Supabase CLI 3.x exige `--remote` para atuar no projeto vinculado e confirmação explícita (`--yes`) em execução de agente; este computador precisou de `supabase login` e `link`, feitos pelo PO |
| 2026-11-26 | T10 (KAN-41, US-011) implementada e verificada na branch faixa-b/KAN-41-jornada, sem PR (M-051): createJourney, addContentsToJourney e getActiveJourney com testes unitários; /jornada e /jornada/nova com loading, erro e vazio; e2e/faixa-b.spec.ts (4 casos). Verificação em Supabase local: lint, typecheck, 295 testes e build ok; fluxos conta nova 33 de 33 e demo 31 de 31; addContentsToJourney 15 de 15; RLS A x B 14 de 14 e rls:check 77 de 77; e2e 18 de 18 em duas rodadas; a11y e 375/1024 px conferidos; "Tentar de novo" recupera com retry() | Aguardando PR e aceite do PO (T10 não feita). Não verificados: aprumo-dev; Início com a Jornada (T6); nivelamento e submetas sem código (D-063). Pendências: D-060 (mais de uma Jornada ativa), D-061 (drawer do Mapa sem a action), B-013 (rollback sem transação) |

## Review
| US | Resultado (feito / não feito) | Motivo |
|---|---|---|
| US-018 | feito | T16 (KAN-47) mergeada pelo PR #11 (merge 5cd789c) e aceita pelo PO em 2026-11-25; DoD hackathon conferido, exceto fluxo na demo publicada (verificado só em Supabase local) |
| US-049 | feito | T15 (KAN-46) mergeada pelos PRs #13 e #14 (merges b03ed7e e 5a8e246) e aceita pelo PO em 2026-11-25; 18 de 18 conteúdos; conferência humana das fontes segue em D-054 a D-059 |

## Métricas
- Planejadas: 21
- Entregues: -
- Retrabalho: -
- Aprovação na 1ª revisão: - de 21
- Ciclos de correção: -
- Testes planejados x executados: - x -
- Problemas pós-entrega: -
- Registros M: M-024..M-051

| Agente | Modelo | Quantidade |
|---|---|---|

## Registro de execução
