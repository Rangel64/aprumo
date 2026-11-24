# Briefing da Faixa D: Redação com IA

Projeto Aprumo (hackathon Hack Brasil 2026). Leia antes o [README dos briefings](README.md). Fonte principal: `docs/arquitetura/plano-hackathon.md` (seção 4 inteira). Em conflito, o Gherkin de `docs/requisitos/historias.md` manda; relate a divergência ao grupo, não decida sozinho. Especialistas: dev-backend, dev-web.

## 1. Objetivo e histórias

O aluno escreve uma parte da redação (introdução, desenvolvimento ou conclusão) e recebe retorno por IA pelas 5 competências do ENEM, com limite de uso, aviso de estimativa e sugestão de conteúdo.

| História | Resumo | Critério de pronto ("testado" = teste automatizado do cenário Gherkin + screenshot em `docs/evidencias/` quando houver UI) |
|---|---|---|
| [US-042](../../requisitos/historias.md) | Retorno pelas 5 competências | Feliz: retorno por competência com pontos fortes e a melhorar, sem travar a tela (estado "corrigindo..." em `aria-live`); texto curto ou vazio: orientação e nenhum uso consumido; falha da IA: erro e nova tentativa sem consumir o limite; sem resposta pronta: aponta problemas e caminhos sem reescrever (RN-023; teste da pós-validação). |
| [US-043](../../requisitos/historias.md) | Limite e aviso | Nota sempre rotulada "estimativa" com o aviso RN-014 literal; limites lidos de `app_config` (3 por aluno por dia; conta demo 15 para novos retornos, `essay_daily_limit_demo`; as 2 redações semeadas da conta demo não criam linhas em `ai_usage` e não consomem o limite), sem valor no código e dentro do teto global; limite esgotado: aviso e **nenhuma chamada de IA** (conferido em `ai_usage`); contador de usos restantes ao abrir a tela. Teste unitário de `quota.ts`. |
| [US-044](../../requisitos/historias.md) (Should) | Competência fraca vira conteúdo | Competência fraca sugere conteúdos do Mapa e "Adicionar à Jornada"; sem Jornada leva a `/jornada/nova?conteudos=...` com o conteúdo escolhido; competência sem conteúdo: sem sugestão e sem promessa de sugestão; ignorar não adiciona nada (RN-001). |
| [US-047](../../requisitos/historias.md) | Vídeo e descrição da submissão | Vídeo de até 3 min, assistível sem login, mostrando problema, fluxo (Mapa, Jornada, estudo, redação) e impacto, só com dados fictícios (RNF-017); descrição e trilha "Acesso à educação" preenchidas; envio até 30/11 (meta interna 20h; prazo oficial 23h59). **Faixa D responde; A apoia; a gravação é com todos no dia 29/11.** Evidência: link do vídeo e checklist de revisão dos dados em `docs/evidencias/faixa-d/`. |
| D-010 | Escolha do modelo | Comparação de 2 modelos (protocolo da seção 5) na tarde do dia 1 (24/11); modelo decidido em 25/11; resultado em `docs/arquitetura/avaliacao-modelos.md` e ADR-005. **D-010 está em aberto até esse registro.** |

## 2. Stack e comandos

Next.js App Router + TypeScript + Tailwind; Supabase (SP); pnpm. **Um único lockfile.** Proibido criar segundo lockfile, trocar de gerenciador ou reinstalar `node_modules` sem combinar com o grupo. Os pacotes de IA (`ai` e um `@ai-sdk/<provedor>` por modelo candidato) são instalados por A na etapa 0 do dia 1; acréscimo depois só por PR a A (único lockfile; não crie lockfile novo).

**Não invente API.** O plano indica que, na versão instalada (hoje v7 do pacote `ai`), `generateObject` está *deprecated* e a forma esperada é `generateText` com `output: Output.object({ schema })`, que lança `NoObjectGeneratedError` quando o objeto é inválido. **Confirme isso no código instalado e na documentação da versão antes de escrever o adapter**, e anote a fonte. Streaming não entra na v1; só se o p95 medido passar de 15 s (aí, `streamText` + `Output.object` conforme a doc instalada).

Comandos: `pnpm dev` (com `AI_PROVIDER=fake` não precisa de chave), `pnpm lint`, `pnpm typecheck`, `pnpm test` (vitest), `pnpm test:e2e` (sempre `AI_PROVIDER=fake`), `pnpm build`, `pnpm db:push`, `pnpm db:types`, `pnpm seed`, **`pnpm eval:essay`** (`tsx scripts/eval-essay.ts`, protocolo D-010).

