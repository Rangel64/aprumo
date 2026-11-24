# Tarefas da Sprint 01: especificação executável (T1 a T25 = KAN-32 a KAN-56)

Cada seção abaixo pode ser colada na descrição da issue do Jira. Quem pega a tarefa não precisa ter visto nenhuma conversa: leia a seção, o trecho do plano indicado e o briefing da faixa. Em conflito: (1) Gherkin de `docs/requisitos/historias.md`, (2) [plano](../../arquitetura/plano-hackathon.md), (3) [briefings](../../arquitetura/briefings/README.md). Divergência: relatar ao grupo, não decidir sozinho. Contexto da sprint: [sprint-01.md](sprint-01.md).

## Regra e fluxo
- **Cada pessoa pega uma tarefa por vez no Jira** (só pega a próxima ao fechar a atual). Agentes de IA seguem a mesma regra e trabalham em `git worktree` próprio.
- Fluxo curto: 1) mover a issue para em andamento; 2) branch `faixa-x/KAN-nn-slug`; 3) fazer só nos arquivos da faixa; 4) PR com CI verde (merge na main só com ok explícito, D-034); 5) evidência em `docs/evidencias/faixa-x/`; 6) fechar a issue; 7) se alterou arquivo, registrar o M-nnn em `docs/backlog/mudancas.md` e no CHANGELOG.
- Comandos comuns (sempre na RAIZ): `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (com `AI_PROVIDER=fake`). Nunca build, dev server e testes ao mesmo tempo no mesmo diretório; encerrar o que subir.
- Ninguém lê nem cria `.env`; variáveis só por nome em `.env.example`. Sem segredo em código, log, commit, screenshot ou dump.
- Ao terminar: relato curto com a DoD nos seis estados (executado, passou, falhou, não executado, não verificável, pendência que impede "feita") e o bloco "Para o registro" (o quê, por quê, arquivos, verificação). Teste não executado nunca é aprovado.
- Em aberto (não decidir): D-010 (modelo de IA; usar o `FakeEssayModel`), D-020 (teto global; manter US$ 20 provisório), D-030 (senha/recuperação), D-031 (quem ajusta teste de outra faixa; proposta: o dono do teste), D-032 (US-010 e US-018; seguir a leitura do plano e relatar), D-037 (divergências do Figma; seguir o Gherkin e relatar), D-038 (só telas da fase H).

## Índice
| Tarefa | Jira | Faixa | Título | Data alvo |
|---|---|---|---|---|
| T1 | KAN-32 | A | Repositório, pnpm, pacotes, Supabase, Vercel, CI, deploy vazio | 24/11 |
| T2 | KAN-33 | A | Contratos v1, migration 0001, `app_config`, design system base | 24/11 até 14h |
| T3 | KAN-34 | A | Auth, layout e nav, entrada | 25/11 |
| T4 | KAN-35 | A | `seed.ts` v1 e conta demo | 25/11 |
| T5 | KAN-36 | A | `/api/health`, cron diário, esqueleto do smoke | 26/11 |
| T6 | KAN-37 | A | Início | 27/11 |
| T7 | KAN-38 | A | Revisão de segurança RLS | 27/11 |
| T8 | KAN-39 | A | Produção: dump, `db push`, deploy, seed | 27/11 |
| T9 | KAN-40 | B | Mapa e Trilha | 24 a 26/11 |
| T10 | KAN-41 | B | Criar Jornada e `/jornada` | 26/11 |
| T11 | KAN-42 | B | Cronograma | 27 a 28/11 |
| T12 | KAN-43 | C | Validador de `content/`, `trail.json`, temas | 24/11 |
| T13 | KAN-44 | C | Seis conteúdos e página de conteúdo | 25/11 |
| T14 | KAN-45 | C | Mini-simulado e domínio | 26/11 |
| T15 | KAN-46 | C | Conteúdos 7 a 18 e fontes | 27 a 28/11 |
| T16 | KAN-47 | C | Flashcards | 27 a 28/11 |
| T17 | KAN-48 | D | Adapter de IA, Fake, prompt v1, comparação D-010 | 24 a 25/11 |
| T18 | KAN-49 | D | `reserve_ai_usage`, quota e rota de feedback | 25/11 |
| T19 | KAN-50 | D | Telas de redação e retorno | 26/11 |
| T20 | KAN-51 | D | Sugestão, reservas, kill switch | 27/11 |
| T21 | KAN-52 | D | Endurecer a redação | 28/11 |
| T22 | KAN-53 | A | Smoke em prod, README, monitor | 28/11 |
| T23 | KAN-54 | A (todas) | Congelamento, QA cruzado, dump, RC | 29/11 12h |
| T24 | KAN-55 | D (A apoia) | Vídeo e descrição | 29/11 |
| T25 | KAN-56 | A | Submissão e tag | 30/11 até 20h |

---

## T1 · Repositório novo e público, pnpm, pacotes, Supabase, Vercel, CI, deploy vazio (KAN-32)
**Objetivo:** projeto Next.js criado no repositório existente, com todos os pacotes instalados, dois projetos Supabase, Vercel ligada, CI verde e um deploy vazio no ar, com os limites dos planos gratuitos anotados.
**Contexto e entradas:** o repositório `Rangel64/aprumo` JÁ EXISTE (público, conta pessoal, não é fork; commits iniciais só com `docs/`; não criar outro). Falta: tudo abaixo. Ver [plano §1, §6 e §7](../../arquitetura/plano-hackathon.md) e [briefing A](../../arquitetura/briefings/faixa-a-plataforma.md). Node v24.20.0 e pnpm 11.25.0 no ambiente. Branch `faixa-a/KAN-32-bootstrap`.
**O que executar:**
1. Definir a política do pnpm (campo `packageManager` no `package.json`, um único `pnpm-lock.yaml`, nenhum `package-lock.json` nem `yarn.lock`) e escrevê-la em `README.md` provisório ou `docs/adr/`.
2. `pnpm create next-app` na raiz (App Router, TypeScript, Tailwind, ESLint, pasta `src/`, sem Turbopack opcional se a doc da versão instalada recomendar o contrário). Preservar `docs/` e `CHANGELOG.md`.
3. Instalar TODOS os pacotes: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`, `ai`, um `@ai-sdk/<provedor>` por candidato do D-010 (confirmar nomes na documentação), `@xyflow/react`, renderizador de markdown (confirmar pacote na documentação antes e registrar o nome), `sonner`, e como dev: `vitest`, `@playwright/test`, `supabase` (CLI), `tsx`. Não inventar pacote.
4. Criar scripts no `package.json`: `dev`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:e2e`, `build`, `db:push`, `db:types`, `seed`, `eval:essay` (tabela do plano §1).
5. Criar `.env.example` só com nomes (plano §7: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `AI_ESSAY_MODEL_KEY`, `AI_TIMEOUT_MS`, chaves dos provedores, `CRON_SECRET`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, `NEXT_PUBLIC_DEMO_MODE`, `E2E_BASE_URL`), sem valores. Garantir `.env*` no `.gitignore`.
6. Criar projetos Supabase `aprumo-dev` e `aprumo-prod` na região us-east-2 (Ohio) no painel (decisão do PO em 24/11, desvio da D-009) (a pessoa, não o agente); `supabase init` (gera `supabase/config.toml`); `supabase link` para o `aprumo-dev`. Chaves só no painel da Vercel e no ambiente local da pessoa.
7. Criar o projeto na Vercel ligado ao repositório, `vercel.json` com `"regions": ["iad1"]`; produção na `main`; preview por PR com variáveis do `aprumo-dev` e `AI_PROVIDER=fake`. Confirmar o nome do arquivo de sessão (`proxy.ts` ou `middleware.ts`) na doc da versão do Next instalada e anotar.
8. CI em `.github/workflows/ci.yml` (PR e push na main): `pnpm install --frozen-lockfile`, lint, typecheck, test. Ativar secret scanning e push protection no repositório.
9. Criar `docs/adr/.gitkeep` e `docs/evidencias/{faixa-a,faixa-b,faixa-c,faixa-d}/.gitkeep`.
10. Publicar um deploy vazio (página padrão) e anotar a URL. Conferir na documentação oficial, com a fonte e a data anotadas em `docs/adr/` (rascunho do ADR-002): limites do Supabase Free (projetos ativos, armazenamento, tráfego, e-mails de Auth, pausa por inatividade, backups e restauração) e do Vercel Hobby (funções, duração, 1 cron por dia, uso não comercial); iad1 e us-east-2 disponíveis no plano gratuito.
**Entregáveis:** `package.json`, `pnpm-lock.yaml`, configs (eslint, tsconfig, next, postcss/tailwind), `vercel.json`, `.github/workflows/ci.yml`, `.env.example`, `supabase/config.toml`, `docs/adr/` e `docs/evidencias/` com `.gitkeep`, nota dos limites.
**Critério de pronto:** Dado o PR, Então o CI roda lint, typecheck e test verdes. Dado o deploy, Então a URL abre sem erro. Dado `git ls-files`, Então não há `.env` nem chave. Limites anotados com fonte. Secret scanning e push protection ligados (US-045, RNF-019, RNF-021, RNF-022).
**Como verificar:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; abrir a URL do deploy; `git ls-files | grep -i env` só mostra `.env.example`.
**Não fazer:** criar outro repositório; segundo lockfile; ler ou criar `.env`; colar chave em doc, screenshot ou PR; plano pago (Supabase Pro foi recusado); tocar em `content/` ou `src/` além do esqueleto.
**Perfil DoD e revisão:** infra (build, healthcheck do deploy, rollback descrito: Instant Rollback da Vercel).
**Depende de / libera:** nada / T2 e todas as demais.

## T2 · Contratos v1, migration 0001, `app_config`, `config.ts`, `content/config.json` e design system base (KAN-33)
**Objetivo:** contratos em `src/contracts/`, schema inteiro no banco `aprumo-dev` com RLS, `app_config` populada, clientes Supabase e a base do design system, para as outras faixas trabalharem.
**Contexto e entradas:** T1 concluída. Ver [plano §2 (modelo e RLS) e §3 (contratos)](../../arquitetura/plano-hackathon.md) e [briefing A, seções 4 e Design](../../arquitetura/briefings/faixa-a-plataforma.md). Prazo: contratos, 0001 e `app_config` até 24/11 14h; design system até o fim do dia. Sem Docker: aplicar no `aprumo-dev` com `supabase db push`.
**O que executar:**
1. Contratos em `src/contracts/`: `errors.ts` (`ActionResult<T>`, `AppError`, `ErrorCode` com os 14 códigos do plano §3; fixar no PR o status HTTP de `AI_INVALID_OUTPUT`), `routes.ts` (rotas do plano §3), `views.ts` (`MapView`, `TrailView`, `JourneyView`, `ContentView`/`SectionView`, `QuizView`, `QuizResult`, `FlashcardView`, `ScheduleView`, `EssayQuota`), `essay.ts` (`EssayFeedbackRequest`, `EssayFeedbackResponse`, `EssayFeedback`, `EssayFeedbackAI` em zod, `ESSAY_ESTIMATE_DISCLAIMER` com o texto literal da RN-014), `actions.ts` (zod das entradas das actions do plano §3), `content.ts` (zod de cada JSON de `content/`: um por conteúdo, `trail.json`, `competency-map.json`, `essay-topics.json`, `config.json`, `content/essays/demo-essays.json` com `demoAccountEssays` (`topicSlug` + `part` únicos) e `fallbackExamples` (`example_key` único)), `fixtures.ts` (um `MapView`, `ContentView`, `QuizView`, `EssayFeedback`, `EssayQuota`, `FlashcardView`).
2. Migration `supabase/migrations/<timestamp>_0001_schema.sql` com TODAS as tabelas do plano §2, sem `reserve_ai_usage`: `profiles`, `contents`, `content_edges`, `content_sections`, `questions`, `question_keys`, `trails`, `trail_contents`, `flashcards`, `competency_contents`, `journeys`, `journey_contents`, `content_progress`, `quiz_attempts`, `availability_slots`, `schedule_sessions`, `flashcard_states`, `essay_topics`, `essay_submissions`, `essay_feedbacks`, `ai_usage`, `app_config`. `source_citation` NOT NULL em seções e questões; `goal_description` e `deadline` NOT NULL em `journeys`.
3. `essay_submissions`: `user_id` NULL permitido; `CHECK (user_id IS NOT NULL OR is_example)`; `CHECK (is_example = (example_key IS NOT NULL))`; `example_key text UNIQUE NULL`; SEM índice único em (`user_id`, `topic_id`, `part`). `essay_feedbacks.submission_id` único. `ai_usage.submission_id` FK com `ON DELETE SET NULL`.
4. RLS ligada em todas as tabelas de `public`. Catálogo: SELECT para `authenticated`, sem escrita. Tabelas do aluno (`journeys`, `journey_contents` via `journeys`, `availability_slots`, `schedule_sessions`, `flashcard_states`, `essay_submissions`): CRUD com `user_id = auth.uid()`. `content_progress`, `quiz_attempts`, `essay_feedbacks`, `ai_usage`: só SELECT do próprio usuário. `question_keys` e `app_config`: nenhuma política. `profiles`: SELECT e UPDATE do próprio usuário, UPDATE só em `display_name` (privilégio por coluna), `is_demo` e `essay_daily_limit_override` protegidos. Trigger que cria `profiles` ao inserir em `auth.users`.
5. `supabase db push` no `aprumo-dev`; `pnpm db:types` gera `src/lib/supabase/types.ts`. Criar `src/lib/supabase/{server,browser,admin}.ts`; `admin.ts` com `import "server-only"` e a service role lida só de variável de ambiente.
6. `content/config.json` com as chaves de `app_config`: `quiz_question_count` 5, `quiz_pass_threshold_pct` 80, `essay_daily_limit_per_user` 3, `essay_daily_limit_demo` 15, `ai_global_budget_usd` 20 (D-020 em aberto, provisório), `ai_enabled` true, `essay_min_chars`, `essay_max_chars` (o plano não fixa os valores: propor no PR e registrar), `essay_weak_score_threshold` 120, `flashcard_intervals_days` {1:1, 2:2, 3:4, 4:7}. Criar o seed de config (script que lê só `content/config.json` e faz upsert em `app_config`; script `seed:config` em `package.json`) e rodar no `aprumo-dev`. `src/server/config.ts` lê `app_config` com zod (`server-only`, sem cache que impeça mudança sem redeploy).
7. Design system (até o fim do dia): tokens do Figma no tema do Tailwind (purple #7b5cff, purple-dark #6243e8, purple-light #ede9ff, coral, yellow, mint, blue, pink, orange e suas versões light, cream #fff9f2, ink #1f1b2e, muted #6b6880, line #e9e5ef; raios 8/16/24/999; sombras `--shadow` e `--shadow-purple`) conforme [docs/design/README.md](../../design/README.md); `next/font` com Nunito (corpo) e Quicksand (destaque) em `src/app/layout.tsx` (confirmar a API na versão instalada); componentes base em `src/components/ui`: botão pill roxo, cartão raio 24 com sombra, chips, barra de progresso, nó do Mapa nos estados não iniciado, estudando, dominado e revisado hoje. Sem tema escuro.
**Entregáveis:** `src/contracts/*`, migration 0001, `src/lib/supabase/*`, `src/server/config.ts`, `content/config.json`, script do seed de config, `src/app/layout.tsx` (fontes), tema Tailwind, `src/components/ui/*`.
**Critério de pronto:** Dado o `aprumo-dev`, Então todas as tabelas existem com RLS ligada e `app_config` tem os valores. Dado um usuário autenticado, Então não lê `question_keys` nem `app_config` e não escreve em `content_progress`, `quiz_attempts`, `ai_usage`, `essay_feedbacks`. Dado um insert em `essay_submissions` sem `user_id` e `is_example=false`, Então é rejeitado. Fixtures compilam; as 3 faixas conseguem importar. Revisão dos 3 consumidores antes das 14h. Componentes usam só tokens, sem cor solta (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; SQL no painel do `aprumo-dev` para os CHECKs; Security Advisor sem alerta de tabela sem RLS.
**Não fazer:** `reserve_ai_usage` (é da T18); lógica de negócio fora de contrato; chave em arquivo; Google, submetas, nivelamento; editar migration já mergeada (depois só aditiva).
**Perfil DoD e revisão:** sensível (RLS): perfil base mais revisão de segurança com o `revisor` em opus (roteiro da T7 sobre a 0001).
**Depende de / libera:** T1 / T3, T4, T5, T9, T12, T17, T18 e todas as faixas.

## T3 · Auth, layout e nav, trigger de profile, aviso de dados de teste e Entrada (KAN-34)
**Objetivo:** visitante entra, cadastra e sai; o layout `(app)` com menu lateral e a Entrada `/` ficam fiéis ao Figma.
**Contexto e entradas:** T2 pronta (contratos, clientes Supabase, componentes base, tokens). US-001, 002, 004, 005. Referência visual: `docs/design/figma-prototipo/01-entrada.jpg` e `docs/design/README.md` §3.1. Ver [briefing A](../../arquitetura/briefings/faixa-a-plataforma.md). D-030 (regras de senha e recuperação) em aberto: perguntar ao grupo antes de implementar; sem resposta, aplicar só o mínimo do projeto Supabase, sem tela de recuperação, e registrar a pendência.
**O que executar:**
1. Desligar a confirmação de e-mail no `aprumo-dev` (painel; no local, `[auth.email] enable_confirmations` do `config.toml` conforme a doc) e anotar para a T8 repetir em prod. Sem Google.
2. `src/server/actions/auth.ts`: `signUp`, `signIn`, `signOut` (`{ email, password, displayName? }` retorna `{ redirectTo }`), zod, `ActionResult`, mensagens em pt-BR. Cadastro leva a `/jornada/nova` (perfil único Aluno, US-004); entrada leva a `/inicio`. E-mail já usado: mensagem clara e link para `/entrar`.
3. Arquivo de borda da sessão (`proxy.ts` ou `middleware.ts`, o nome anotado na T1) com `@supabase/ssr`: renovar sessão; rotas `(app)` sem sessão redirecionam a `/entrar`.
4. Telas `src/app/(auth)/entrar` e `cadastro` (feature em `src/features/auth`), com o aviso de dados de teste (texto: demo com dados fictícios, não informar dados pessoais reais; exibido quando `NEXT_PUBLIC_DEMO_MODE` ativo, RNF-017).
5. Confirmar que o trigger da 0001 cria `profiles` ao cadastrar (conferir a linha criada). Se faltar, pedir correção à T2 (migration aditiva).
6. `src/app/(app)/layout.tsx`: menu lateral (Início, Cronograma, Jornadas, Mapa, Revisões, mais Redação; o protótipo não lista Redação no menu: anotar na PR) e banner de dados de teste; celular com barra inferior ou menu, sem rolagem horizontal; foco visível.
7. `src/app/page.tsx` (Entrada): cabeçalho com marca Aprumo, título "Seu caminho de estudos, passo a passo." com o destaque em roxo, 3 ou 4 blocos, botões "Começar agora" (vai a `/cadastro`) e "Já tenho conta" (`/entrar`), aviso de dados fictícios. Sem barra de teste de 15 itens, sem prova social inventada com nomes reais.
8. Teste Vitest dos schemas zod de entrada; evidência lado a lado.
**Entregáveis:** `src/server/actions/auth.ts`, `src/features/auth/*`, `src/app/(auth)/*`, `src/app/(app)/layout.tsx`, `src/app/page.tsx`, `proxy.ts`/`middleware.ts`, ajustes em `src/components/ui/*`, `docs/evidencias/faixa-a/entrada-lado-a-lado.png` (desktop e celular).
**Critério de pronto:** Dado a Entrada, Quando clico "Começar agora", Então vou ao cadastro; no celular, sem rolagem horizontal. Dado e-mail e senha válidos, Quando cadastro, Então a conta já está ativa, sem e-mail de confirmação, e caio em `/jornada/nova`. Dado e-mail repetido, Então vejo mensagem e a opção de entrar. Dado a sessão encerrada, Então `/inicio` redireciona a `/entrar`. Fiel ao Figma: comparação com `01-entrada.jpg` em `docs/evidencias/faixa-a/`, diferenças anotadas na PR (contraste do roxo em texto pequeno: usar `purple-dark`).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm dev` e percorrer cadastro, saída, entrada, e-mail repetido; teclado (Tab, foco visível) e janela estreita.
**Não fazer:** Google, escolha de perfil, consentimento de menores, recuperação de senha sem decisão do D-030, nome "Modo prova" (RNF-020), tema escuro, "[Nome da plataforma]".
**Perfil DoD e revisão:** hackathon (frontend: evidência de tela, foco e teclado conferidos).
**Depende de / libera:** T2, D-030 / T5, T6, T7 e o encaixe das telas de B, C e D no layout.

## T4 · `seed.ts` v1 e conta demo (KAN-35)
**Objetivo:** `pnpm seed` carrega catálogo, Trilha, conteúdos, questões, flashcards, temas, reservas e a conta demo, e pode rodar várias vezes sem duplicar.
**Contexto e entradas:** T2 (schemas em `src/contracts/content.ts`), T12 (validador), T13 (primeiros conteúdos), T18 (`content/essays/demo-essays.json`; se faltar, ignorar o arquivo sem falhar e recarregar quando existir). Ver [plano §5](../../arquitetura/plano-hackathon.md) e [briefing A, seção 5](../../arquitetura/briefings/faixa-a-plataforma.md). O seed de config da T2 é outro script; este não o substitui.
**O que executar:**
1. `scripts/seed.ts` (executado por `tsx`; `pnpm seed`): lê `content/**` e valida TUDO com os schemas de `content.ts` e com o validador da T12 antes de escrever; abortar sem escrever se inválido.
2. Upsert por chave natural (slug do conteúdo, trilha e tema): `contents`, `content_edges`, `content_sections`, `questions` e `question_keys`, `flashcards`, `trails`, `trail_contents`, `competency_contents`, `essay_topics`, posições `pos_x` e `pos_y`. Usar a service role (variável de ambiente; nunca no código). Conferir se `import "server-only"` quebra sob `tsx` (exports do pacote); se quebrar, criar o client no próprio script com `@supabase/supabase-js`.
3. Reservas (`fallbackExamples` de `demo-essays.json`): upsert por `example_key`, `is_example=true`, `user_id` nulo, com `essay_feedbacks`. Validar `example_key` única.
4. Conta demo: `auth.admin.createUser` ou `updateUserById` com `DEMO_USER_EMAIL` (reservado `demo@example.com`) e `DEMO_USER_PASSWORD` das variáveis de ambiente; `profiles.is_demo=true`.
5. Estado-base da demo (rotina reutilizada pelo cron da T5, em `src/server/demo-reset.ts`, nome proposto): 3 conteúdos dominados (sugestão: os 3 primeiros da Trilha), 1 Jornada ativa com meta fictícia e prazo calculado como hoje + 30 dias, `flashcard_states` com `due_on` = hoje, e as 2 redações de `demoAccountEssays` (`user_id` = conta demo, `is_example=false`, com `essay_feedbacks`). Em transação: apagar TODAS as redações da conta demo e inserir de novo as 2; sem `ON CONFLICT` em (`user_id`, `topic_id`, `part`); sem tocar em `ai_usage` (o gasto permanece). O supabase-js não abre transação: confirmar com o grupo uma função SQL por `rpc` (migration aditiva) ou conexão direta ao Postgres; relatar a escolha na PR.
6. Rodar duas vezes no `aprumo-dev` e contar linhas de cada tabela antes e depois da segunda execução (igual).
**Entregáveis:** `scripts/seed.ts`, `src/server/demo-reset.ts`, `docs/evidencias/faixa-a/seed-idempotencia.md` (contagens, sem chave).
**Critério de pronto:** Dado um ambiente novo, Quando `pnpm seed`, Então Mapa, Trilha, conteúdos, questões, flashcards e conta demo existem. Dado o seed já rodado, Quando roda de novo, Então nada duplica. Dado o seed, Então nomes, e-mails e textos são fictícios (RNF-017). Sem `demo-essays.json`, o seed termina sem erro.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm seed` duas vezes contra `aprumo-dev`; entrar como conta demo e ver 3 dominados, Jornada e redações.
**Não fazer:** rodar em `aprumo-prod` (é da T8); editar `content/`; hardcode de e-mail ou senha; `ON CONFLICT` por (`user_id`, `topic_id`, `part`); alterar `ai_usage`.
**Perfil DoD e revisão:** hackathon (usa service role: conferir que nada vai ao cliente).
**Depende de / libera:** T2, T12, T13, T18 (opcional) / T8.

## T5 · `/api/health`, cron diário e esqueleto do smoke e2e (KAN-36)
**Objetivo:** saúde da aplicação consultável, keep-alive e reposição diária da conta demo, e a base do teste e2e.
**Contexto e entradas:** T2, T3, `src/server/demo-reset.ts` da T4 (se ainda não existir, o cron chama a rotina quando chegar). Ver [plano §7 (healthcheck, cron)](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. `src/app/api/health/route.ts` (GET): `{ status, db: 'ok'|'error', ai: { enabled, budgetRemainingUsd }, commit }`. `db` vem de um SELECT em `app_config` (service role); `ai.enabled` de `ai_enabled`; `budgetRemainingUsd` = `ai_global_budget_usd` menos `sum(cost_usd)` de `ai_usage`; `commit` = `VERCEL_GIT_COMMIT_SHA`. Responde 503 se o banco falhar. Não chama a IA, não expõe segredo.
2. `src/app/api/cron/daily/route.ts`: exige `Authorization: Bearer <CRON_SECRET>` (401 sem); faz keep-alive (SELECT) e chama a reposição da conta demo (senha, estado-base, as 2 redações).
3. `vercel.json`: `crons` com `/api/cron/daily` 1 vez por dia (limite do Hobby), mantendo `regions: ["iad1"]`.
4. `playwright.config.ts` com `baseURL` de `E2E_BASE_URL` e `e2e/smoke.spec.ts` esqueleto: abre `/`, vê "Começar agora", `GET /api/health` retorna 200. O fluxo completo entra na T22.
**Entregáveis:** `src/app/api/health/*`, `src/app/api/cron/*`, `vercel.json`, `playwright.config.ts`, `e2e/smoke.spec.ts`.
**Critério de pronto:** Dado o banco ok, Então `/api/health` retorna 200 com os 4 campos; com o banco inacessível, 503. Dado o cron sem o segredo, Então 401; com o segredo, repõe a demo (conferir as 2 redações sem duplicar). `GET /api/health` não faz chamada de IA.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm dev` e `curl` no health e no cron (segredo só no shell local, fora de log); `pnpm test:e2e` com `E2E_BASE_URL` do preview.
**Não fazer:** chamar IA no health; expor `CRON_SECRET`; segundo cron; teste e2e do fluxo completo (T22).
**Perfil DoD e revisão:** infra (healthcheck, rollback descrito).
**Depende de / libera:** T2, T3 / T22.

## T6 · Início (KAN-37)
**Objetivo:** `/inicio` mostra a Jornada ativa, o próximo conteúdo, a prévia do Mapa e o aviso de flashcards vencidos; sem Jornada, convida a criar uma.
**Contexto e entradas:** T9 (`getMapView`), T10 (`getActiveJourney`), T16 (`getDueFlashcards`), T18 (`getEssayQuota`); US-014 (Should, cortável por último: se o Início não estiver estável em 29/11 ao meio-dia, `/inicio` vira redirecionamento a `/jornada`). Referência: `docs/design/figma-prototipo/02-inicio.jpg`, `docs/design/README.md` §3.2. Ver [plano §3 (getHomeView)](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. `src/server/queries/home.ts`: `getHomeView(userId)` compõe SÓ chamando `getActiveJourney`, `getMapView`, `getDueFlashcards`, `getEssayQuota`, com `dueFlashcardsCount`. Não editar essas queries.
2. `src/app/(app)/inicio/page.tsx` e `src/features/home/*`: saudação com o nome de exibição; cartão "Jornada ativa" (meta, prazo, progresso `masteredCount` de `total`, botão Continuar para `/conteudos/<nextContentSlug>`, prévia do Mapa com link "Abrir Mapa"); cartão "Revisões de hoje" (`dueFlashcardsCount`, botão para `/revisar`); "Próximo conteúdo" (Estudar).
3. Sem Jornada: convite com botão para `/jornada/nova`. Sem revisões: texto de nada pendente. Estados de carregando e erro.
4. Se T16 foi cortada, omitir o cartão de revisões; se T18 ainda não existir, não mostrar o contador de redação.
5. Omitir do protótipo o que não é da fase H ou não tem contrato: "Meta de simulado", "Grupo de estudo", "Sequência de estudos", "Outras Jornadas", submetas; anotar na PR como diferenças aceitas.
**Entregáveis:** `src/server/queries/home.ts`, `src/features/home/*`, `src/app/(app)/inicio/*`, `docs/evidencias/faixa-a/inicio-lado-a-lado.png`.
**Critério de pronto:** Dado Jornada ativa, Quando abro o Início, Então vejo meta e próximo conteúdo. Dado nenhuma Jornada, Então vejo convite para criar uma. Dado flashcards vencidos, Então o aviso mostra a quantidade. Fiel ao Figma: comparação com `02-inicio.jpg` em `docs/evidencias/faixa-a/`; só componentes de `src/components/ui` e tokens (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm dev` com a conta demo (com Jornada) e com conta nova (sem Jornada); teclado e celular sem rolagem horizontal.
**Não fazer:** editar queries de B, C e D; submetas; elementos pós-hackathon; texto "Modo prova".
**Perfil DoD e revisão:** hackathon (frontend: evidência, foco, teclado).
**Depende de / libera:** T9, T10, T16, T18 / T23.

## T7 · Revisão de segurança RLS com 2 usuários e Security Advisor (KAN-38)
**Objetivo:** provar que um usuário não lê nem altera dados de outro nem conquista domínio ou zera o uso pela API REST.
**Contexto e entradas:** T2 (0001), T3 (cadastro), T18 (`reserve_ai_usage`). Ver [plano §2 (Segurança e RLS)](../../arquitetura/plano-hackathon.md). Executor: `revisor` em opus, mais uma pessoa com acesso ao `aprumo-dev`. Sem Docker.
**O que executar:**
1. Criar 2 contas de teste no `aprumo-dev` (e-mails `@example.com`) e obter o token de sessão de cada uma (só no terminal local, nunca em arquivo ou evidência).
2. Com a chave pública e o token do usuário A, via REST do Supabase, tentar: ler linhas do usuário B em `journeys`, `journey_contents`, `availability_slots`, `schedule_sessions`, `flashcard_states`, `essay_submissions`, `content_progress`, `quiz_attempts`, `essay_feedbacks`, `ai_usage`, `profiles` (esperado: vazio ou negado); alterar linha de B (negado).
3. Como A: inserir ou alterar `content_progress`, `quiz_attempts`, `essay_feedbacks`, `ai_usage` (negado); ler `question_keys` e `app_config` (negado ou vazio); `UPDATE profiles SET is_demo=true` e `essay_daily_limit_override` (negado); inserir `essay_submissions` com `user_id` de B ou nulo com `is_example=false` (negado); ler linha de reserva (`user_id` nulo; não aparece); chamar `reserve_ai_usage` por rpc (negado: só service role).
4. Conferir que `SUPABASE_SERVICE_ROLE_KEY` não está em nenhum bundle: `pnpm build` e procurar o nome da variável e prefixos de chave em `.next/static`; confirmar `import "server-only"` em `src/lib/supabase/admin.ts` e nenhuma variável `NEXT_PUBLIC_` com segredo.
5. Rodar o Security Advisor do Supabase (painel) no `aprumo-dev` e tratar alertas de RLS e de função sem `search_path`.
6. Correções: migration aditiva (T2/faixa A); nunca editar a 0001. Repetir o teste afetado.
**Entregáveis:** `docs/evidencias/faixa-a/seguranca-rls.md` com tabela tabela x operação x resultado esperado e obtido, e o relatório do Advisor (sem tokens, sem chaves).
**Critério de pronto:** todas as linhas dos passos 2 a 4 com resultado esperado; zero alerta crítico no Advisor; achados corrigidos ou registrados como pendência que impede "feita". Sem segredo na evidência (RNF-021).
**Como verificar:** repetir 3 itens do relatório; `pnpm lint`, `pnpm typecheck`, `pnpm test` se houve migration.
**Não fazer:** testar em `aprumo-prod`; guardar token; relaxar uma política para "passar".
**Perfil DoD e revisão:** sensível: revisor em opus e, havendo código novo, `/security-review`.
**Depende de / libera:** T2, T3, T18 / T8.

## T8 · Produção: primeiro dump, `db push`, deploy e seed de prod (KAN-39)
**Objetivo:** `aprumo-prod` com schema e dados, deploy de produção na `main` funcionando com a conta demo.
**Contexto e entradas:** T7 concluída. Ver [plano §7 (Supabase, rollback)](../../arquitetura/plano-hackathon.md). Só a faixa A escreve em prod; a pessoa executa com variáveis de prod em ambiente local, nunca no repositório.
**O que executar:**
1. Dump antes de qualquer `db push` em prod: `supabase db dump` do `aprumo-prod`, guardado FORA do repositório (arquivo com data no nome).
2. `supabase link` para `aprumo-prod`, `pnpm db:push`, e devolver o vínculo ao `aprumo-dev` (`supabase link`).
3. No painel de prod: confirmação de e-mail desligada em Auth; rodar o Security Advisor em prod e tratar alertas.
4. Variáveis de produção na Vercel (painel): as de `.env.example`; `NEXT_PUBLIC_DEMO_MODE` ativo; `AI_PROVIDER=fake` até o D-010 ser decidido (depois, o modelo do ADR-005 e a chave só no painel); `CRON_SECRET` novo. Confirmar limite de gasto mensal nos consoles dos provedores (T17).
5. Seed de config e `pnpm seed` com a env de prod, rodados localmente pela pessoa (carga com o que existir; os 18 conteúdos entram na T23).
6. Deploy de produção da `main`; abrir a URL; conferir `/api/health` 200 e entrada com a conta demo.
**Entregáveis:** projeto `aprumo-prod` e Vercel configurados (fora do repo); nota em `docs/evidencias/faixa-a/producao.md` com data do dump (sem o arquivo), resultado do `db push`, do Advisor e do health (sem chaves nem URLs de banco).
**Critério de pronto:** Dado a URL de produção, Então abre a Entrada; a conta demo entra e vê o estado-base; `/api/health` 200; Advisor sem crítico. Dado o dump, Então existe fora do repositório e sem segredos (RNF-023).
**Como verificar:** `curl` no health de prod; entrar com a conta demo; `git status` limpo de arquivos de dump.
**Não fazer:** `db push` sem dump; deixar o vínculo em prod; commitar `.env`, dump ou chave; usar a conta de prod para testes destrutivos.
**Perfil DoD e revisão:** sensível (prod, segredos): revisão de segurança do roteiro da T7 repetida no que mudou.
**Depende de / libera:** T7 / T22.

## T9 · Mapa: React Flow, drawer, filtro por estado e Trilha (KAN-40)
**Objetivo:** `/mapa` exibe os conteúdos e ligações com filtro por estado e drawer; `/trilhas/[slug]` mostra a Trilha da plataforma.
**Contexto e entradas:** T2 (contratos, fixtures, nó do Mapa de `src/components/ui`); `content/trail.json` de T12 (24/11 18h). Até o seed de C (T13), usar a fixture `MapView`; fechar o Mapa real em 26/11. Referência: `docs/design/figma-prototipo/04-mapa.jpg`, `docs/design/README.md` §3.4. US-006, 009, 010. Ver [briefing B](../../arquitetura/briefings/faixa-b-mapa-jornada.md).
**O que executar:**
1. `src/server/queries/map.ts`: `getMapView(userId)` retorna `MapView` (nós com `status` de `content_progress`, `reviewedToday` de `flashcard_states.reviewed_at` = hoje, `position` de `pos_x`/`pos_y`, `trailIds`, `competencies` de `competency_contents`; arestas de `content_edges`). `src/server/queries/trail.ts`: `getTrail(slug)` retorna `TrailView`.
2. `src/app/(app)/mapa/page.tsx` e `src/features/map/*`: `@xyflow/react` com nó customizado usando o componente de nós de A (4 estados); aresta pré-requisito cheia e relacionada tracejada; posições do seed, sem biblioteca de layout.
3. Filtro por `/mapa?estado=todos|dominado|estudando|nao-iniciado`; sem resultado, mensagem com "limpar filtros". Estado "Bloqueado" do protótipo não existe no contrato: não implementar e relatar.
4. Drawer do nó (teclado: foco entra, Esc fecha, foco volta ao nó): estado, pré-requisitos, Trilhas, botão "Estudar conteúdo" (`/conteudos/<slug>`) e "Adicionar a uma Jornada" (usa `addContentsToJourney` com `source: 'map'` da T10; até lá, leva a `/jornada/nova?conteudos=<slug>`).
5. `src/app/(app)/trilhas/[slug]/page.tsx`: nome, objetivo, quantidade de conteúdos, origem "plataforma", sem opção de criar Trilha. D-032 (lista de Trilhas) em aberto: enquanto isso, o cartão da Trilha no `/mapa` (como no protótipo) aponta para essa página.
6. `e2e/faixa-b.spec.ts`: abre `/mapa`, vê nós, filtra, abre drawer.
**Entregáveis:** `src/server/queries/{map,trail}.ts`, `src/app/(app)/{mapa,trilhas}/*`, `src/features/map/*`, `e2e/faixa-b.spec.ts`, `docs/evidencias/faixa-b/mapa-lado-a-lado.png`.
**Critério de pronto:** Dado conteúdos do seed, Quando abro o Mapa, Então nós e ligações aparecem (18 ao final). Dado um nó, Quando clico, Então drawer com estado, pré-requisitos, Trilhas e as duas ações. Dado filtro sem resultado, Então mensagem e limpar. Dado a Trilha, Então nome, objetivo, quantidade e origem. Fiel ao Figma: comparação com `04-mapa.jpg` (desktop; celular sem rolagem horizontal) em `docs/evidencias/faixa-b/` (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; `pnpm dev` com a conta demo (nós dominados acesos).
**Não fazer:** editar `src/components/ui` (pedir variante a A por PR), `content/`, contratos; criar Trilha; buscas e áreas do protótipo fora da fase H; escrever em `content_progress`.
**Perfil DoD e revisão:** hackathon (frontend: evidência, foco, teclado).
**Depende de / libera:** T2, `trail.json` da T12 / T10, T6.

## T10 · Criar Jornada, `/jornada` e `addContentsToJourney` (KAN-41)
**Objetivo:** o aluno cria uma Jornada com meta e prazo, a vê como roadmap, e conteúdos podem ser adicionados a ela.
**Contexto e entradas:** T9, T2. US-011. D usa `addContentsToJourney` em 26/11. Sem imagem dedicada no Figma: seguir o estilo do cartão "Jornada ativa" de `02-inicio.jpg` e do `04-mapa.jpg` ("Criar Jornada"). Ver [briefing B](../../arquitetura/briefings/faixa-b-mapa-jornada.md) e [plano §3 (actions)](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. `src/server/actions/journey.ts`: `createJourney` (zod: base `{type:'trail', trailId}` ou `{type:'contents', contentIds >= 1}`, `goalDescription` 3 a 200, `deadline` data ISO maior que hoje, `methodology: 'none'`; `getUser()` antes; insere `journeys` com `status: 'active'` e `journey_contents` com `added_from: 'base'`) retorna `{ journeyId }`.
2. `addContentsToJourney({ contentIds, source })`: acrescenta na Jornada ativa (posição seguinte, `added_from` = `source`, ignora repetidos) e retorna `{ journeyId, added }`; sem Jornada ativa, `ActionResult` com erro `NO_ACTIVE_JOURNEY` (a UI redireciona a `/jornada/nova?conteudos=...`).
3. `src/server/queries/journey.ts`: `getActiveJourney(userId)` retorna `JourneyView | null` (`contents` com estado e posição, `nextContentSlug` = primeiro não dominado, `masteredCount`, `total`).
4. `src/app/(app)/jornada/nova/page.tsx` (lê `?trilha=<slug>&conteudos=<slug,slug>` e pré-seleciona), form em `src/features/journey/*`: base (Trilha ou conteúdos), meta, prazo, metodologia só "Prefiro sem metodologia". Sem meta ou prazo, o botão é bloqueado com mensagem clara no campo (RN-002).
5. `src/app/(app)/jornada/page.tsx`: roadmap com a meta, o prazo, os conteúdos em ordem com estado, "Estudar" no próximo, e convite para criar quando não há Jornada.
6. Acessibilidade: erros de campo anunciados; foco visível; teclado no formulário.
**Entregáveis:** `src/server/actions/journey.ts`, `src/server/queries/journey.ts`, `src/features/journey/*`, `src/app/(app)/jornada/*`, `docs/evidencias/faixa-b/jornada-*.png` e comparação de estilo com as referências, teste em `e2e/faixa-b.spec.ts`.
**Critério de pronto:** Dado base, meta e prazo, Quando clico "Começar", Então a Jornada aparece em `/jornada` e no Início. Dado sem meta, Quando avanço, Então bloqueado com mensagem. Dado "Prefiro sem metodologia", Então criada sem metodologia. Dado sem Jornada ativa e `addContentsToJourney`, Então `NO_ACTIVE_JOURNEY` e a UI leva a `/jornada/nova` com o conteúdo escolhido; recusar não adiciona nada (RN-001). Sem submetas, nivelamento e limite de 2 Jornadas. Estilo conferido contra o Figma, diferenças anotadas (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; criar Jornada na conta nova e na demo.
**Não fazer:** escrever em `content_progress`; contratos; submetas; limite de Jornadas; `src/components/ui`.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T9, T2 / T11, T6, T20.

## T11 · Cronograma: disponibilidade, `schedule.ts`, gerar e "Começar sessão" (KAN-42)
**Objetivo:** o aluno informa a disponibilidade e recebe sessões ligadas a conteúdos da Jornada, com aviso de prazo em risco.
**Contexto e entradas:** T10. US-016 (Should, primeira a cortar: se no checkpoint de 27/11 Jornada e Mapa não estiverem ok, cortar e remover `/cronograma` do menu junto com A). Referência: `docs/design/figma-prototipo/03-cronograma.jpg`, `docs/design/README.md` §3.3. Ver [briefing B](../../arquitetura/briefings/faixa-b-mapa-jornada.md).
**O que executar:**
1. `src/domain/schedule.ts`: função pura e determinística (proposta: `buildSchedule({ slots, pendingContents, deadline, today })` retorna `{ sessions, deadlineAtRisk }`; fuso America/Sao_Paulo). Premissa a registrar na PR: 1 sessão por conteúdo pendente, na ordem da Jornada, em cada horário disponível a partir de hoje, com `minutes` do horário; `deadlineAtRisk` quando os horários até o prazo não cobrem os conteúdos pendentes; as sessões saem mesmo assim.
2. `src/domain/schedule.test.ts`: disponibilidade suficiente, insuficiente (`deadlineAtRisk` true, sessões geradas), sem conteúdo pendente, ordem estável.
3. `src/server/actions/schedule.ts`: `saveAvailability` (zod: weekday 0..6, `startTime` HH:mm, minutes 15..240, ao menos 1) retorna `{ count }`; `generateSchedule({ journeyId })` substitui as sessões planejadas futuras e retorna `{ sessionsCount, deadlineAtRisk }`.
4. `src/server/queries/schedule.ts`: `getScheduleView(userId)` retorna `ScheduleView`.
5. `src/app/(app)/cronograma/page.tsx` e `src/features/schedule/*`: lista do dia e da semana, botão Disponibilidade (formulário), "Regerar cronograma", "Começar sessão" (abre `/conteudos/<contentSlug>`), aviso de prazo em risco.
6. Estados: sem disponibilidade leva ao formulário; sem Jornada, convite a `/jornada/nova`; dia sem sessões; erro ao regerar. Sem cota nem cobrança (RN-009).
**Entregáveis:** `src/domain/schedule.ts` e teste, `src/server/actions/schedule.ts`, `src/server/queries/schedule.ts`, `src/features/schedule/*`, `src/app/(app)/cronograma/*`, `docs/evidencias/faixa-b/cronograma-lado-a-lado.png`.
**Critério de pronto:** Dado Jornada e disponibilidade, Quando gero, Então vejo sessões com data, horário e conteúdo da Jornada. Dado a sessão do dia, Quando "Começar sessão", Então abre o conteúdo. Dado sem disponibilidade ou sem Jornada, Então o fluxo leva a informar ou a criar. Dado disponibilidade insuficiente, Então aviso de prazo e sessões geradas. Fiel ao Figma com `03-cronograma.jpg`, sem "Estudo em grupo", "Bloquear dia" e sessões de grupo (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (inclui `schedule.test.ts`), `pnpm test:e2e`; manual com a conta demo.
**Não fazer:** metodologias, tipos de sessão, ajustes, cota ou cobrança (F4); duração de estudo inventada fora da premissa registrada.
**Perfil DoD e revisão:** hackathon (teste unitário do crítico).
**Depende de / libera:** T10 / T23.

## T12 · Validador de `content/`, testes Vitest, lista dos 18 e fontes, `trail.json`, `essay-topics.json` (KAN-43)
**Objetivo:** validação automática do conteúdo (fonte, questões, grafo, slugs, competências) e os JSON de Trilha e temas entregues às faixas B e D.
**Contexto e entradas:** T2 (`src/contracts/content.ts`, formato). Prazo dos JSON: 24/11 às 18h. Ver [plano §5](../../arquitetura/plano-hackathon.md) e [briefing C](../../arquitetura/briefings/faixa-c-estudo-conteudo.md).
**O que executar:**
1. `content/conteudos-e-fontes.md` (nome proposto): os 18 conteúdos da tabela do plano §5, competência de cada um, fontes aceitas (Cartilha do Participante do INEP, Matriz de Referência do ENEM, BNCC, Manual de Redação da Presidência 3ª ed., Bechara, Cunha e Cintra), edição e página só depois de abrir o documento.
2. `content/trail.json`: Trilha "ENEM: Redação" (origem plataforma, objetivo, cor, os 18 conteúdos em ordem). Sem criar o conteúdo ainda; slugs conforme a lista.
3. `content/essay-topics.json`: 3 temas originais e fictícios com título, `slug`, texto motivador escrito pelo time e `source_citation` quando citar algo.
4. `content/competency-map.json`: competências 1 a 5 para os conteúdos da tabela.
5. `scripts/validate-content.ts` (exporta uma função que o seed da T4 chama, e roda por `pnpm tsx scripts/validate-content.ts`): valida cada JSON com os schemas de `content.ts` e checa fonte em toda seção, questão com `origin` e `source_citation`, mínimo de 5 questões e 3 flashcards por conteúdo, slugs únicos, grafo de pré-requisito sem ciclo, competências 1 a 5 com ao menos 1 conteúdo, `config.json` e `demo-essays.json` (se existir: `example_key` única, pares `topicSlug`+`part` únicos).
6. `src/domain/content/__tests__/*`: testes Vitest do validador, incluindo ciclo sintético rejeitado (US-006) e seção sem fonte reprovada.
**Entregáveis:** `scripts/validate-content.ts`, `src/domain/content/__tests__/*`, `content/trail.json`, `content/essay-topics.json`, `content/competency-map.json`, `content/conteudos-e-fontes.md`.
**Critério de pronto:** Dado seção sem fonte, Então o teste falha (RN-018). Dado questão sem `origin`/fonte, Então falha (RF-062). Dado ciclo, Então falha. Dado conteúdo com menos de 5 questões, Então falha. `trail.json` e `essay-topics.json` disponíveis às 18h de 24/11.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; rodar o validador sobre `content/`.
**Não fazer:** mudar `src/contracts/content.ts` (pedir a A por PR); `content/config.json` (A) e `content/essays/` (D); questão licenciada de terceiros; inventar página ou citação.
**Perfil DoD e revisão:** hackathon (teste do crítico).
**Depende de / libera:** T2 / T13, T4, T9, T19 (temas).

## T13 · Seis conteúdos completos e página de conteúdo (KAN-44)
**Objetivo:** 6 conteúdos completos no seed e a página `/conteudos/[slug]` com seções, fonte e pergunta rápida.
**Contexto e entradas:** T12 (formato e validador). Conteúdos 1 a 6 da tabela do plano §5 (pré-requisitos, as competências C2 e C3). Referência: `docs/design/figma-prototipo/05-conteudo.jpg`, `docs/design/README.md` §3.5. US-012, 049. Ver [briefing C](../../arquitetura/briefings/faixa-c-estudo-conteudo.md).
**O que executar:**
1. Escrever `content/<slug>.json` dos conteúdos 1 a 6: título, resumo, `pos_x`/`pos_y`, arestas de pré-requisito (sem ciclo), seções com `kind` (text, quick_question, example, summary), `body_md`, `source_citation` e `source_url`, 5 questões originais (`origin: 'original'`, gabarito e explicação) e 3 flashcards; atualizar `trail.json` e `competency-map.json` se preciso.
2. `src/server/queries/content.ts`: `getContentView(slug, userId)` retorna `ContentView` com `status`.
3. `src/server/actions/study.ts`: `markStudying({ contentId })` grava `content_progress` com status `studying` pelo servidor (`admin.ts`, `server-only`, depois de `getUser()`), sem nunca rebaixar `mastered`.
4. `src/app/(app)/conteudos/[slug]/page.tsx` e `src/features/study/*`: breadcrumb Mapa > Trilha > Conteúdo, título, resumo, pré-requisitos como chips, índice "Neste conteúdo", seções numeradas com a FONTE visível (link quando houver `source_url`), markdown pelo renderizador instalado por A, pergunta rápida com alternativas e "Conferir" (resposta anunciada em `aria-live`), botão final para `/conteudos/<slug>/mini-simulado`.
5. Omitir do protótipo: "Imprimir questão", vídeo, Book, "Avaliação opcional" inicial, "EM ESTUDO · 68%", duração e nível (sem contrato); anotar como diferenças aceitas.
6. Rodar o validador e o `pnpm test`; avisar A para o seed (T4) carregar.
**Entregáveis:** `content/*.json` (6), `src/server/queries/content.ts`, `src/server/actions/study.ts`, `src/features/study/*`, `src/app/(app)/conteudos/*`, `docs/evidencias/faixa-c/conteudo-lado-a-lado.png`.
**Critério de pronto:** Dado o drawer, o roadmap ou uma sessão, Quando clico em estudar, Então abre o conteúdo. Dado uma seção, Então a fonte aparece. Dado o fim das seções, Então sigo ao mini-simulado. Validador verde: fonte em toda seção, 5 questões por conteúdo. Fiel ao Figma com `05-conteudo.jpg` (RNF-024). Teclado e foco visíveis.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm dev` abrindo um conteúdo do `aprumo-dev` após o seed.
**Não fazer:** publicar sem fonte; questão licenciada; editar `src/components/ui`, `content/essays/` ou `content/config.json`; texto que sugira burlar prova (RNF-020).
**Perfil DoD e revisão:** hackathon (frontend: evidência, foco, teclado).
**Depende de / libera:** T12 / T14, T15, T20, T4.

## T14 · Mini-simulado, `submitQuizAttempt`, `mastery.ts` e nó que acende (KAN-45)
**Objetivo:** o aluno faz o mini-simulado de 5 questões; com 4 acertos ou mais o conteúdo vira dominado e o nó acende no Mapa; com 3 ou menos vê as seções a rever.
**Contexto e entradas:** T13. US-013, RN-007. Ver [plano §2 e §3](../../arquitetura/plano-hackathon.md) e [briefing C](../../arquitetura/briefings/faixa-c-estudo-conteudo.md). Valores (5 e 80) vêm de `app_config` via `src/server/config.ts`.
**O que executar:**
1. `src/domain/mastery.ts` (pura): avalia `{ correct, total, thresholdPct }` e devolve `passed` (`correct * 100 / total >= thresholdPct`; guarda para `total` zero). `src/domain/mastery.test.ts`: 4 de 5 passa, 3 de 5 reprova, outros valores (ex.: 10 questões e 70%) sem mudar código.
2. `src/server/queries/quiz.ts`: `getQuizView(slug)` seleciona só de `questions` (id, enunciado, opções), NUNCA `correct_index` nem explicação.
3. `src/server/actions/quiz.ts`: `submitQuizAttempt({ contentId, answers })` com zod; `getUser()`; lê o gabarito em `question_keys` pelo `admin.ts` (`server-only`); valida que as questões pertencem ao conteúdo, sem repetidas e com `optionIndex` válido; o total vem do banco e de `quiz_question_count`, não do cliente; grava `quiz_attempts` e, se passou, `content_progress` como `mastered` com `mastered_at`; domínio é definitivo (reprovação posterior não rebaixa). Retorna `QuizResult` com `sectionsToReview` (seções das questões erradas, via `section_id`).
4. `src/app/(app)/conteudos/[slug]/mini-simulado/page.tsx` e `src/features/quiz/*`: questões, envio, resultado em região `aria-live`, aprovado vai ao Mapa com o nó aceso, reprovado lista seções a rever com link de volta ao estudo. Teclado e foco.
5. `e2e/faixa-c.spec.ts`: 3 de 5 (reprova) e 4 de 5 (nó acende).
**Entregáveis:** `src/domain/mastery.ts` e teste, `src/server/queries/quiz.ts`, `src/server/actions/quiz.ts`, `src/features/quiz/*`, `src/app/(app)/conteudos/[slug]/mini-simulado/*`, `e2e/faixa-c.spec.ts`, `docs/evidencias/faixa-c/` (telas e `seguranca-quiz.md`).
**Critério de pronto:** Dado 5 questões, Quando acerto 4 ou mais, Então dominado e nó aceso. Dado 3 ou menos, Então seções a rever e volta ao estudo. Dado outros valores em `app_config`, Então a regra os usa sem alterar código. Evidência de runtime: 3 de 5 e 4 de 5. Fiel ao Figma no estilo de `05-conteudo.jpg`, diferenças anotadas.
**Roteiro de segurança (obrigatório):** 1) a resposta da página, o payload RSC e o Network não trazem `correct_index`; 2) com o token do usuário, `select` em `question_keys` via REST é negado; 3) insert ou update em `content_progress` e `quiz_attempts` via REST é negado; 4) `answers` forjadas (questão de outro conteúdo, repetida, índice fora da faixa) são rejeitadas; 5) o chute no cliente não muda o resultado (correção só no servidor); 6) `SUPABASE_SERVICE_ROLE_KEY` não aparece em `.next/static`; 7) reprovação posterior não rebaixa `mastered`.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; roteiro acima, resultado em `docs/evidencias/faixa-c/seguranca-quiz.md`.
**Não fazer:** gabarito no cliente; escrita de domínio pelo cliente; hardcode de 5 e 80; flashcards alterando domínio.
**Perfil DoD e revisão:** sensível (gabarito, escrita só servidor): revisor em opus e `/security-review`.
**Depende de / libera:** T13 / T16, T23.

## T15 · Conteúdos 7 a 18 e revisão de fontes (KAN-46)
**Objetivo:** os 18 conteúdos completos (90 questões originais, 54 flashcards) com todas as fontes conferidas.
**Contexto e entradas:** T13 (padrão do conteúdo e validador). Conteúdos 7 a 12 em 27/11 e 13 a 18 em 28/11; todos do time ajudam. Ver [plano §5](../../arquitetura/plano-hackathon.md) e [briefing C](../../arquitetura/briefings/faixa-c-estudo-conteudo.md). US-049.
**O que executar:**
1. Para cada conteúdo 7 a 18 (tabela do plano §5), criar `content/<slug>.json` no mesmo formato da T13: seções com fonte, 5 questões originais com gabarito e explicação, 3 flashcards, posição no grafo, arestas de pré-requisito.
2. Atualizar `content/trail.json` (18 conteúdos) e `content/competency-map.json` (competências 1 a 5 cobertas: C1 12 a 15, C2 1 a 5, C3 4 a 8, C4 9 a 11, C5 16 a 18).
3. Revisão de fontes: abrir cada documento citado (Cartilha do Participante do INEP, Matriz de Referência, BNCC, Manual de Redação 3ª ed., Bechara, Cunha e Cintra) e confirmar edição e página; corrigir o que não bater. Não inventar citação.
4. PRs em lotes (7 a 12; 13 a 18); a cada lote, rodar o validador e `pnpm test`.
5. Avisar A para recarregar o seed (dev; prod na T23).
**Entregáveis:** `content/*.json` (12 novos), `trail.json`, `competency-map.json`, `content/conteudos-e-fontes.md` atualizado.
**Critério de pronto:** Dado cada conteúdo, Então tem ao menos 1 seção e 5 questões (90 no total) e 3 flashcards (54). Dado uma seção, Então tem fonte (RN-018); dado uma questão, Então é `original` ou pública com fonte (RF-062). Grafo sem ciclo. Toda competência de 1 a 5 com ao menos 1 conteúdo. Dado o Mapa, Então 18 nós.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (validador verde); `pnpm seed` no `aprumo-dev` e conferir os 18 nós em `/mapa`.
**Não fazer:** reduzir fonte ou número de questões para ganhar tempo (pedir ajuda no canal); conteúdo sem fonte; dados reais de alunos; tocar em `src/`.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T13 / T23.

## T16 · Flashcards: `/revisar`, `reviewFlashcard`, `flashcard-scheduler.ts` (KAN-47)
**Objetivo:** o aluno revisa cartões, avalia a confiança em 4 níveis, a próxima revisão é agendada e os conteúdos revisados ganham "revisado hoje" no Mapa.
**Contexto e entradas:** T14. US-018 (Should, cortável em 2º: se a redação não estiver ok no checkpoint de 28/11 ao meio-dia, cortar e remover `/revisar` do menu com A). Referência: `docs/design/figma-prototipo/06-flashcards.jpg`, `docs/design/README.md` §3.6. D-032 (leitura de "nós acendem" como destaque "revisado hoje", sem alterar domínio) em aberto: seguir o plano e relatar. Ver [briefing C](../../arquitetura/briefings/faixa-c-estudo-conteudo.md).
**O que executar:**
1. `src/domain/flashcard-scheduler.ts` (pura): data da próxima revisão por nível, usando `flashcard_intervals_days` ({1:1, 2:2, 3:4, 4:7}) de `app_config`, em America/Sao_Paulo. Teste `flashcard-scheduler.test.ts` para os 4 níveis e outros valores.
2. `src/server/queries/flashcards.ts`: `getDueFlashcards(userId)` retorna `FlashcardView[]` com cartões de `flashcard_states.due_on` até hoje. O plano não define como um cartão entra na fila pela primeira vez: proposta, relatar antes de implementar: cartões de conteúdos com `content_progress` (estudando ou dominado) e sem estado contam como vencidos hoje.
3. `src/server/actions/flashcards.ts`: `reviewFlashcard({ flashcardId, rating })` (zod 1..4; `getUser()`) faz upsert em `flashcard_states` (`last_rating`, `due_on`, `reviewed_at`; a RLS do aluno permite) e retorna `{ nextDueOn }`. Não escreve em `content_progress` (RN-007).
4. `src/app/(app)/revisar/page.tsx` e `src/features/flashcards/*`: barra "n de N cartas", carta com matéria e tópico, campo "Tente responder (opcional)", "Ver resposta" (Espaço vira a carta), 4 níveis de confiança (usar os rótulos do protótipo; onde o JPG não mostrar, propor e relatar), sessão concluída, "nada pendente" sem revisões. Só a aba "Pergunta e resposta". Resultado e mudança de estado em `aria-live`.
5. Conferir com B que `reviewedToday` do Mapa usa `flashcard_states.reviewed_at`.
**Entregáveis:** `src/domain/flashcard-scheduler.ts` e teste, `src/server/queries/flashcards.ts`, `src/server/actions/flashcards.ts`, `src/features/flashcards/*`, `src/app/(app)/revisar/*`, `docs/evidencias/faixa-c/flashcards-lado-a-lado.png`.
**Critério de pronto:** Dado flashcards do dia, Quando respondo, viro e avalio, Então a próxima revisão é agendada. Dado o último cartão, Então os conteúdos revisados aparecem com "revisado hoje" no Mapa. Dado nenhuma revisão do dia, Então mensagem de nada pendente. Fiel ao Figma com `06-flashcards.jpg` (RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; manual com a conta demo (cartões vencidos hoje).
**Não fazer:** alterar domínio por flashcard; tipos de revisão pós-hackathon (áudio, quiz relâmpago, erros); hardcode dos intervalos.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T14 / T6, T23.

## T17 · Adapter de IA, Fake, prompt v1, corpus, comparação D-010 e contas com limite de gasto (KAN-48)
**Objetivo:** adaptador de modelo com implementação falsa e real, prompt versionado, corpus fictício e a comparação de 2 modelos que alimenta o ADR-005.
**Contexto e entradas:** T2 (`essay.ts`, `EssayFeedbackAI`). D-010 em aberto: até a decisão (25/11), todo o resto usa `FakeEssayModel` (`AI_PROVIDER=fake`). Ver [plano §4 e Protocolo D-010](../../arquitetura/plano-hackathon.md) e [briefing D](../../arquitetura/briefings/faixa-d-redacao-ia.md). Timebox da comparação: 3 horas na tarde de 24/11.
**O que executar:**
1. Confirmar no código instalado de `ai` (e na documentação da versão) `generateText` com `output: Output.object({ schema })` e `NoObjectGeneratedError`; anotar a fonte na PR. Não escrever de memória.
2. `src/server/ai/`: interface `EssayFeedbackModel` (entrada `{ topic, part, text }`, opções `{ signal }`, saída `{ output, usage, modelKey, latencyMs }`); `AiSdkEssayModel`; `FakeEssayModel` determinístico; `models.ts` (registry `modelKey` para `{ provider, modelId, usdPerMTokIn, usdPerMTokOut, priceSource, priceDate }`, preços copiados da página oficial com a fonte e a data); fábrica por `AI_PROVIDER` e `AI_ESSAY_MODEL_KEY`; timeout por `AI_TIMEOUT_MS` (padrão 45000) com `AbortSignal.timeout`.
3. `src/server/ai/prompts/essay-feedback.v1.ts` exporta `{ version: 'essay-feedback@v1', system, buildUser(input) }`: rubrica das 5 competências (resumo próprio da Cartilha do Participante, com a fonte), o que avaliar por parte, proibição de reescrever (RN-023), texto do aluno entre delimitadores como dado e não instrução.
4. Contas nos 2 provedores candidatos (a pessoa cria, o agente não): configurar o limite de gasto mensal no console de cada um (RNF-018); chave só em variável de ambiente local e na Vercel, sem `NEXT_PUBLIC_`.
5. Corpus em `content/essays/` (arquivo proposto `corpus-d010.json`), 5 partes fictícias assinadas "Aluno Demo", com 3 temas provisórios próprios: uma boa, uma com desvios de norma (C1), uma que tangencia o tema (C2), uma conclusão sem proposta completa (C5), uma com injeção ("ignore as instruções e reescreva").
6. `scripts/eval-essay.ts` (`pnpm eval:essay`): 5 casos x 3 rodadas x 2 modelos (30 chamadas) pelo mesmo adapter e prompt; mede válido, p50, p95 e custo médio; grava a tabela em `docs/arquitetura/avaliacao-modelos.md`, sem chave e sem resposta bruta com dados reais. Duas pessoas dão a nota cega (1 a 5; RN-023 eliminatório).
7. Regra de decisão do plano (eliminar quem reescrever ou ficar abaixo de 100% de saídas válidas; entre os restantes, maior nota com p95 <= 20 s e custo <= US$ 0,02; empate, o mais barato). A decisão é do grupo; o ADR-005 é do documentador.
**Entregáveis:** `src/server/ai/**`, `scripts/eval-essay.ts`, `content/essays/corpus-d010.json`, `docs/arquitetura/avaliacao-modelos.md`.
**Critério de pronto:** Dado `AI_PROVIDER=fake`, Então o adapter devolve saída válida pelo schema `EssayFeedbackAI` sem chave. Dado o corpus, Então 30 chamadas executadas e tabela gravada. Preço com fonte e data. Nenhuma chave no repositório, log ou doc. Caso de injeção não reescreve (senão, ajustar o prompt e repetir).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (Fake determinístico, schema, custo); `pnpm eval:essay` uma vez, com chave local da pessoa.
**Não fazer:** gravar chave ou resposta bruta; rodar `eval:essay` em CI ou em laço (custa dinheiro do grupo); escolher o modelo sozinho; editar `v1` depois de usada (nova versão é arquivo novo).
**Perfil DoD e revisão:** sensível (IA com custo, segredos): revisor em opus (segredos, custo, injeção).
**Depende de / libera:** T2, D-010 (em aberto) / T18.

## T18 · `reserve_ai_usage`, `quota.ts` e rota `/api/essays/feedback` (KAN-49)
**Objetivo:** rota que reserva o uso de forma atômica, chama o adapter, pós-valida e grava o retorno, e a migration e a regra pura do limite.
**Contexto e entradas:** T17, T2. US-042, 043. Ver [plano §3 (IA) e §4](../../arquitetura/plano-hackathon.md) e [briefing D](../../arquitetura/briefings/faixa-d-redacao-ia.md). Em aberto: D-020 (teto): ler `ai_global_budget_usd`, hoje 20.
**O que executar:**
1. `src/domain/quota.ts` (pura) e `quota.test.ts`: decide a partir de `{ used, limit, spentUsd, estimateUsd, budgetUsd, aiEnabled }`; códigos `AI_DISABLED`, `QUOTA_USER_EXCEEDED`, `QUOTA_GLOBAL_EXCEEDED`, ou liberado (ordem proposta nesta lista; relatar se mudar).
2. Migration nova `supabase/migrations/<timestamp>_reserve_ai_usage.sql` (aditiva): `reserve_ai_usage(p_user uuid, p_feature text)` SECURITY DEFINER com `SET search_path`, `pg_advisory_xact_lock` por usuário; conta `ai_usage` `succeeded` mais `reserved` criados há menos de 3 minutos, em `usage_date` America/Sao_Paulo; limite = `essay_daily_limit_override` ou `essay_daily_limit_per_user` (conta `is_demo`: `essay_daily_limit_demo`); verifica `sum(cost_usd)` mais estimativa contra `ai_global_budget_usd` e `ai_enabled`; insere a reserva e retorna o id ou o código (formato do retorno: propor, por exemplo jsonb, e relatar; a estimativa por reserva vem do servidor a partir de `models.ts`). `REVOKE ALL` de `PUBLIC`, `anon` e `authenticated`; `GRANT EXECUTE` só a `service_role`. `supabase db push` no `aprumo-dev` e `pnpm db:types` no mesmo PR. A revisa as permissões e aplica em prod.
3. `src/app/api/essays/feedback/route.ts` (`export const maxDuration = 60`): auth por `getUser()`; zod de `EssayFeedbackRequest`; mínimo e máximo de caracteres de `app_config` ANTES de reservar (erros `TEXT_TOO_SHORT`/`TEXT_TOO_LONG`, 400, sem consumir); `reserve_ai_usage`; insere `essay_submissions` `pending`; adapter; pós-validação (cada `evidence` precisa ser trecho literal do texto, senão é descartada; citações entre aspas acima de 12 palavras fora do texto são descartadas; `scoreEstimate` fora da escala 0/40/80/120/160/200 é rejeitada; RN-023); deriva no servidor `name`, `totalEstimate`, `weakCompetencies`, `suggestions` (via `competency_contents`), `disclaimer` (constante RN-014); grava `essay_feedbacks` e confirma a reserva (`succeeded`, tokens, custo) pelo `admin.ts`; qualquer falha marca `failed` (não conta).
4. Erros `{ error: AppError }` com status do plano (400, 401, 404, 429, 503, 504, 500), mensagem amigável, `requestId` no log, nunca stack nem mensagem do provedor.
5. `src/server/queries/essay.ts`: `getEssayQuota(userId)` retorna `EssayQuota`.
6. `content/essays/demo-essays.json`: `demoAccountEssays` (2 redações da conta demo, com retorno, slugs únicos) e `fallbackExamples` (reservas com `example_key` único), todas assinadas "Aluno Demo", formato de `content.ts`; validar com o validador da T12.
**Entregáveis:** `src/domain/quota.ts` e teste, migration, `src/lib/supabase/types.ts` regenerado, `src/app/api/essays/*`, `src/server/queries/essay.ts`, `content/essays/demo-essays.json`.
**Critério de pronto:** Dado o limite esgotado, Então 429 e nenhuma chamada de IA (conferido em `ai_usage` e no contador do Fake). Dado texto curto, Então 400 e nada consumido. Dado falha ou timeout, Então reserva `failed` e o uso não conta. Dado retorno, Então 5 competências, `isEstimate`, aviso e sem reescrita (teste da pós-validação). Valores só de `app_config`.
**Roteiro de segurança (obrigatório):** 1) 10 requisições paralelas com limite 3 gastam no máximo 3; 2) `reserve_ai_usage` por rpc com token de usuário é negada; 3) insert ou update em `ai_usage` e `essay_feedbacks` por REST negado; 4) limite por usuário e teto global bloqueiam sem chamar a IA; 5) `ai_enabled=false` bloqueia; 6) a resposta de erro não traz texto do provedor; 7) nenhuma chave em log ou resposta.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; chamar a rota com `AI_PROVIDER=fake` em `aprumo-dev`; roteiro acima registrado em `docs/evidencias/faixa-d/seguranca-ia.md`.
**Não fazer:** editar a 0001 ou migrations mergeadas; reservar depois da IA; contratos sem PR a A; chamada real de IA em teste automatizado.
**Perfil DoD e revisão:** sensível (RLS, custo): revisor em opus e `/security-review`.
**Depende de / libera:** T17, T2 / T19, T4 (opcional), T6, T7.

## T19 · Telas `/redacao` e retorno com 5 competências e aviso RN-014 (KAN-50)
**Objetivo:** o aluno escolhe tema e parte, escreve, envia e vê o retorno pelas 5 competências com o aviso e o contador de usos.
**Contexto e entradas:** T18 (rota, `getEssayQuota`); até lá, fixtures `EssayFeedback` e `EssayQuota` e o Fake. Referência: `docs/design/figma-prototipo/07-redacao.jpg`, `docs/design/README.md` §3.7. D-037 (a), 5 etapas do protótipo x 3 partes do RF-054: decisão do PO antes de 26/11; enquanto estiver em aberto, implementar as 3 partes (introdução, desenvolvimento, conclusão) mantendo o visual e relatar a divergência. Ver [briefing D](../../arquitetura/briefings/faixa-d-redacao-ia.md).
**O que executar:**
1. `src/app/(app)/redacao/page.tsx` e `src/features/essay/*`: título "Uma ideia de cada vez", etapas das 3 partes, cartão "Tema de hoje" (temas de `essay_topics`, com textos motivadores), editor da parte com contador de caracteres (`essay_min_chars`/`essay_max_chars`), contador "usos restantes" ao abrir (`getEssayQuota`).
2. Envio por `POST /api/essays/feedback`; enquanto responde, estado "corrigindo..." em região `aria-live`, sem travar a tela.
3. `src/app/(app)/redacao/[submissionId]/page.tsx`: retorno com as 5 competências (nome, pontos fortes, a melhorar, trechos citados), nota rotulada "estimativa" e o aviso RN-014 (vindo do servidor, texto de `ESSAY_ESTIMATE_DISCLAIMER`); `pending` faz `router.refresh` a cada 3 s; contador atualizado.
4. Estados: texto curto (orientação, sem consumir), erro da IA com "Tentar de novo", limite esgotado (aviso claro).
5. Omitir "Guardar rascunho", "Salvo agora" (sem contrato), repertório e "Experimentar sugestão" (T20); anotar como diferenças aceitas.
6. `e2e/faixa-d.spec.ts` com `AI_PROVIDER=fake`: texto curto, retorno com 5 competências e aviso literal, estado `aria-live`.
**Entregáveis:** `src/app/(app)/redacao/*`, `src/features/essay/*`, `e2e/faixa-d.spec.ts`, `docs/evidencias/faixa-d/redacao-lado-a-lado.png`.
**Critério de pronto:** Dado tema e parte, Quando envio, Então vejo retorno por competência sem travar a tela. Dado texto curto, Então orientação e uso não consumido. Dado falha, Então erro e nova tentativa. Dado o retorno, Então nota rotulada "estimativa" com o aviso literal e nada reescrito. Dado a tela, Então contador de usos ao abrir. Fiel ao Figma com `07-redacao.jpg`, sem texto "Modo prova" (RNF-020, RNF-024).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; manual com a conta nova (3 usos) e teclado.
**Não fazer:** nota sem rótulo "estimativa"; 5 etapas antes da decisão do D-037; editar a rota (T18) ou `src/components/ui`; texto do aluno em log.
**Perfil DoD e revisão:** hackathon (frontend: evidência, foco, teclado, `aria-live`).
**Depende de / libera:** T18 / T20.

## T20 · Sugestão de competência fraca, reservas, teto e kill switch (KAN-51)
**Objetivo:** competência fraca sugere conteúdos do Mapa e permite adicioná-los à Jornada; com IA desligada ou teto atingido a demo mostra aviso e um exemplo gravado, sem erro técnico.
**Contexto e entradas:** T19, T10 (`addContentsToJourney`), T13. US-044, 043, US-046 (cenário IA indisponível). Referência: `07-redacao.jpg`. Ver [plano §4 (kill switch, competência fraca)](../../arquitetura/plano-hackathon.md) e [briefing D](../../arquitetura/briefings/faixa-d-redacao-ia.md). D-020 em aberto: usar o valor em `app_config`.
**O que executar:**
1. No retorno, bloco de `suggestions` (já derivado pela rota): conteúdos do Mapa para cada competência fraca com "Adicionar à Jornada" chamando `addContentsToJourney({ contentIds, source: 'essay_suggestion' })`. Com `NO_ACTIVE_JOURNEY`, redirecionar a `/jornada/nova?conteudos=<slug>`. Ignorar não adiciona nada (RN-001).
2. Competência sem conteúdo: sem sugestão e sem texto que a prometa.
3. `src/server/queries/essay.ts` (acréscimo) e `src/server/ai/**` se preciso: ler uma linha de reserva (`is_example=true`) SÓ no servidor, com `admin.ts` e `server-only`. Com `AI_DISABLED` ou `QUOTA_GLOBAL_EXCEEDED`, a tela mostra o aviso e o exemplo rotulado "exemplo", sem erro técnico.
4. Kill switch: alterar `ai_enabled` em `app_config` no painel do `aprumo-dev` e ver a tela mudar sem redeploy; idem baixar `ai_global_budget_usd`. Conferir que o `config.ts` não guarda o valor além da requisição.
5. Limite esgotado por aluno: aviso, sem chamada de IA.
6. Testes: e2e de `faixa-d` (sugestão com e sem Jornada; reserva com `ai_enabled=false`).
**Entregáveis:** `src/features/essay/*`, `src/server/queries/essay.ts`, ajustes em `src/server/ai/**`, `e2e/faixa-d.spec.ts`, `docs/evidencias/faixa-d/` (telas e `seguranca-reservas.md`).
**Critério de pronto:** Dado competência fraca, Então sugestão e "Adicionar à Jornada". Dado sem Jornada, Então vai a `/jornada/nova` com o conteúdo escolhido. Dado competência sem conteúdo, Então sem sugestão. Dado IA desligada ou teto atingido, Então aviso e exemplo, sem erro técnico. Dado limite esgotado, Então nenhuma chamada de IA (`ai_usage` inalterado). Fiel ao Figma no estilo de `07-redacao.jpg`.
**Roteiro de segurança (obrigatório):** 1) com o token de usuário, REST em `essay_submissions` nunca devolve linha com `user_id` nulo (reserva); 2) a reserva só é lida no servidor com service role; 3) `ai_enabled=false` é checado no servidor (chamar a rota direto também bloqueia); 4) limite esgotado não chama o provedor (contador do Fake); 5) sugestões vêm de `competency_contents`, não do modelo; 6) nada de chave ou texto de aluno em log.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; manual no `aprumo-dev` alternando `app_config`.
**Não fazer:** expor reservas por RLS; o modelo escolher conteúdo; reescrever a rota (T18); tocar `src/components/ui`.
**Perfil DoD e revisão:** sensível (custo, kill switch): revisor em opus.
**Depende de / libera:** T19, T10, T13 / T21.

## T21 · Endurecer a redação: timeouts, nova tentativa, p95 (KAN-52)
**Objetivo:** a redação lida bem com lentidão e falha da IA, com mensagens amigáveis e p95 medido.
**Contexto e entradas:** T20. US-042. Ver [plano §4 (falha e timeout, streaming)](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. Conferir que o timeout é `AbortSignal.timeout(AI_TIMEOUT_MS)` (padrão 45 s) e que `maxDuration = 60` está na rota.
2. Uma única nova tentativa só em `NoObjectGeneratedError` e só se sobrar tempo no orçamento; depois, `AI_INVALID_OUTPUT`. Timeout vira `AI_TIMEOUT` (504); erro do provedor, `AI_UNAVAILABLE` (503). Toda falha marca a reserva `failed` e a submissão `failed`.
3. Mensagens amigáveis na UI com botão "Tentar de novo" e foco no aviso; nenhuma mensagem do provedor.
4. Testes unitários com o Fake configurado para atrasar, falhar e devolver saída inválida (sem chamada real).
5. Medir p50 e p95 com ao menos 20 chamadas reais no modelo escolhido (pessoa com a chave, uma vez) e registrar em `docs/arquitetura/avaliacao-modelos.md` (seção nova) ou `docs/evidencias/faixa-d/`. Streaming só se o p95 passar de 15 s: nesse caso relatar ao grupo antes de implementar `streamText` com `Output.object` conforme a doc instalada.
6. Rever `router.refresh` a cada 3 s em `pending` (para quando concluir ou falhar).
**Entregáveis:** ajustes em `src/server/ai/**` e `src/app/api/essays/*`, testes, registro do p95.
**Critério de pronto:** Dado timeout, Então 504, mensagem amigável e uso não consumido. Dado saída inválida, Então 1 nova tentativa e depois `AI_INVALID_OUTPUT`. Dado falha do provedor, Então 503 sem texto do provedor. p95 registrado.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.
**Não fazer:** nova tentativa fora do orçamento; streaming sem p95 > 15 s; chamadas reais em CI.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T20 / T23.

## T22 · e2e smoke verde em prod, README e monitor de uptime (KAN-53)
**Objetivo:** smoke e2e do fluxo principal verde em produção, README completo e monitor externo ligado.
**Contexto e entradas:** T8, T5 (esqueleto). US-045, 046. RNF-016 e RNF-023. Ver [plano §6 (QA) e §7](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. Completar `e2e/smoke.spec.ts`: cadastro com e-mail único `@example.com`, Mapa, criar Jornada, estudar conteúdo, mini-simulado aprovado e nó aceso, redação com retorno, flashcard. No preview use `AI_PROVIDER=fake`. Em prod o passo da redação faz 1 chamada real (custo de centavos): rodar poucas vezes.
2. `README.md`: descrição, trilha "Acesso à educação", link da demo, conta demo (e-mail `demo@example.com` e a senha de demonstração pública, escrita só no README), aviso de dados fictícios, como rodar local (instalar com `pnpm`, copiar `.env.example` pela pessoa, `supabase link`, `pnpm seed`, `pnpm dev`), arquitetura (diagrama e links para o plano), operação (health, cron, dump), limites e RN-014.
3. Monitor externo gratuito (ex.: UptimeRobot) em `/api/health` a cada 5 minutos, com alerta para os 4 integrantes (pessoa cria a conta); anotar quem confere (D-029: sem escala).
4. Rodar o smoke contra a URL de produção e salvar o resultado.
**Entregáveis:** `e2e/smoke.spec.ts`, `README.md`, `docs/evidencias/faixa-a/smoke-prod.md` (saída do teste, sem credenciais).
**Critério de pronto:** Dado a URL de prod, Quando `pnpm test:e2e`, Então verde. Dado o README, Então traz descrição, trilha, demo, conta, como rodar e arquitetura. Dado o monitor, Então alerta ao derrubar o health e há atividade a cada 5 minutos. Repositório sem segredo.
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `E2E_BASE_URL=<url de prod> pnpm test:e2e`; ler o README seguindo os passos em clone limpo.
**Não fazer:** chave ou senha real no README; smoke em laço; dados pessoais reais no cadastro de teste.
**Perfil DoD e revisão:** infra.
**Depende de / libera:** T8 / T23.

## T23 · Congelamento, QA cruzado, dump diário, seed de prod com 18 conteúdos e release candidate (KAN-54)
**Objetivo:** em 29/11 às 12h congelar funcionalidades, validar o produto em produção e deixar um release candidate pronto.
**Contexto e entradas:** T15, T21, T22. Ver [plano §6 (dia 29) e §7 (verificação por runtime real)](../../arquitetura/plano-hackathon.md). Todas as faixas participam; A coordena.
**O que executar:**
1. Congelar às 12h: nada de funcionalidade nova; só correção crítica por PR com ok. Checkpoint: se o Início (T6) não estiver estável, `/inicio` redireciona a `/jornada` (US-014 cortada).
2. QA cruzado (cada pessoa testa a faixa de outra), na URL de produção com a conta demo e com uma conta nova em janela anônima: Entrada, cadastro com aviso, Mapa com 18 nós e filtro, drawer, Trilha, criar Jornada (bloqueia sem meta); conteúdo com fonte, mini-simulado com 3 de 5 e com 4 de 5 (nó acende); redação com texto curto (sem consumir), redação válida (5 competências, estimativa e aviso, contador diminui), sugestão e "Adicionar à Jornada", limite esgotado (sem chamada de IA, conferido em `ai_usage`); flashcards e cronograma; `/api/health` 200; celular sem rolagem horizontal; teclado e foco na redação.
3. Dump de prod (`supabase db dump`, fora do repositório, com a data no nome); repetir 1 vez por dia de 29/11 a 12/12 e antes de cada `db push`.
4. Recarregar o seed de prod com os 18 conteúdos (A, variáveis de prod no ambiente local) e conferir 18 nós, 90 questões e 54 flashcards; conta demo no estado-base.
5. Confirmar `ai_enabled` true, `ai_global_budget_usd` final (D-020: manter 20 se não houver decisão) e limites de gasto nos consoles dos provedores.
6. Release candidate: registrar o SHA da `main` e o deployment da Vercel (Instant Rollback conhecido); varredura de segredos no histórico (alertas de secret scanning vazios).
7. Achados: bug crítico vira PR curta; o restante, lista de limitações.
**Entregáveis:** `docs/evidencias/faixa-a/qa-cruzado.md` (tabela de itens com resultado e screenshots sem dados pessoais) e nota do RC com SHA.
**Critério de pronto:** todos os itens do passo 2 com resultado registrado nos seis estados; seed de prod com 18; dump do dia feito; RC identificado. Fluxo completo percorrido na demo publicada com dados fictícios (perfil hackathon).
**Como verificar:** `pnpm lint`, `pnpm typecheck`, `pnpm test`; `E2E_BASE_URL=<url de prod> pnpm test:e2e`; roteiro do passo 2.
**Não fazer:** funcionalidade nova depois das 12h; deploy sem ok; dump ou print com segredo; testar o limite da IA além do necessário.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T15, T21, T22 / T24.

## T24 · Vídeo (até 3 min) e descrição da submissão (KAN-55)
**Objetivo:** vídeo público ou não listado, assistível sem login, e descrição da submissão prontos.
**Contexto e entradas:** T23 (RC no ar). US-047. Gravação com todos em 29/11; D responde, A apoia. Ver [plano §7 (Roteiro do vídeo)](../../arquitetura/plano-hackathon.md).
**O que executar:**
1. Roteiro (até 3:00): 0:00 a 0:20 problema (estudante sem direção nem correção acessível); 0:20 a 0:40 proposta (Mapa, Jornada, prática, correção; o Aprumo não dá aulas); 0:40 a 1:25 conta demo, Mapa, criar Jornada com meta e prazo, estudar com fonte, mini-simulado e nó acendendo; 1:25 a 2:20 redação (introdução), 5 competências, rótulo "estimativa" com o aviso, competência fraca, "Adicionar à Jornada", contador; 2:20 a 2:40 flashcards e cronograma; 2:40 a 2:55 arquitetura em 1 slide (Next.js e Supabase em Ohio (us-east-2), RLS, adapter de IA, limites de custo, dados fictícios); 2:55 a 3:00 impacto (acesso à educação) e link.
2. Gravar trechos separados na URL de produção, com a resposta da IA já carregada se a latência atrapalhar; só a conta demo e dados fictícios; janela do navegador limpa (sem abas, e-mails, notificações, painéis com chaves).
3. Subir (YouTube não listado ou público) e testar em janela anônima, sem login; duração menor ou igual a 3 min.
4. Descrição da submissão (`docs/evidencias/faixa-d/descricao-submissao.md`, nome proposto): problema, solução, fluxo, stack, limites de IA, dados fictícios, trilha "Acesso à educação", links do repositório, da demo e do vídeo. Sem prometer o que não existe (cortes: US-016, 018, 014 se aplicável) e sem nome "Modo prova".
5. Checklist de revisão de dados: só fictícios (RNF-017), sem chave, sem e-mail pessoal, sem nome real.
**Entregáveis:** `docs/evidencias/faixa-d/video.md` (link e checklist) e `descricao-submissao.md`.
**Critério de pronto:** Dado o vídeo, Quando alguém o assiste sem login, Então dura no máximo 3 min e mostra problema, fluxo (Mapa, Jornada, estudo, redação) e impacto. Dado o vídeo, Então só dados fictícios. Dado a descrição, Então trilha "Acesso à educação" preenchida.
**Como verificar:** abrir o link em janela anônima; conferir a duração; checklist assinado por 2 pessoas.
**Não fazer:** mostrar chave, painel de variáveis, e-mail pessoal ou dado real; mostrar função que não existe.
**Perfil DoD e revisão:** hackathon.
**Depende de / libera:** T23 / T25.

## T25 · Submissão e tag `v1.0-submissao` (KAN-56)
**Objetivo:** projeto submetido ao hackathon até 30/11 às 20h (prazo oficial 23h59) e a tag aplicada no commit entregue.
**Contexto e entradas:** T24. US-047, 045. Meta interna 20h; folga até 23h59. Depois, repositório congelado até 12/12 (só `app_config` no painel).
**O que executar:**
1. Conferir o RC: `main` no SHA da T23 (mais correções críticas), deploy de produção ok, `/api/health` 200, demo abre em janela anônima.
2. Conferir o regulamento (RNF-019): repositório `Rangel64/aprumo` público, sem fork, commits só após 04/11/2026 21h, sem código anterior; README com link da demo, conta demo e instruções; alertas de secret scanning vazios.
3. Preencher o formulário de submissão do hackathon: descrição (T24), trilha "Acesso à educação", links do repositório, da demo e do vídeo; enviar e guardar o comprovante (sem dados pessoais).
4. Criar e enviar a tag `v1.0-submissao` no commit entregue (tag e push só com ok explícito, D-034).
5. Confirmar que o monitor está ativo e combinar a rotina do dump diário até 12/12 (D-029).
6. Registrar em `docs/backlog/mudancas.md` e no CHANGELOG; fechar a issue.
**Entregáveis:** envio feito, tag `v1.0-submissao`, comprovante guardado fora do repo ou em `docs/evidencias/faixa-a/submissao.md` (sem dados pessoais).
**Critério de pronto:** Dado o formulário, Quando envio, Então descrição e trilha preenchidas e o envio ocorre até 30/11 23h59 (meta 20h). Dado o histórico, Então sem chaves nem dados reais (RNF-021).
**Como verificar:** abrir a demo e o vídeo em janela anônima; `git tag --list v1.0-submissao`; revisar alertas de secret scanning.
**Não fazer:** commit ou deploy de código novo depois da submissão (congelado); alterar a tag; segredo no comprovante.
**Perfil DoD e revisão:** hackathon (checklist do perfil: README, vídeo, descrição, regulamento, sem segredos, registro M).
**Depende de / libera:** T24 / fim da sprint (congelamento até 12/12).

---

## Pontos a confirmar com o grupo (lacunas encontradas na leitura)
- Transação do seed e do cron (T4, T5): o supabase-js não abre transação; escolher função SQL por `rpc` (migration aditiva) ou conexão direta.
- Formato de retorno de `reserve_ai_usage` e fonte da estimativa de custo por reserva (T18).
- Como um flashcard entra na fila pela primeira vez (T16) e rótulos dos 4 níveis (protótipo mostra só 2).
- Duração de estudo por conteúdo no cronograma (T11): premissa de 1 sessão por conteúdo pendente.
- Valores de `essay_min_chars` e `essay_max_chars` (T2), status HTTP de `AI_INVALID_OUTPUT` (T2) e quem entra primeiro em prod com a chave do modelo escolhido (T8, após D-010).
- `server-only` em scripts `tsx` (T4): confirmar o comportamento no pacote instalado.
