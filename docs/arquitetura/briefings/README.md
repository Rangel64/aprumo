# Briefings das faixas: Aprumo (fase H, Hack Brasil 2026)

Estes briefings dividem o trabalho de 24 a 30/11/2026 entre 4 pessoas (cada uma pode usar agentes de IA). Cada briefing é autocontido: quem o lê não precisa ter visto nenhuma conversa. Em caso de conflito, vale esta ordem: (1) Gherkin de `docs/requisitos/historias.md`; (2) `docs/arquitetura/plano-hackathon.md`; (3) o briefing. Se achar divergência, **não decida sozinho: relate ao grupo** (pessoa ou agente descreve a divergência e para naquele ponto).

## Faixas

| Faixa | Briefing | Quem | Histórias | Arquivos exclusivos (resumo; lista completa no briefing) |
|---|---|---|---|---|
| A: Plataforma | [faixa-a-plataforma.md](faixa-a-plataforma.md) | a definir no dia 1 (devops, dev-backend, qa) | US-045, 046, 048 (script), 001, 002, 004, 005, 014; apoio em US-047 | `package.json` e lockfile, configs, `vercel.json`, `.github/`, `.env.example`, `supabase/config.toml` e migration 0001, `src/contracts/*` (inclui `content.ts`), `src/lib/supabase/*`, `src/server/config.ts`, `src/server/actions/auth.ts`, `src/server/queries/home.ts`, `src/features/{auth,home}/*`, `src/components/ui/*`, `src/app/page.tsx`, `(auth)`, `(app)/layout.tsx`, `(app)/inicio`, `proxy.ts`/`middleware.ts`, `api/health`, `api/cron`, `scripts/seed.ts`, `e2e/smoke.spec.ts` e config do Playwright, `content/config.json`, `docs/adr/`, `docs/evidencias/faixa-a/`, `README.md` |
| B: Mapa e Jornada | [faixa-b-mapa-jornada.md](faixa-b-mapa-jornada.md) | a definir no dia 1 (dev-web, dev-backend) | US-006, 009, 010, 011, 016 | `(app)/{mapa,trilhas,jornada,cronograma}`, `features/{map,journey,schedule}`, `actions/{journey,schedule}.ts`, `queries/{map,trail,journey,schedule}.ts`, `domain/schedule.ts`, `e2e/faixa-b.spec.ts`, `docs/evidencias/faixa-b/`, `supabase/migrations/*` (migrations aditivas da faixa, com timestamp) |
| C: Estudo e conteúdo | [faixa-c-estudo-conteudo.md](faixa-c-estudo-conteudo.md) | a definir no dia 1 (dev-web, dev-backend; conteúdo: todos) | US-012, 013, 018, 049 | `(app)/{conteudos,revisar}`, `features/{study,quiz,flashcards}`, `actions/{study,quiz,flashcards}.ts`, `queries/{content,quiz,flashcards}.ts`, `domain/{mastery,flashcard-scheduler}.ts`, `content/**` (exceto `content/essays/` e `content/config.json`), `scripts/validate-content.ts`, `src/domain/content/__tests__/*`, `e2e/faixa-c.spec.ts`, `docs/evidencias/faixa-c/`, `supabase/migrations/*` (migrations aditivas da faixa, com timestamp) |
| D: Redação com IA | [faixa-d-redacao-ia.md](faixa-d-redacao-ia.md) | a definir no dia 1 (dev-backend, dev-web) | US-042, 043, 044, 047, D-010 | `(app)/redacao`, `api/essays`, `features/essay`, `server/ai/**`, `queries/essay.ts`, `domain/quota.ts`, `scripts/eval-essay.ts`, `content/essays/**`, `docs/arquitetura/avaliacao-modelos.md`, `e2e/faixa-d.spec.ts`, `docs/evidencias/faixa-d/`, migrations da faixa (`reserve_ai_usage`) |

Caminhos de `src/app/...` são abreviados acima; use os do briefing. `dev-python` e `dev-mobile` não são usados. **US-047 (vídeo e descrição da submissão) é história da faixa D, com A de apoio; a gravação é com todos no dia 29/11.**

## Ordem de leitura

1. Este README (regras comuns e lista do dia 1).
2. O briefing da sua faixa, inteiro.
3. `docs/arquitetura/plano-hackathon.md`, seções 3 (contratos), 2 (RLS) e a da sua faixa (D lê também a 4; C lê também a 5; A lê também a 7).
4. As histórias da sua faixa em `docs/requisitos/historias.md` (o Gherkin manda).
5. Os briefings das faixas vizinhas, só a seção "Contratos" (para saber quem consome o quê).

## Regras comuns

