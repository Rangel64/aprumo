# Briefing da Faixa A: Plataforma

Projeto Aprumo (hackathon Hack Brasil 2026). Leia antes o [README dos briefings](README.md). Fonte principal: `docs/arquitetura/plano-hackathon.md`. Em conflito, o Gherkin de `docs/requisitos/historias.md` manda; relate a divergência ao grupo, não decida sozinho. Especialistas: devops, dev-backend, qa.

## 1. Objetivo e histórias

Dar a base que as outras 3 faixas usam (repositório, contratos, banco, CI, deploy, auth, seed, operação) e fechar a entrega (README, demo no ar, QA).

| História | Resumo | Critério de pronto ("testado" = teste automatizado do cenário Gherkin + screenshot em `docs/evidencias/` quando houver UI) |
|---|---|---|
| [US-045](../../requisitos/historias.md) | Repositório público com README | Repo novo, público, sem fork, commits só após 04/11/2026 21h, sem código anterior; README com descrição, trilha "Acesso à educação", link da demo, conta demo, como rodar, arquitetura; varredura do histórico sem segredos. Evidência: checklist com a varredura (secret scanning ligado). |
| [US-046](../../requisitos/historias.md) | Demo no ar | Link abre a entrada, conta demo pública (README) e cadastro livre com aviso de dados de teste; fluxo completo percorrido; `/api/health` 200; com IA indisponível ou teto atingido a demo segue. Evidência: roteiro de runtime real (plano, seção 7) com screenshots. |
| [US-048](../../requisitos/historias.md) | Seed fictício | `pnpm seed` cria Mapa, Trilha, conteúdos, questões, flashcards e conta demo; rodar 2 vezes não duplica (teste); sem dados reais. |
| [US-001](../../requisitos/historias.md) | Entrada | 3 ou 4 blocos, "Começar agora" leva ao cadastro, sem rolagem horizontal no celular, aviso de dados fictícios. Teste e2e + screenshot desktop e celular. |
| [US-002](../../requisitos/historias.md) | Cadastro e-mail e senha | Conta criada e ativa sem e-mail de confirmação; e-mail já usado mostra mensagem e opção de entrar; aviso de dados de teste. Regras de senha e recuperação: **D-030, em aberto**; pergunte ao grupo antes de implementar. |
| [US-004](../../requisitos/historias.md) | Perfil inicial | Só Aluno: pula a escolha e vai a Criar Jornada (`/jornada/nova`). |
| [US-005](../../requisitos/historias.md) | Entrar | Login simples, sem troca de área. |
| [US-014](../../requisitos/historias.md) (Should) | Início | Com Jornada: meta, próximo conteúdo, prévia do Mapa, aviso de flashcards vencidos; sem Jornada: convite. Sem submetas (fora do recorte H). |

Também é da faixa: instalação de todos os pacotes (etapa 0), contratos v1 (inclui o formato dos JSON de `content/`), migration 0001, `app_config`, `src/server/config.ts` e `content/config.json` (etapa 0), pastas `docs/evidencias/` e `docs/adr/` com `.gitkeep` (ADRs ficam com A, o documentador), CI, Supabase, Vercel, monitor, cron, dumps, conta demo, login, cadastro e Início (`actions/auth.ts`, `queries/home.ts`, `features/{auth,home}`), README, QA e roteiro de verificação. Apoia a faixa D na US-047 (vídeo e descrição; gravação com todos em 29/11).

## Design (decisão do PO, 24/11/2026): fiel ao Figma