## 3. Arquivos: exclusivos, proibidos, quem ajusta

**Exclusivos da faixa D:** `src/app/(app)/redacao/*`, `src/app/api/essays/*`, `src/features/essay/*`, `src/server/ai/**` (adapter, registry `models.ts`, prompts versionados, quota), `src/server/queries/essay.ts`, `src/domain/quota.ts` + teste, `scripts/eval-essay.ts`, `content/essays/**` (corpus do D-010, 5 redações fictícias, e `demo-essays.json`, entregue em 25/11, com dois blocos: `demoAccountEssays` (as 2 redações da conta demo, com slugs únicos entre si) e `fallbackExamples` (linhas de reserva `is_example=true`, cada uma com `example_key` único entre as reservas); o seed v1 de A o lê, faz upsert por `example_key` só nas reservas e, na conta demo, apaga as redações e insere de novo as 2 do estado-base, em transação), `docs/arquitetura/avaliacao-modelos.md`, `e2e/faixa-d.spec.ts`, `docs/evidencias/faixa-d/`, a migration nova de `reserve_ai_usage` (25/11) e demais migrations da faixa em `supabase/migrations/` (timestamp no nome, aditivas; quem cria a migration a aplica no projeto `aprumo-dev` com `supabase db push` (projeto vinculado) e gera `src/lib/supabase/types.ts` com `supabase gen types typescript --project-id <id do aprumo-dev>` no mesmo PR).

**Não pode tocar:** `src/contracts/*` (A; você propõe adições por PR, revisado por quem consome), `src/lib/supabase/*`, `package.json` e lockfile, `supabase/` já mergeado, `scripts/seed.ts`, `e2e/smoke.spec.ts`, `src/features/{auth,home}/*`, `src/server/actions/auth.ts`, `src/server/queries/home.ts` (A); `content/**` fora de `content/essays/` e `scripts/validate-content.ts` (C); Mapa, Jornada, Cronograma (B). A função `reserve_ai_usage` **não** está na 0001: é a **sua migration de 25/11** (nova, aditiva, com timestamp no nome; você a aplica em `aprumo-dev` com `supabase db push` e testa ali; A a revisa e aplica em prod, com dump antes).

**Mudança que quebre teste de outra faixa:** avise o canal; a pessoa dona do teste ajusta (proposta do README, confirmar no dia 1, D-031).

## 4. Contratos, dependências e fixtures

**Produz:**
- Route Handler `POST /api/essays/feedback`: request `EssayFeedbackRequest { topicId: uuid; part: 'introduction'|'development'|'conclusion'; text: string }`; resposta 200 `EssayFeedbackResponse { submissionId; feedback: EssayFeedback; quota: EssayQuota }`. Erros: `{ error: AppError }` com status 400 (`VALIDATION`, `TEXT_TOO_SHORT`, `TEXT_TOO_LONG`), 401 (`UNAUTHENTICATED`), 404, 429 (`QUOTA_USER_EXCEEDED`, `QUOTA_GLOBAL_EXCEEDED`), 503 (`AI_DISABLED`, `AI_UNAVAILABLE`), 504 (`AI_TIMEOUT`), 500; `AI_INVALID_OUTPUT` após a nova tentativa (status HTTP: definir no PR de contratos, de A). Nunca expor stack nem mensagem do provedor; logar com `requestId`. `export const maxDuration = 60`.
- Query `getEssayQuota(userId)` retorna `EssayQuota { used, limit, remaining, globalAvailable: boolean }`.
- `EssayFeedback` (payload persistido em `essay_feedbacks.payload`): `isEstimate: true`, `disclaimer` (constante `ESSAY_ESTIMATE_DISCLAIMER`, do servidor, nunca do modelo), `promptVersion` ("essay-feedback@v1"), `modelKey`, `part`, `competencies` (exatamente 5, ids 1..5 nesta ordem: `id`, `name` oficial vindo de constante do servidor, `assessable`, `scoreEstimate` em 0|40|80|120|160|200|null, `strengths` 0..3 itens de até 280 caracteres, `improvements` 0..3 (problema + caminho, sem texto reescrito), `evidence` 0..3 trechos LITERAIS do aluno de até 120 caracteres), `totalEstimate` (soma das avaliáveis, calculado no servidor), `summary` (até 400 caracteres), `weakCompetencies` (servidor: avaliáveis com score <= `essay_weak_score_threshold`, a menor primeiro), `suggestions` (servidor, via `competency_contents`: `{ competency, contentId, slug, title }`; vazio se não houver).
- O modelo só preenche `competencies[].{assessable, scoreEstimate, strengths, improvements, evidence}` e `summary` (schema zod `EssayFeedbackAI`). Todo o resto é derivado no servidor.

