# Briefing da Faixa B: Mapa e Jornada

Projeto Aprumo (hackathon Hack Brasil 2026). Leia antes o [README dos briefings](README.md). Fonte principal: `docs/arquitetura/plano-hackathon.md`. Em conflito, o Gherkin de `docs/requisitos/historias.md` manda; relate a divergência ao grupo, não decida sozinho. Especialistas: dev-web, dev-backend.

## 1. Objetivo e histórias

Mapa de conteúdos de Português/Redação, Trilha, criação de Jornada com meta e prazo, e cronograma mínimo.

| História | Resumo | Critério de pronto ("testado" = teste automatizado do cenário Gherkin + screenshot em `docs/evidencias/` quando houver UI) |
|---|---|---|
| [US-006](../../requisitos/historias.md) | Ver o Mapa com conteúdos | Nós e ligações aparecem (18 conteúdos do seed); ligação que criaria ciclo é rejeitada: teste Vitest de C sobre `content/` (`src/domain/content/__tests__/*`, grafo sem ciclos) antes do seed. Screenshot do Mapa. |
| [US-009](../../requisitos/historias.md) | Explorar o Mapa | Filtro por estado (`/mapa?estado=todos\|dominado\|estudando\|nao-iniciado`), drawer do nó (estado, pré-requisitos, Trilhas; "Estudar conteúdo" e "Adicionar a uma Jornada"), mensagem de vazio com "limpar filtros". Filtros por área/Trilha opcionais (recorte H). |
| [US-010](../../requisitos/historias.md) | Trilha da plataforma | Uma Trilha ("ENEM: Redação"); mostra nome, objetivo, quantidade de conteúdos e a plataforma como origem; sem opção de criar Trilha. |
| [US-011](../../requisitos/historias.md) | Criar Jornada com meta | Base Trilha ou conteúdos; meta (3..200 caracteres) e prazo (> hoje) obrigatórios, sem meta o fluxo é bloqueado com mensagem; metodologia só "sem metodologia"; a Jornada aparece no Início. Sem submetas, nivelamento, revisão final ou limite de 2 Jornadas (fora do recorte H). |
| [US-016](../../requisitos/historias.md) (Should) | Cronograma mínimo | Gera sessões em datas e horários ligadas a conteúdos da Jornada; "Começar sessão" abre o conteúdo; sem disponibilidade leva a informá-la; sem Jornada mostra convite; disponibilidade insuficiente gera aviso e as sessões mesmo assim; sem cota nem cobrança. Teste unitário de `schedule.ts`. |

## Design (decisão do PO, 24/11/2026): fiel ao Figma