- **Stack:** um único app Next.js (App Router) + TypeScript + Tailwind, Supabase (projeto em São Paulo), pnpm. Nada de NestJS, Python, monorepo, ORM.
- **pnpm:** um único lockfile (`pnpm-lock.yaml`). Proibido criar segundo lockfile, trocar de gerenciador ou reinstalar `node_modules` sem combinar com o grupo. **A instala TODOS os pacotes na etapa 0 do dia 1** (`ai`, `@ai-sdk/*` por provedor candidato, `@xyflow/react`, `server-only`, `zod`, renderizador de markdown, `vitest`, `@playwright/test`, `sonner`, `tsx`). Depois disso, as outras faixas pedem acréscimos por PR a A, que mantém o único lockfile; nenhuma outra faixa altera `package.json`.
- **Contratos:** `src/contracts/` é da faixa A e só muda por adição, com PR revisado por quem consome. Migrations: `supabase/config.toml` e a `0001` (schema inteiro, **sem** `reserve_ai_usage`) são de A; depois, cada faixa (B, C e D incluídos) cria migration nova e aditiva em `supabase/migrations/`, com timestamp no nome, e nunca edita uma já mergeada. `reserve_ai_usage` é a migration da faixa D em 25/11. Sem Docker: quem cria a migration a aplica no projeto `aprumo-dev` com `supabase db push` (projeto vinculado) e gera `src/lib/supabase/types.ts` com `supabase gen types typescript --project-id <id do aprumo-dev>` no mesmo PR; só A sobe Supabase local/Docker. O `pnpm db:push` usa o projeto vinculado; o de PRODUÇÃO exige religar o projeto e é tarefa só da faixa A, com dump antes (o primeiro dump é feito antes do primeiro `db push` de prod, em 27/11). O formato dos JSON de `content/` (incluindo `content/essays/demo-essays.json`, `essay-topics.json`, `trail.json`, `competency-map.json`, `config.json`) é fixado por A em `src/contracts/content.ts` (zod) no dia 1 até 14h; `content/config.json` (valores de `app_config`) é de A, entregue na etapa 0 (24/11) e gravado pelo "seed de config" (24/11, lê só `content/config.json`), que é diferente do `seed.ts` v1 (25/11); `content/essays/` é de D; o resto de `content/**` é de C. C é dona do validador (`scripts/validate-content.ts`) e dos testes Vitest do conteúdo (`src/domain/content/__tests__/*`); o `scripts/seed.ts` de A lê esses JSON, inclusive os dois blocos de `demo-essays.json` (`demoAccountEssays` e `fallbackExamples`). D entrega `content/essays/demo-essays.json` em 25/11, e o seed v1 de A (25/11) o lê; se D atrasar, o seed v1 ignora o arquivo até ele existir.
- **Trabalho:** trunk-based; branches curtas `faixa-x/...`; PR com CI verde e preview da Vercel; merge na main pelo menos 2 vezes por dia. Agentes em paralelo usam `git worktree` próprio. Sem commit na main e sem push sem o grupo pedir.
- **Mudança que quebra teste de outra faixa (regra de trabalho deste conjunto de briefings, não vem do plano; os 4 confirmam no dia 1, D-031):** quem fez a mudança avisa o canal e a pessoa dona do arquivo do teste (pela tabela acima) ajusta o teste, no mesmo PR ou em PR imediato, combinado. Proposta, confirmar no dia 1 (D-031).
- **"Testado" (DoD hackathon):** teste automatizado cobrindo o cenário Gherkin e, quando houver UI, evidência: screenshot em `docs/evidencias/<faixa>/`. A cria `docs/evidencias/` e `docs/adr/` com `.gitkeep` na etapa 0; evidências ficam com cada faixa em subpastas (`faixa-a/` a `faixa-d/`) e os ADRs ficam com A (documentador). Testes de UI: cada faixa é dona de `e2e/<faixa>.spec.ts` (`e2e/faixa-b.spec.ts`, `e2e/faixa-c.spec.ts`, `e2e/faixa-d.spec.ts`); A é dona de `e2e/smoke.spec.ts` e da config do Playwright. Testes unitários obrigatórios só no crítico (mastery, quota, schedule, schema e pós-validação da IA, validação do seed); o resto é coberto pelo smoke e2e.
- **Produto e segurança:** RLS ligada em todas as tabelas; escritas "conquistadas" (domínio, tentativas, feedback, uso de IA) só no servidor, com service role em `src/lib/supabase/admin.ts` com `import "server-only"`; gabarito (`question_keys`) nunca vai ao cliente; em `essay_submissions` há duas coisas separadas: (a) as 2 redações da conta demo pertencem à conta demo (`user_id` = conta demo, `is_example=false`, visíveis ao aluno pela RLS normal `user_id = auth.uid()`; semeadas, não criam linhas em `ai_usage` e portanto não consomem o limite de 15 por dia nem o teto global (só retornos novos gerados pela IA consomem), e o limite de 15 por dia da conta demo vale para novos retornos; o seed e o cron as repõem apagando todas as redações da conta demo e inserindo de novo as 2 do estado-base, em transação; `ai_usage.submission_id` é FK `ON DELETE SET NULL`, e o gasto registrado permanece no teto de US$ 20 e no limite diário) e (b) as linhas de reserva (`is_example=true`, `user_id` nulo, `example_key` único) são lidas só no servidor com a service role, usadas com a IA desligada ou o teto atingido, nunca expostas por RLS do aluno; `user_id` não é NOT NULL, com `CHECK (user_id IS NOT NULL OR is_example)` e `CHECK (is_example = (example_key IS NOT NULL))`, e o seed faz upsert por `example_key` só nas reservas (não há índice único global em (`user_id`, `topic_id`, `part`); a conta demo é apagada e reinserida); nenhum segredo em código, log, commit ou screenshot; só dados fictícios (RNF-017); RN-023 (retorno de redação nunca reescreve o texto); aviso RN-014 literal, vindo do servidor; nenhum nome de funcionalidade que sugira simular prova real (RNF-020); toda seção e questão com fonte citada; login só e-mail e senha; limites e valores configuráveis em `app_config`, sem hardcode.
- **Idioma:** UI e documentos em pt-BR; nomes de código em inglês.
- **Congelamento:** funcionalidades congeladas em 29/11 às 12h; submeter até 30/11 às 20h (prazo oficial 23h59); repositório congelado de 30/11 a 12/12 (só `app_config` no painel).