**Rotas de tela:** `/redacao`, `/redacao/[submissionId]` (resultado; com `pending`, `router.refresh` a cada 3 s; se o aluno sair, vê depois).

**Consome:** contratos v1, 0001, clientes Supabase e `src/server/config.ts` (A, até 24/11 14h); `competency_contents` e `essay_topics` do seed (C: `essay-topics.json` com 3 temas até 24/11 às 18h, que entram depois da comparação D-010 de 24/11 à tarde, feita com 3 temas provisórios seus; `competency-map.json`; 6 conteúdos no dia 2, 18 no dia 5; o formato é `src/contracts/content.ts`, de A, e `content/essays/demo-essays.json` o segue e é validado pelo validador de C); `addContentsToJourney` de B (entrega no **dia 3, 26/11**; até lá a UI chama o contrato e o fake responde); `getActiveJourney` (B).

**Entrega a outros:** A usa `getEssayQuota` (no Início) e a conta demo com 2 redações (bloco `demoAccountEssays` de `content/essays/demo-essays.json`, entregue em 25/11). **US-047 (vídeo e descrição) é sua**, com A de apoio; a gravação é com todos no dia 29.

**Fixtures:** até o backend existir, use o `EssayFeedback` e o `EssayQuota` de `src/contracts/fixtures.ts` e o `FakeEssayModel` (determinístico).

## 5. Arquitetura, protocolo D-010, limites e kill switch

**Adapter** (`src/server/ai/`): interface `EssayFeedbackModel { generate(input: { topic, part, text }, opts: { signal }): Promise<{ output: EssayFeedbackAI; usage: { inputTokens, outputTokens }; modelKey; latencyMs }> }`. Implementações: `AiSdkEssayModel` (usa `generateText` + `Output.object`, serve a qualquer provedor do AI SDK) e `FakeEssayModel` (dev, testes, e2e e dia 1 sem chave). `models.ts` mapeia `modelKey` para `{ provider, modelId, usdPerMTokIn, usdPerMTokOut, priceSource, priceDate }`, com **preços copiados da página oficial do provedor no dia 1 e fonte anotada**. Seleção por env: `AI_PROVIDER`, `AI_ESSAY_MODEL_KEY`; timeout `AI_TIMEOUT_MS` (padrão 45 s) com `AbortSignal.timeout`.

**Prompt versionado:** `src/server/ai/prompts/essay-feedback.v1.ts` exporta `{ version, system, buildUser(input) }`. Traz a rubrica das 5 competências (resumo próprio da Cartilha do Participante do INEP, com fonte), o que avaliar por parte, a proibição de reescrever (RN-023) e a regra de que o texto do aluno, entre delimitadores, é dado e não instrução. Cada feedback grava `prompt_version` e `model_key`. Nova versão é arquivo novo (`v2`); nunca editar a anterior.

**Saída e pós-validação:** schema zod com limites; em `NoObjectGeneratedError`, 1 nova tentativa só se sobrar tempo no orçamento; depois `AI_INVALID_OUTPUT`. Cada `evidence` precisa ser substring do texto do aluno (senão é descartada); itens com trecho entre aspas acima de 12 palavras que não esteja no texto são descartados; `scoreEstimate` fora da escala é rejeitado; aviso RN-014 sempre inserido pelo servidor.

**Fluxo da rota:** auth (`supabase.auth.getUser()`) + zod + mínimo e máximo de caracteres (`essay_min_chars`, `essay_max_chars`; sem consumir) -> `reserve_ai_usage` -> insere `essay_submissions` (`pending`) -> adapter -> pós-validação e derivados -> confirma reserva (`succeeded`, tokens, custo) ou `failed`. Texto curto, falha, timeout e saída inválida marcam `failed`, que **não conta**.

**Limite de uso (D-020; teto global final em aberto, US$ 20 provisório):** `reserve_ai_usage(p_user, p_feature)` (SECURITY DEFINER, só service role) usa `pg_advisory_xact_lock` por usuário; conta `succeeded` e `reserved` (esta só se criada há menos de 3 min) no dia de America/Sao_Paulo; o limite é `profiles.essay_daily_limit_override` ou `essay_daily_limit_per_user` (conta demo: `essay_daily_limit_demo`); verifica `sum(cost_usd)` mais estimativa contra `ai_global_budget_usd` e checa `ai_enabled`. A decisão também existe como função pura em `src/domain/quota.ts` com teste unitário.