O design da aplicação segue o protótipo do Figma (https://object-study-60652393.figma.site/). Leia `docs/design/README.md` e veja as imagens de referência em `docs/design/figma-prototipo/`. Telas desta faixa: Cronograma e Mapa (Jornada e Trilha no mesmo estilo, só com elementos da fase H). Referência: `03-cronograma.jpg` e `04-mapa.jpg`.

- Use **só** os componentes de `src/components/ui` e os tokens do tema do Tailwind (da faixa A): sem cor, fonte, raio ou sombra soltos no código. Precisa de variante nova? Peça a A por PR; não edite `src/components/ui`.
- Elementos do protótipo fora da fase H não entram (nada do que está fora do recorte H, sem tema escuro). Em conflito com o Gherkin, o Gherkin manda no comportamento e você relata a divergência ao grupo (não decida sozinho). Texto do protótipo "[Nome da plataforma]" vira Aprumo; nome de funcionalidade que o RNF-020 proíbe não é usado.
- Até o layout `(app)` de A chegar (25/11), monte as telas com as fixtures e os componentes base (entregues por A em 24/11); depois, encaixe-as no layout.
- **Critério de pronto "fiel ao Figma":** comparação lado a lado de cada tela (desktop; celular quando o protótipo tiver) com a imagem de referência, salva em `docs/evidencias/faixa-b/` (ex.: `<tela>-lado-a-lado.png`, nossa tela ao lado do JPG de referência); diferenças aceitas ficam anotadas na PR. Sem a comparação, a tela não está "feita".
- O nó do Mapa usa o componente de A (4 estados) dentro do React Flow.


## 2. Stack e comandos

Next.js App Router + TypeScript + Tailwind; Supabase (SP); pnpm. **Um único lockfile.** Proibido criar segundo lockfile, trocar de gerenciador ou reinstalar `node_modules` sem combinar. Os pacotes (inclusive `@xyflow/react`) são instalados por A na etapa 0 (24/11); acréscimo só por PR a A. Mapa: `@xyflow/react` (React Flow), posições dos nós vêm do seed (`pos_x`, `pos_y`), sem biblioteca de layout.

Comandos: `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (vitest), `pnpm test:e2e` (playwright contra `E2E_BASE_URL`), `pnpm build`, `pnpm db:push`, `pnpm db:types`, `pnpm seed`, `pnpm eval:essay` (da faixa D, você não usa).

## 3. Arquivos: exclusivos, proibidos, quem ajusta

**Exclusivos da faixa B:** `src/app/(app)/{mapa,trilhas,jornada,cronograma}/*`, `src/features/{map,journey,schedule}/*`, `src/server/actions/{journey,schedule}.ts`, `src/server/queries/{map,trail,journey,schedule}.ts`, `src/domain/schedule.ts` + teste, `e2e/faixa-b.spec.ts`, `docs/evidencias/faixa-b/`, `supabase/migrations/*` (migrations aditivas da faixa, com timestamp no nome). Cada faixa cria migrations aditivas com timestamp quando precisar (em `supabase/migrations/`); quem cria a migration a aplica no projeto `aprumo-dev` com `supabase db push` (projeto vinculado) e gera `src/lib/supabase/types.ts` com `supabase gen types typescript --project-id <id do aprumo-dev>` no mesmo PR.

**Não pode tocar:** `src/contracts/*`, `src/lib/supabase/*`, `package.json` e lockfile, configs, `supabase/config.toml`, `supabase/migrations` já mergeadas, `src/server/actions/auth.ts`, `src/server/queries/home.ts`, `src/features/{auth,home}/*`, `e2e/smoke.spec.ts`, `src/components/ui/*`, `(app)/layout.tsx`, `(app)/inicio`, `scripts/seed.ts` (A); `content/**` e `scripts/validate-content.ts` (C); `src/server/ai/**`, `redacao`, `api/essays` (D); `{conteudos,revisar}` e `e2e/faixa-c.spec.ts` (C); `e2e/faixa-d.spec.ts` (D).

**Contratos:** só por adição, com PR revisado por quem consome (A é dona; C, D e A consomem os seus). Mudança que quebre teste de outra faixa: avise o canal; a pessoa dona do teste o ajusta (proposta do README, confirmar no dia 1, D-031).

## 4. Contratos, dependências e fixtures

**Produz (queries em `src/server/queries/*`):**
- `getMapView(userId)` retorna `MapView { nodes: { id, slug, title, status: 'not_started'|'studying'|'mastered', reviewedToday, position{x,y}, trailIds[], competencies[] }[], edges: { from, to, kind }[] }`.
- `getTrail(slug)` retorna `TrailView { id, slug, name, objective, origin:'platform', contents: {id, slug, title}[] }`.
- `getActiveJourney(userId)` retorna `JourneyView | null { id, goalDescription, deadline, contents: {id, slug, title, status, position}[], nextContentSlug, masteredCount, total }`.
- `getScheduleView(userId)` retorna `ScheduleView { hasAvailability, journeyId?, sessions: { id, startsAt, minutes, contentSlug, contentTitle, status }[], deadlineAtRisk }`.

**Produz (Server Actions em `src/server/actions/*`, com zod e `ActionResult`):**
- `createJourney { base: {type:'trail', trailId} | {type:'contents', contentIds: uuid[] (>=1)}, goalDescription (3..200), deadline (ISO date > hoje), methodology: 'none' }` retorna `{ journeyId }`.
- `addContentsToJourney { contentIds: uuid[], source: 'map'|'essay_suggestion' }` retorna `{ journeyId, added }` ou erro `NO_ACTIVE_JOURNEY` (a UI redireciona para `/jornada/nova?conteudos=...`).
- `saveAvailability { slots: { weekday 0..6, startTime 'HH:mm', minutes 15..240 }[] (>=1) }` retorna `{ count }`.
- `generateSchedule { journeyId }` retorna `{ sessionsCount, deadlineAtRisk }`.

Códigos de erro vêm de `ErrorCode` (`VALIDATION`, `NO_ACTIVE_JOURNEY`, `UNAUTHENTICATED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`), mensagem em pt-BR pronta para a UI.

**Rotas:** `/mapa`, `/trilhas/[slug]`, `/jornada`, `/jornada/nova?trilha=<slug>&conteudos=<slug,slug>`, `/cronograma`. Navegação em `src/contracts/routes.ts`.

**Consome:** contratos v1, `app_config`/`src/server/config.ts` e clientes Supabase (A, etapa 0, até 24/11 14h); `competencies[]` e dados do Mapa vêm do seed de C (`competency_contents`, `trail_contents`); `status` de domínio vem de `content_progress` (escrito por C); "reviewedToday" vem de `flashcard_states` (C). Rota de estudo `/conteudos/[slug]` é de C.

**Entrega a outros:** `addContentsToJourney` é usada pela faixa D (US-044) até o **dia 3 (26/11)**; `getActiveJourney` e `getMapView` são compostos pela faixa A no Início (US-014, dia 27/11). O Mapa depende do seed de C: 6 conteúdos completos no dia 2 (25/11) e os 18 no dia 5 (28/11); `trail.json` de C chega até 24/11 às 18h.

**Fixtures:** até o backend existir, use `src/contracts/fixtures.ts` (`MapView` de exemplo) para montar o React Flow, também em 25/11, até C entregar os 6 primeiros conteúdos; feche o Mapa real (`getMapView`) em 26/11.

## 5. Regras de produto e segurança

- RN-002: Jornada exige meta e prazo; `goal_*` e `deadline` NOT NULL. RN-001: ignorar sugestão não adiciona nada.
- RLS: `journeys`, `journey_contents`, `availability_slots`, `schedule_sessions` são do aluno (`user_id = auth.uid()`) e podem ser escritas pelo cliente autenticado; ainda assim valide com zod nas actions e confira a sessão (`supabase.auth.getUser()`). Domínio (`content_progress`) é só leitura aqui; nunca escreva nele.
- Mapa: duas tabelas (nós e arestas), sem ciclo (validado nos testes de conteúdo de C); sem pgvector.
- Sem segredos em código, log ou commit; dados só fictícios; login só e-mail e senha (de A). Qualquer texto exibe fonte quando aplicável; nada de nome de funcionalidade que sugira simular prova real (RNF-020).
- Valores configuráveis (nenhum hardcode): limites e durações vêm de `app_config` via `src/server/config.ts` (A, etapa 0, 24/11); a duração de sessão vem da disponibilidade informada (15..240 min).
- Acessibilidade enxuta: teclado e foco visível no drawer e no formulário de Jornada; estado "vazio" legível; sem rolagem horizontal no celular.
- `schedule.ts` é função pura, determinística, testada (inclui `deadlineAtRisk`).

## 6. Plano dia a dia (24 a 30/11)

| Dia | Entregas |
|---|---|
| 24/11 | Revisar contratos v1 (antes das 14h); Mapa com React Flow sobre a fixture. |
| 25/11 | Mapa ainda sobre fixtures até C entregar os 6 primeiros conteúdos (25/11); drawer, filtro por estado; Trilha (com o `trail.json` de C, entregue em 24/11 às 18h). |
| 26/11 | **Fecha o Mapa real (`getMapView`)** com os conteúdos de C; Criar Jornada (meta + prazo), `/jornada` com roadmap; `addContentsToJourney` (D depende disto neste dia). |
| 27/11 | **Checkpoint: Jornada e Mapa ok? Se não, US-016 é cortada.** Cronograma: disponibilidade + `schedule.ts` + teste. |
| 28/11 | Cronograma: gerar + "Começar sessão" (se US-016 foi cortada, ajudar D ou C). **Meio-dia: se a redação não estiver ok, US-018 é cortada e C ajuda D.** |
| 29/11 | **Congelar funcionalidades às 12h.** QA cruzado (roteiro de runtime real, plano seção 7); correções. **Meio-dia: US-014 cortada se o Início não estiver estável** (`/inicio` vira redirecionamento para `/jornada`; mantenha `/jornada` robusta). |
| 30/11 | Disponível para chamado; só correções críticas até 18h; submissão até 20h. |

**Se a faixa atrasar:** o núcleo é Mapa e Jornada (US-006, 009, 010, 011); US-016 é a primeira a ser cortada (decisão no checkpoint de 27/11). Se cortar, remova o link `/cronograma` do menu junto com A e registre. Avise o canal na hora; não empurre trabalho para dentro do congelamento.

## 7. Ambiente

- O e2e usa `AI_PROVIDER=fake` e o preview da Vercel aponta para `aprumo-dev`; você lê e grava só `aprumo-dev` (por `pnpm dev`) com sessão de usuário; escritas sensíveis não existem na sua faixa. Nada em `aprumo-prod`.
- Só a faixa A sobe Supabase local/Docker e roda `seed` e `db push` em prod; você não precisa de Docker (suas migrations vão ao `aprumo-dev` com `supabase db push`). Se `docker info` não responder, pare e avise.
- Build, dev server e testes nunca ao mesmo tempo no mesmo diretório.

## 8. Checklist fixo (todo briefing que altera código)

- (a) Rodar `pnpm lint` e `pnpm typecheck` na RAIZ antes de reportar, não só o do pacote.
- (b) Listar e encerrar processos e tarefas em segundo plano ao terminar, inclusive laços de espera.
- (c) Proibido rodar build, dev server e testes ao mesmo tempo no mesmo diretório; encerrar qualquer servidor que subir.
- (d) Relatar a DoD nos seis estados: executado, passou, falhou, não executado, não verificável, pendência que impede "feita". Teste não executado nunca é aprovado.
- (e) Relatório curto (até 15 linhas, sem colar o diff) terminando com o bloco "Para o registro" (o quê, por quê, arquivos, verificação).
- (f) Agente nunca cria processo auxiliar no host nem canal de comandos por arquivo: se faltar infraestrutura, para e relata.
- (g) Agente nunca lê nem cria `.env`; variáveis só por nome em `.env.example`.
- (h) Sem commit na main nem push sem o grupo pedir; branches `faixa-b/...` curtas; PR com CI verde.

## Pontos a confirmar com o grupo

- US-010 (Gherkin "listar") pede lista de Trilhas com nome, objetivo e quantidade, mas o plano só define a rota `/trilhas/[slug]`. Com uma única Trilha, confirmar se basta a página dela ou se a lista entra em `/mapa`/`/jornada/nova`.