## Checkpoints de corte (valem para todas as faixas)

| Quando | Verificação | Se falhar |
|---|---|---|
| 27/11 | Jornada e Mapa ok? | US-016 (Cronograma) é cortada |
| 28/11 meio-dia | Redação ok? | US-018 (Flashcards) é cortada e C ajuda D |
| 29/11 meio-dia | Início estável? | US-014 é cortada: `/inicio` redireciona para `/jornada` |
| 29/11 12h | Congelar funcionalidades | Só correção crítica depois |
| 30/11 20h | Submissão feita | Folga até 23h59 |

Ordem de corte: US-016, depois US-018, depois US-014.

## Ambiente (resumo)

- `pnpm dev` local usa o projeto Supabase `aprumo-dev` e pode usar `AI_PROVIDER=fake`. O e2e usa `AI_PROVIDER=fake`. O preview da Vercel aponta para `aprumo-dev` com `AI_PROVIDER=fake` por padrão. Produção (`main`) usa `aprumo-prod`, só a faixa A escreve nele (seed, `db push`). O `db push` de PRODUÇÃO é tarefa só de A, exige religar o projeto (`supabase link` para `aprumo-prod`) e dump antes; B, C e D só aplicam migrations em `aprumo-dev`.
- Só a faixa A sobe Supabase local/Docker; as demais faixas não precisam dele (migrations vão ao `aprumo-dev` com `supabase db push`). Se A precisar e `docker info` não responder, pare e avise o grupo.
- Ninguém lê nem cria `.env`; variáveis só por nome em `.env.example`.

## Links dos documentos

- [Plano de arquitetura](../plano-hackathon.md)
- [Histórias (Gherkin)](../../requisitos/historias.md)
- [Requisitos e regras de negócio](../../requisitos/requisitos.md)
- [Pendências e decisões](../../backlog/pendencias.md)
- [Definition of Done](../../definition-of-done.md)

## Em aberto (não decidir nos briefings)

- **D-010:** modelo de IA. A comparação de 2 modelos (protocolo da faixa D) roda na tarde do dia 1 (24/11), com 3 temas provisórios escritos por D no próprio corpus (os 3 oficiais de C entram depois, sem refazer a comparação); o modelo é decidido em 25/11 e registrado em ADR-005. Em aberto até lá.
- **D-020:** teto global final de custo de IA (US$ 20 provisório; valor final fixado no dia 1). Em aberto.
- **D-030:** regras mínimas de senha e recuperação de senha na demo. Em aberto; decidir antes de implementar o cadastro.
- **D-031:** regra de quem ajusta teste quebrado de outra faixa. Proposta: o dono do teste ajusta; confirmar no dia 1. Baixa prioridade.
- **D-032:** possível divergência de Gherkin na US-010 (lista de Trilhas) e na US-018 ("nós acendem"); confirmar na implementação. Baixa prioridade.
- **Ponto de atenção (sem decisão):** sem escala (qualquer integrante atende), o dump e a conferência do monitor podem ficar sem dono. Dump de prod: o primeiro antes do primeiro `db push` de prod (27/11); depois diário de 29/11 a 12/12 e antes de cada `db push`; A recarrega o seed de prod com os 18 conteúdos depois de 28/11. O dono do dump e do monitor segue como ponto de atenção do grupo.

## O que os 4 devem confirmar no dia 1 (24/11)

1. **Limites do Supabase Free**, na documentação oficial, com a fonte anotada: nº de projetos ativos, armazenamento, tráfego, e-mails de Auth, pausa por inatividade, backups e restauração.
2. **Limites do Vercel Hobby:** funções, duração máxima, cron (1 por dia), uso não comercial.
3. **API da versão instalada do AI SDK** (pacote `ai`): `generateText` com `Output.object`, `NoObjectGeneratedError`, e se necessário `streamText`; confirmar no código instalado, não de memória.
4. **Região gru1** (Vercel) e **sa-east-1** (Supabase) disponíveis nos planos gratuitos.
5. Nome do arquivo de borda da sessão (`middleware.ts` ou `proxy.ts`) conforme a versão do Next instalada.
6. Regra de quem ajusta teste quebrado de outra faixa (acima, D-031) e a mitigação do "sem dono" (dump e monitor).