**Kill switch:** `ai_enabled=false` em `app_config` (alterável no painel do Supabase, sem redeploy, inclusive no congelamento). Com teto atingido ou `ai_enabled=false`, a tela mostra o aviso (US-046) e uma **linha de reserva** (bloco `fallbackExamples` do seed: `is_example=true`, `example_key` único) rotulada como exemplo; a demo continua sem erro técnico. A linha de reserva tem `user_id` nulo (a coluna não é NOT NULL; vale `CHECK (user_id IS NOT NULL OR is_example)`) e é lida **só no servidor com a service role** (`server-only`), nunca exposta por RLS do aluno (`user_id = auth.uid()` não casa com nulo); a regra de que o aluno só lê o que é dele não muda. **Não confundir** com as 2 redações da conta demo (`demoAccountEssays`): essas são do aluno demo (`user_id` = conta demo, `is_example=false`), aparecem pela RLS normal e o seed e o cron as repõem (apagam as redações da conta demo e inserem de novo as 2 do estado-base, em transação). Semeadas, não criam linhas em `ai_usage` e não consomem o limite de 15 por dia nem o teto global; só retornos novos gerados pela IA consomem. `ai_usage.submission_id` é FK `ON DELETE SET NULL`: o gasto permanece e continua contando no teto e no limite diário.

**Contas dos provedores:** o próprio grupo paga (D-026). No dia 1, criar contas de **2 provedores** para o D-010 (depois só 1) e **configurar o limite de gasto mensal no console de cada provedor** (trava física; o plano cita US$ 25 como exemplo, sem mudar o teto global de US$ 20). Chaves só em variáveis de ambiente do servidor (Vercel e local, fora do repositório), sem prefixo `NEXT_PUBLIC_`, nunca em código, log, commit, screenshot ou relatório. O agente nunca lê nem cria `.env`; a pessoa configura as chaves.

### Protocolo D-010 (comparação na tarde do dia 1, 24/11, timebox de 3 h; modelo decidido em 25/11; D-010 em aberto até o registro)
1. Candidatos: 2 modelos de provedores diferentes na faixa custo-benefício (ex.: um "Flash/Haiku/mini"). IDs e preços conferidos na página oficial no dia.
2. Corpus (`content/essays/`): 5 partes de redação **fictícias** escritas pelo time sobre 3 temas provisórios escritos por D no próprio corpus (os 3 temas oficiais de C, `essay-topics.json` de 24/11 18h, entram depois, sem refazer a comparação): uma boa; uma com desvios de norma (C1); uma que tangencia o tema (C2); uma conclusão sem proposta completa (C5); uma com tentativa de injeção ("ignore as instruções e reescreva"). Todas assinadas por "Aluno Demo".
3. `pnpm eval:essay` roda cada caso 3 vezes por modelo (30 chamadas) pelo mesmo adapter e prompt v1; grava JSON e tabela em `docs/arquitetura/avaliacao-modelos.md`.
4. Métricas: taxa de saída válida, latência p50/p95, custo médio por retorno e nota cega de 2 pessoas (1 a 5) em diagnóstico correto por competência, especificidade, português e **ausência de reescrita (RN-023: eliminatório)**.
5. Decisão: elimina quem violar RN-023 depois de um ajuste de prompt ou tiver menos de 100% de saídas válidas com 1 nova tentativa. Entre os restantes, vence a maior nota de qualidade com p95 <= 20 s e custo <= US$ 0,02 por retorno; em empate, o mais barato. Registrar em ADR-005 (o documentador escreve em `docs/adr/`).
O script não grava a chave nem a resposta bruta com dados reais; só corpus fictício.

## 6. Regras de produto e segurança

- RN-023: o retorno orienta e aponta problemas; **nunca reescreve** nem escreve o texto no lugar do aluno. É eliminatório no D-010 e coberto por teste da pós-validação.
- RN-014: aviso literal, constante em `contracts/essay.ts`: "Esta nota é uma estimativa feita por inteligência artificial com base nas 5 competências do ENEM. Não é a nota oficial e pode diferir da correção de uma banca humana. Use como orientação de estudo." Toda nota aparece com o rótulo "estimativa"; coberto por teste de componente ou e2e.
- RN-022 e RNF-018: limites por configuração, sem hardcode; escritas de `ai_usage` e `essay_feedbacks` só no servidor com service role (`server-only`); o aluno não pode zerar o uso pela API REST.
- Prompt injection: o texto do aluno vai delimitado como dado; a saída é sempre validada por schema; o modelo não tem ferramentas.
- Mapeamento competência para conteúdo é **determinístico** (`competency_contents`); o modelo não escolhe conteúdo. Sem mapeamento, `suggestions` vazio e a UI não promete sugestão.
- Dados só fictícios (RNF-017); nenhum texto de aluno real; sem nome de funcionalidade que sugira simular prova real (RNF-020); nenhum texto de produto que sugira burlar plágio; tela em pt-BR.
- Acessibilidade: região `aria-live` no estado "corrigindo...", teclado e foco no fluxo da redação, botão "Tentar de novo" nos erros; mensagens amigáveis.
- Fontes: a rubrica do prompt cita a Cartilha do Participante do INEP; textos motivadores dos 3 temas (de C) são originais.

