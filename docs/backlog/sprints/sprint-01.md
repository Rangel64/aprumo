---
schema: 1
sprint: 01
status: ativa
meta: "Demo pública do Aprumo no ar com o fluxo Mapa > Jornada > estudo > mini-simulado > redação por partes com IA, repositório novo e público, vídeo e descrição submetidos até 30/11/2026 23h59."
historias: [US-048, US-045, US-002, US-005, US-004, US-001, US-049, US-006, US-010, US-009, US-011, US-012, US-013, US-042, US-043, US-044, US-046, US-047, US-014, US-016, US-018]
proximo_passo: "Fazer merge do PR da T5 (KAN-36); pegar a próxima tarefa pelo Jira (T9 KAN-40 e T17 KAN-48 estão liberadas)"
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
| T4 `seed.ts` v1 e conta demo | A | US-048 | `scripts/seed.ts` | T2, T12 (validador), T13 (conteúdos), T18 (`demo-essays.json`; ignora se faltar) | 25/11 | worktree | hackathon | pendente |
| T5 `/api/health`, cron diário, esqueleto do smoke e2e | A | US-046 | `api/health`, `api/cron`, `e2e/smoke.spec.ts`, config Playwright | T2, T3 | 26/11 | worktree | infra | andamento (em PR, aguardando merge; lint, typecheck, 125 testes e build ok; revisor com 1 bloqueante (paginação), corrigido; e2e 1 de 2 sem banco; 200 com banco e reposição da demo não verificados, ligar demoReset na T4) |
| T6 Início (fiel ao Figma com evidência em `docs/evidencias/faixa-a/`, RNF-024) | A | US-014 | `actions`/`queries/home.ts`, `features/home`, `(app)/inicio` | T9, T10, T16, T18 | 27/11 | worktree | hackathon | pendente |
| T7 Revisão de segurança RLS com 2 usuários e Security Advisor (revisor em opus, roteiro de segurança) | A | US-046 | `docs/evidencias/faixa-a/` | T2, T3, T18 | 27/11 | em etapas | sensível | pendente |
| T8 Produção: primeiro dump, `db push`, deploy e seed de prod | A | US-046, US-048 | `aprumo-prod` (variáveis fora do repo) | T7 | 27/11 | em etapas | sensível | pendente |
| T9 Mapa: React Flow sobre fixture, drawer, filtro por estado; Trilha; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-006, 009, 010 | `(app)/{mapa,trilhas}`, `features/map`, `queries/{map,trail}.ts`, `e2e/faixa-b.spec.ts` | T2; `trail.json` de C (24/11 18h) | 24 a 26/11 (Mapa real 26/11) | worktree | hackathon | pendente |
| T10 Criar Jornada, `/jornada`, `addContentsToJourney`; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-011 | `(app)/jornada`, `features/journey`, `actions/journey.ts`, `queries/journey.ts` | T9, T2 | 26/11 (D usa neste dia) | worktree | hackathon | pendente |
| T11 Cronograma: disponibilidade, `schedule.ts` + teste, gerar, "Começar sessão"; fiel ao Figma com evidência em `docs/evidencias/faixa-b/` (RNF-024) | B | US-016 | `(app)/cronograma`, `features/schedule`, `actions/schedule.ts`, `queries/schedule.ts`, `domain/schedule.ts` | T10 | 27 a 28/11 (cortável 1º) | worktree | hackathon | pendente |
| T12 Validador de `content/`, testes Vitest, lista dos 18 e fontes, `trail.json`, `essay-topics.json` | C | US-049 | `scripts/validate-content.ts`, `src/domain/content/__tests__/*`, `content/trail.json`, `content/essay-topics.json` | T2 (formato) | 24/11 (JSON até 18h) | worktree | hackathon | feita |
| T13 Seis conteúdos completos, página de conteúdo (seções, fonte, pergunta rápida); fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-049, 012 | `content/**`, `(app)/conteudos`, `features/study`, `queries/content.ts` | T12 | 25/11 | worktree | hackathon | feita (PR #7, merge 0eac146; US-012 e US-049 seguem abertas) |
| T14 Mini-simulado, `submitQuizAttempt`, `mastery.ts` + teste, nó acende; fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-013 | `features/quiz`, `actions/{study,quiz}.ts`, `queries/quiz.ts`, `domain/mastery.ts`, `e2e/faixa-c.spec.ts` | T13 | 26/11 | worktree | sensível (gabarito, escrita servidor) | pendente |
| T15 Conteúdos 7 a 18 e revisão de fontes | C | US-049 | `content/**` | T13 | 27 a 28/11 | worktree | hackathon | pendente |
| T16 Flashcards, `reviewFlashcard`, `flashcard-scheduler.ts` + teste; fiel ao Figma com evidência em `docs/evidencias/faixa-c/` (RNF-024) | C | US-018 | `(app)/revisar`, `features/flashcards`, `actions/flashcards.ts`, `queries/flashcards.ts`, `domain/flashcard-scheduler.ts` | T14 | 27 a 28/11 (cortável 2º) | worktree | hackathon | pendente |
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
| Conteúdo (18 conteúdos, 90 questões) é gargalo | 6 conteúdos em 25/11; todos ajudam; nunca publicar sem fonte |
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
- Registros M: M-024..M-036

| Agente | Modelo | Quantidade |
|---|---|---|

## Registro de execução