O design da aplicação segue o protótipo do Figma (https://object-study-60652393.figma.site/). Leia `docs/design/README.md` e veja as imagens de referência em `docs/design/figma-prototipo/`. Telas desta faixa: Entrada (`/`) e Início (`/inicio`), além do layout `(app)` e das telas de cadastro e entrada no mesmo estilo. Referência: `01-entrada.jpg` e `02-inicio.jpg`.

- Use **só** os componentes de `src/components/ui` e os tokens do tema do Tailwind (da faixa A): sem cor, fonte, raio ou sombra soltos no código. Precisa de variante nova? Peça a A por PR; não edite `src/components/ui`.
- Elementos do protótipo fora da fase H não entram (nada do que está fora do recorte H, sem tema escuro). Em conflito com o Gherkin, o Gherkin manda no comportamento e você relata a divergência ao grupo (não decida sozinho). Texto do protótipo "[Nome da plataforma]" vira Aprumo; nome de funcionalidade que o RNF-020 proíbe não é usado.
- Até o layout `(app)` de A chegar (25/11), monte as telas com as fixtures e os componentes base (entregues por A em 24/11); depois, encaixe-as no layout.
- **Critério de pronto "fiel ao Figma":** comparação lado a lado de cada tela (desktop; celular quando o protótipo tiver) com a imagem de referência, salva em `docs/evidencias/faixa-a/` (ex.: `<tela>-lado-a-lado.png`, nossa tela ao lado do JPG de referência); diferenças aceitas ficam anotadas na PR. Sem a comparação, a tela não está "feita".
- **A é dona do design system** (tokens e componentes base). Entrega: tokens e componentes base em **24/11** (B, C e D os usam desde então; antes, só fixtures); layout `(app)` com menu lateral e tela de Entrada em **25/11**, antes de as outras faixas montarem telas finais. Se atrasar, avise o canal: as outras faixas continuam com fixtures e componentes.
- **Tokens no tema do Tailwind** (configuração ou `@theme`, conforme a versão instalada): cores `purple #7b5cff`, `purple-dark #6243e8`, `purple-light #ede9ff`, `coral #ff6b5b`, `yellow #ffc93c`, `mint #2ed3a0`, `blue #3ba4ff`, `pink #ff5fa2`, `orange #ff9a3c`, `cream #fff9f2` (fundo), `ink #1f1b2e`, `muted #6b6880`, `line #e9e5ef`; raios 8, 16, 24 e 999px; sombras suaves do protótipo; fontes Nunito (corpo) e Quicksand (destaque) via `next/font` (confirmar a API na versão instalada).
- **Componentes base em `src/components/ui`:** botão pill roxo, cartão com raio 24 e sombra, chips, barra de progresso, nó do Mapa nos 4 estados (não iniciado, estudando, dominado, revisado hoje; a faixa B o usa dentro do React Flow) e layout com menu lateral. Os componentes shadcn copiados são ajustados aos tokens.
- **Evidência "fiel ao Figma" da faixa A:** `docs/evidencias/faixa-a/` com screenshot da Entrada ao lado de `01-entrada.jpg` e do Início ao lado de `02-inicio.jpg`.


## 2. Stack e comandos

Next.js App Router + TypeScript + Tailwind (com os tokens do Figma no tema) e `next/font` com Nunito e Quicksand; Supabase (São Paulo, sa-east-1); pnpm. **Um único lockfile.** Proibido criar segundo lockfile, trocar de gerenciador ou reinstalar `node_modules` sem combinar com o grupo (esta faixa cria o projeto, instala **todos** os pacotes na etapa 0 do dia 1 e fixa as versões no lockfile; as outras faixas pedem acréscimos por PR a A).

| Comando | Faz |
|---|---|
| `pnpm dev` | servidor local (Supabase dev; `AI_PROVIDER=fake` dispensa chave) |
| `pnpm lint` | `eslint .` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | `vitest run` |
| `pnpm test:e2e` | `playwright test` contra `E2E_BASE_URL` |
| `pnpm build` | `next build` |
| `pnpm db:push` | `supabase db push` no projeto vinculado (por padrão `aprumo-dev`); o de PRODUÇÃO exige religar o projeto (`supabase link` para `aprumo-prod`) e é tarefa só de A, com dump antes |
| `pnpm db:types` | gera `src/lib/supabase/types.ts` |
| `pnpm seed` | `tsx scripts/seed.ts` (idempotente, service role) |
| `pnpm eval:essay` | da faixa D |

Bibliotecas (confirmar versões instaladas, não inventar): `next`, `react`, `typescript`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`, `ai`, um `@ai-sdk/<provedor>` por provedor candidato do D-010, `@xyflow/react`, renderizador de markdown (confirmar pacote e versão na documentação antes de instalar), `vitest`, `@playwright/test`, `supabase` (CLI), `tsx`, `sonner`, componentes shadcn copiados para `src/components/ui`. Arquivo de borda de sessão: `middleware.ts` ou `proxy.ts`, o nome que a versão do Next instalada documenta. Tudo é instalado na etapa 0 (24/11); B, C e D pedem acréscimos por PR a A.

## 3. Arquivos: exclusivos, proibidos, quem ajusta

**Exclusivos da faixa A:** `package.json`, `pnpm-lock.yaml`, configs (eslint, tsconfig, tailwind, vitest, playwright), `vercel.json`, `.github/`, `.env.example`, `supabase/config.toml` e a migration 0001 (as migrations novas das outras faixas ficam em `supabase/migrations/`, cada uma de quem a cria), `src/contracts/*` (dona; mudanças por PR; inclui `content.ts`), `src/lib/supabase/*` (`types.ts` é regenerado por quem criar migration, no mesmo PR), `src/server/config.ts`, `src/server/actions/auth.ts`, `src/server/queries/home.ts`, `src/features/auth/*`, `src/features/home/*`, `src/components/ui/*`, `src/app/page.tsx`, `src/app/(auth)/*`, `src/app/(app)/layout.tsx`, `src/app/(app)/inicio/*`, `middleware.ts`/`proxy.ts`, `src/app/api/health`, `src/app/api/cron/*`, `scripts/seed.ts`, `content/config.json` (configuração da plataforma; o resto de `content/**` é de C e `content/essays/` é de D), `e2e/smoke.spec.ts` e a config do Playwright, `docs/adr/`, `docs/evidencias/` (criação das pastas com `.gitkeep`; a subpasta `faixa-a/` é sua), `README.md`.

**Não pode tocar:** arquivos das faixas B, C e D (`(app)/{mapa,trilhas,jornada,cronograma}`, `{conteudos,revisar}`, `redacao`, `api/essays`, `features/{map,journey,schedule,study,quiz,flashcards,essay}`, `server/actions/{journey,schedule,study,quiz,flashcards}.ts`, `server/queries/{map,trail,journey,schedule,content,quiz,flashcards,essay}.ts`, `server/ai/**`, `domain/*`, `content/**` (exceto `content/config.json`), `scripts/eval-essay.ts`, `scripts/validate-content.ts`, `e2e/faixa-{b,c,d}.spec.ts`, `docs/arquitetura/avaliacao-modelos.md`). Exceção: `getHomeView` e a tela de Início compõem queries de B, C e D (inclusive `getEssayQuota`) só **chamando-as**; não as edite.

**Contratos:** `src/contracts/` só por adição. Após o merge do PR "contracts v1", qualquer mudança exige PR revisado por quem consome. Migrations: a 0001 tem o schema inteiro do plano (seção 2), **sem** `reserve_ai_usage` (essa é a migration da faixa D em 25/11). Depois, cada faixa (B, C e D incluídos) cria as suas em `supabase/migrations/`, com timestamp no nome, aditivas, nunca editando uma já mergeada; quem cria a migration a aplica no projeto `aprumo-dev` com `supabase db push` (projeto vinculado) e gera `src/lib/supabase/types.ts` com `supabase gen types typescript --project-id <id do aprumo-dev>` no mesmo PR; só A sobe Supabase local/Docker.

**Se sua mudança quebrar teste de outra faixa:** avise o canal; a pessoa dona do teste ajusta (mesmo PR ou PR imediato). Proposta no README, confirmar no dia 1 (D-031). Mudança no seed que quebre validação de `content/` é combinada com C.

## 4. Contratos, dependências e fixtures

**Produz** (fixar até 24/11 às 14h): `ActionResult<T>`, `AppError`, `ErrorCode` (`UNAUTHENTICATED`, `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `NO_ACTIVE_JOURNEY`, `TEXT_TOO_SHORT`, `TEXT_TOO_LONG`, `QUOTA_USER_EXCEEDED`, `QUOTA_GLOBAL_EXCEEDED`, `AI_DISABLED`, `AI_TIMEOUT`, `AI_UNAVAILABLE`, `AI_INVALID_OUTPUT` (status HTTP: definir no PR de contratos), `INTERNAL`); `routes.ts`; `views.ts` (`MapView`, `TrailView`, `JourneyView`, `ContentView`, `QuizView`, `FlashcardView`, `ScheduleView`, `EssayQuota`, `QuizResult`); `essay.ts` (`EssayFeedbackRequest`, `EssayFeedbackResponse`, `EssayFeedback`, `EssayFeedbackAI`, `ESSAY_ESTIMATE_DISCLAIMER` com o texto literal da RN-014); `content.ts` (zod; formato dos JSON de `content/`: um JSON por conteúdo, `trail.json`, `competency-map.json`, `essay-topics.json`, `config.json` e `content/essays/demo-essays.json`, este com dois blocos: `demoAccountEssays`, as 2 redações da conta demo, e `fallbackExamples`, as linhas de reserva `is_example=true`; cada item de `fallbackExamples` traz `example_key` (único) e cada item de `demoAccountEssays` traz `topicSlug` + `part`, dupla única entre os dois, que é a chave natural do upsert); `fixtures.ts` (um `MapView`, um `ContentView`, um `QuizView`, um `EssayFeedback`, um `EssayQuota` e um `FlashcardView`). Assinaturas das queries e actions: plano, seção 3.

Actions da faixa (em `src/server/actions/auth.ts`): `signUp`, `signIn`, `signOut` (`{ email, password, displayName? }` retorna `{ redirectTo }`), todas com zod e `ActionResult`. Query (em `src/server/queries/home.ts`): `getHomeView(userId)` compõe `getActiveJourney` e `getMapView` (B), `getDueFlashcards` (C), `getEssayQuota` (D) e `dueFlashcardsCount`.

Migration 0001 inclui: todas as tabelas do plano, RLS em todas (catálogo só SELECT para `authenticated`; tabelas do aluno por `user_id = auth.uid()`; `content_progress`, `quiz_attempts`, `essay_feedbacks`, `ai_usage` só SELECT do próprio usuário; `question_keys` e `app_config` sem política; `profiles` com UPDATE só em `display_name`), trigger de `profiles`. Na 0001, `ai_usage.submission_id` é FK com `ON DELETE SET NULL` (o gasto registrado permanece e continua contando no teto global de US$ 20 e no limite diário), e não existe índice único em (`user_id`, `topic_id`, `part`). A função `reserve_ai_usage` **não** fica na 0001: é a migration da faixa D em 25/11 (SECURITY DEFINER, só service role); A revisa as permissões. Em `essay_submissions`, `user_id` **não é NOT NULL**: a 0001 inclui `CHECK (user_id IS NOT NULL OR is_example)` (nulo só em linha de reserva), `CHECK (is_example = (example_key IS NOT NULL))` e `example_key text UNIQUE NULL` (preenchida só quando `is_example=true`; chave de idempotência do seed). São duas coisas separadas: (a) as 2 redações da conta demo pertencem à conta demo (`user_id` = conta demo, `is_example=false`, e o aluno as vê pela RLS normal `user_id = auth.uid()`; semeadas, não criam linhas em `ai_usage` e portanto não consomem o limite de 15 por dia nem o teto global (só retornos novos gerados pela IA consomem); o seed e o cron as repõem, ver o seed); (b) as linhas de reserva (`is_example=true`, `user_id` nulo, `example_key` único) são lidas só no servidor com a service role (`src/lib/supabase/admin.ts`), usadas quando a IA está desligada ou o teto foi atingido, e nunca expostas por RLS do aluno (`user_id = auth.uid()` não casa com nulo). A regra de que o aluno só lê o que é dele não muda.

**Datas:** na etapa 0 do dia 1, até **24/11, 14h** (todos revisam): instalação de todos os pacotes, contratos v1 (incluindo `src/contracts/content.ts`), 0001, `app_config`, `src/server/config.ts` e o **seed de config** (etapa 0, 24/11: lê só `content/config.json` e grava `app_config`; é distinto do `seed.ts` v1 de 25/11) (`app_config` não fica para 26/11). B, C e D usam `fixtures.ts` até lá. `getHomeView` só entra no dia 4 (27/11), pois consome B, C e D.

## 5. Regras de produto e segurança

- RLS em todas as tabelas; testar com 2 usuários (dia 27) e rodar o Security Advisor do Supabase.
- Service role só em `src/lib/supabase/admin.ts` com `import "server-only"`; chaves de IA e service role nunca com prefixo `NEXT_PUBLIC_`. `.env.example` só com nomes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou publishable), `SUPABASE_SERVICE_ROLE_KEY` (ou secret), `AI_PROVIDER`, `AI_ESSAY_MODEL_KEY`, `AI_TIMEOUT_MS`, chaves dos provedores em uso, `CRON_SECRET`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, `NEXT_PUBLIC_DEMO_MODE`, `E2E_BASE_URL`.
- Auth: e-mail e senha; **confirmação de e-mail desligada** na demo; sem Google; sem escolha de perfil (só Aluno). Cadastro e entrada mostram o aviso de dados de teste (RNF-017). Regras de senha e recuperação: D-030, em aberto.
- Repositório: novo, **público**, sem fork nem histórico anterior; **commits só após 04/11/2026 21h**; os docs podem entrar; **nenhum código anterior ao evento**. Ativar secret scanning e push protection.
- Seed: dados fictícios; conta demo com e-mail reservado `demo@example.com` e senha do README (valores via env, fora do código), `is_demo=true`, estado-base: 3 conteúdos dominados, 1 Jornada ativa, 2 redações da conta demo com retorno (bloco `demoAccountEssays`: `user_id` = conta demo, `is_example=false`, visíveis ao aluno pela RLS normal; semeadas, não criam linhas em `ai_usage` e portanto não consomem o limite de 15 por dia nem o teto global (só retornos novos gerados pela IA consomem); o limite de 15 por dia da conta demo vale para novos retornos), flashcards vencidos hoje. O seed lê os JSON de `content/` pelos schemas de `src/contracts/content.ts` (inclusive `content/essays/demo-essays.json`, com `demoAccountEssays` e `fallbackExamples`) e faz upsert por chave natural; em `essay_submissions`: upsert por `example_key` só nas linhas de reserva (`is_example=true`, `user_id` nulo); nas da conta demo, NÃO usa `ON CONFLICT` em (`user_id`, `topic_id`, `part`) (não existe índice único global; o aluno pode reenviar a mesma parte do mesmo tema): em transação, APAGA todas as redações da conta demo (as 2 do estado-base e as de visitantes) e INSERE de novo as 2 do estado-base (`demoAccountEssays`), sem tocar em `ai_usage` (o gasto permanece, pois `submission_id` é `ON DELETE SET NULL`); o validador exige `example_key` única entre as reservas e slugs únicos entre as 2 da conta demo; o `demo-essays.json` é entregue por D em 25/11 e o seed v1 (25/11) o lê, mas **se D atrasar, o seed v1 ignora o arquivo até ele existir** (sem falhar) e o recarrega quando ele chegar; o validador e os testes de conteúdo são de C. Valores de `app_config` vêm de `content/config.json` (arquivo de A, etapa 0 em 24/11; o **seed de config** da etapa 0 o lê e grava `app_config`, antes e separado do `seed.ts` v1 de 25/11): `quiz_question_count` 5, `quiz_pass_threshold_pct` 80, `essay_daily_limit_per_user` 3, `essay_daily_limit_demo` 15, `ai_global_budget_usd` 20 (provisório; D-020 em aberto, valor final no dia 1), `ai_enabled` true, `essay_min_chars`, `essay_max_chars`, `essay_weak_score_threshold` 120, `flashcard_intervals_days`.
- Nenhum texto com nome de funcionalidade que sugira simular prova real (RNF-020). Nenhum segredo em código, log, commit, screenshot ou dump.
- `/api/health`: `{ status, db, ai: { enabled, budgetRemainingUsd }, commit }`; não chama a IA; 503 se o banco falhar.

## 6. Operação e entregas da faixa

- **Supabase:** 2 projetos em sa-east-1: `aprumo-dev` (compartilhado) e `aprumo-prod` (demo). `pnpm db:push` usa o projeto vinculado: o `db push` de PRODUÇÃO exige religar o projeto (`supabase link` para `aprumo-prod`), com dump antes, e devolver o vínculo ao `aprumo-dev` depois; é tarefa só de A. **Vercel:** `vercel.json` com `regions: ["gru1"]`; preview por PR apontando para `aprumo-dev` e `AI_PROVIDER=fake`; produção na `main`.
- **CI** (GitHub Actions, PR e push na main): lint, typecheck, test. O build é o gate do preview da Vercel.
- **Pendência técnica do dia 1:** conferir e anotar, com fonte, os limites do Supabase Free e do Vercel Hobby (lista no README dos briefings).
- **Monitor externo gratuito** (ex.: UptimeRobot) em `/api/health` a cada 5 min, com alerta para os 4 integrantes (mitigação sugerida no plano, sem decisão do grupo ainda).
- **Cron diário** da Vercel em `/api/cron/daily` (protegido por `CRON_SECRET`): keep-alive e reposição da conta demo, inclusive a senha e as 2 redações (mesma rotina do seed: em transação, apaga as redações da conta demo e insere de novo as 2 do estado-base; o gasto em `ai_usage` permanece).
- **Dump manual** (`supabase db dump` de prod): o primeiro, antes do primeiro `db push` de prod (27/11); depois, uma vez por dia de 29/11 a 12/12 e antes de cada `db push`, por qualquer integrante, sem escala; guardado fora do repositório; só dados fictícios. Depois de 28/11, A recarrega o seed de prod com os 18 conteúdos. **Ponto de atenção do grupo, sem decisão: quem é o dono do dump e do monitor.** Ensaiar a recuperação uma vez (retomar o projeto pausado ou reaplicar migrations e `pnpm seed`).
- **Conta demo, README e QA:** README com descrição, trilha, link da demo, conta demo, como rodar, arquitetura (US-045). QA: unitários no crítico; 1 smoke Playwright (`e2e/smoke.spec.ts`) com `AI_PROVIDER=fake` (cadastro, Mapa, Jornada, estudo, mini-simulado aprovado e nó aceso, redação com retorno, flashcard); roteiro manual em produção com a conta demo e com conta nova em janela anônima (plano, seção 7: Mapa com 18 nós, 3 de 5 e 4 de 5, texto curto sem consumir uso, redação válida, sugestão, limite esgotado conferido em `ai_usage`, flashcards, cronograma, `/api/health`, celular sem rolagem horizontal, teclado/foco).
- **Rollback:** Instant Rollback da Vercel; banco só com migrations aditivas e dump antes; IA: `ai_enabled=false` em `app_config`.
- Ao apoiar o vídeo (US-047, da faixa D; gravação com todos em 29/11): só dados fictícios.

## 7. Plano dia a dia (24 a 30/11)

| Dia | Entregas |
|---|---|
| 24/11 | **Design system: tokens no tema do Tailwind, `next/font` (Nunito e Quicksand) e componentes base em `src/components/ui`, até o fim do dia.** Repo público novo com os docs; `create-next-app`; Supabase dev e prod; Vercel gru1; **instala todos os pacotes; contratos v1 (com `content.ts` e fixtures de `EssayQuota` e `FlashcardView`), 0001, `app_config` + `src/server/config.ts` + `content/config.json` e seed de config (lê só `content/config.json`) até 14h**; pastas `docs/evidencias/` e `docs/adr/` com `.gitkeep`; deploy vazio no ar; CI; confirmar limites (Free/Hobby). |
| 25/11 | Auth (cadastro, entrar, sair, aviso de dados de teste, trigger de profile); layout `(app)` com menu lateral e tela de Entrada fiéis ao Figma (evidência em `docs/evidencias/faixa-a/`), antes de as outras faixas montarem telas; `seed.ts` v1 (25/11; distinto do seed de config da etapa 0) + conta demo (lê `content/essays/demo-essays.json` se D já o entregou em 25/11; senão ignora). |
| 26/11 | `/api/health`; cron diário; esqueleto do smoke e2e (`app_config` já entrou na etapa 0, em 24/11). |
| 27/11 | Início (US-014); revisão de segurança RLS com 2 usuários; primeiro dump de prod, depois `db push`, deploy prod e seed prod. **Checkpoint: Jornada e Mapa ok? Se não, US-016 é cortada.** |
| 28/11 | e2e smoke verde em prod; README; monitor de uptime. **Meio-dia: se a redação não estiver ok, US-018 é cortada.** |
| 29/11 | **Meio-dia: se o Início não estiver estável, US-014 é cortada** (`/inicio` redireciona para `/jornada`). **Congelar funcionalidades às 12h**; release candidate; dump diário de prod (29/11 a 12/12); recarrega o seed de prod com os 18 conteúdos (depois de 28/11); QA cruzado; apoio ao vídeo (US-047, de D). |
| 30/11 | Só correções críticas até 18h; **submeter até 20h**; tag `v1.0-submissao`. Depois, repositório congelado. |

**Se a faixa atrasar:** a prioridade é contratos, 0001, auth e deploy (bloqueiam as outras 3). A ordem de corte vale só US-016, depois US-018, depois US-014 (README); não há corte extra nesta faixa. Avise no canal assim que prever atraso; as outras faixas continuam com fixtures. Se contratos atrasarem além das 14h, avise todos de imediato.

## 8. Ambiente

- O e2e usa `AI_PROVIDER=fake`. O preview da Vercel aponta para `aprumo-dev`. Só esta faixa escreve em `aprumo-prod` (seed e `db push`, com variáveis de prod usadas localmente e **nunca** no repositório).
- Só a faixa A sobe Supabase local/Docker; as demais faixas não precisam dele (aplicam suas migrations no `aprumo-dev` com `supabase db push`). Se `docker info` não responder, pare e avise.
- Processos: build, dev server e testes nunca ao mesmo tempo no mesmo diretório.

## 9. Checklist fixo (todo briefing que altera código)

- (a) Rodar `pnpm lint` e `pnpm typecheck` na RAIZ antes de reportar, não só o do pacote.
- (b) Listar e encerrar processos e tarefas em segundo plano ao terminar, inclusive laços de espera.
- (c) Proibido rodar build, dev server e testes ao mesmo tempo no mesmo diretório; encerrar qualquer servidor que subir.
- (d) Relatar a DoD nos seis estados: executado, passou, falhou, não executado, não verificável, pendência que impede "feita". Teste não executado nunca é aprovado.
- (e) Relatório curto (até 15 linhas, sem colar o diff) terminando com o bloco "Para o registro" (o quê, por quê, arquivos, verificação).
- (f) Agente nunca cria processo auxiliar no host nem canal de comandos por arquivo: se faltar infraestrutura, para e relata.
- (g) Agente nunca lê nem cria `.env`; variáveis só por nome em `.env.example`.
- (h) Sem commit na main nem push sem o grupo pedir; branches `faixa-x/...` curtas; PR com CI verde.