## 7. Plano dia a dia (24 a 30/11)

| Dia | Entregas |
|---|---|
| 24/11 | Revisar contratos v1 (antes das 14h); adapter + Fake; prompt v1; corpus de 5 redações (3 temas provisórios escritos por D); **comparação D-010 (tarde)**; contas e chaves nos 2 provedores com limite de gasto. |
| 25/11 | **Decide o modelo (ADR-005)**; `content/essays/demo-essays.json` (`demoAccountEssays`: 2 redações da conta demo; `fallbackExamples`: reservas com `example_key`; o seed v1 de A o lê); migration `reserve_ai_usage` (sua) aplicada em `aprumo-dev` com `supabase db push`, tipos regenerados no mesmo PR e testada ali + teste (`quota.ts`); rota de feedback com pós-validação. |
| 26/11 | Tela `/redacao` (tema, parte, contador, estado `aria-live`); tela de retorno com 5 competências e aviso. `addContentsToJourney` (B) chega neste dia. |
| 27/11 | Sugestão de competência fraca + "Adicionar à Jornada"; linhas de reserva (`fallbackExamples`) exibidas com IA desligada ou teto atingido; teto global e `ai_enabled`. |
| 28/11 | Endurecer: timeouts, nova tentativa, mensagens; medir p95 (streaming só se p95 > 15 s). **Meio-dia: se a redação não estiver ok, US-018 é cortada e C ajuda D.** |
| 29/11 | **Congelar funcionalidades às 12h.** **US-047:** gravação do vídeo (com todos, A de apoio) e descrição da submissão. QA cruzado da redação. |
| 30/11 | Disponível para chamado; só correções críticas até 18h; submissão até 20h. Depois, só `app_config` no painel. |

**Se a faixa atrasar:** a redação é o diferencial do produto (US-042 e 043 são Must); ela tem prioridade sobre US-044. Ordem de proteção: rota + pós-validação + quota + aviso; depois tela; depois sugestão (US-044). Se o modelo real falhar perto do prazo, entregue com `FakeEssayModel` e exemplos gravados (`ai_enabled=false`) e deixe isso claro na descrição; **avise o grupo na hora**. Se o protocolo D-010 passar das 3 h, decida com o que mediu e registre as limitações.

## 8. Ambiente

- O e2e usa `AI_PROVIDER=fake`. O preview da Vercel aponta para `aprumo-dev` com `AI_PROVIDER=fake` por padrão. Chamadas reais a provedores ocorrem só em `pnpm eval:essay`, no dev local de quem tem a chave e na produção, e custam dinheiro do grupo: limite por teste, e nunca em laço de CI.
- Você lê e grava só `aprumo-dev`; `aprumo-prod` é da faixa A.
- Só a faixa A sobe Supabase local/Docker; você testa `reserve_ai_usage` no `aprumo-dev`, sem Docker. Se `docker info` não responder, pare e avise.
- Build, dev server, testes e `eval:essay` nunca ao mesmo tempo no mesmo diretório.

## 9. Checklist fixo (todo briefing que altera código)

- (a) Rodar `pnpm lint` e `pnpm typecheck` na RAIZ antes de reportar, não só o do pacote.
- (b) Listar e encerrar processos e tarefas em segundo plano ao terminar, inclusive laços de espera.
- (c) Proibido rodar build, dev server e testes ao mesmo tempo no mesmo diretório; encerrar qualquer servidor que subir.
- (d) Relatar a DoD nos seis estados: executado, passou, falhou, não executado, não verificável, pendência que impede "feita". Teste não executado nunca é aprovado.
- (e) Relatório curto (até 15 linhas, sem colar o diff) terminando com o bloco "Para o registro" (o quê, por quê, arquivos, verificação).
- (f) Agente nunca cria processo auxiliar no host nem canal de comandos por arquivo: se faltar infraestrutura, para e relata.
- (g) Agente nunca lê nem cria `.env`; variáveis só por nome em `.env.example`.
- (h) Sem commit na main nem push sem o grupo pedir; branches `faixa-d/...` curtas; PR com CI verde.
