# Briefing da Faixa C: Estudo e conteúdo

Projeto Aprumo (hackathon Hack Brasil 2026). Leia antes o [README dos briefings](README.md). Fonte principal: `docs/arquitetura/plano-hackathon.md`. Em conflito, o Gherkin de `docs/requisitos/historias.md` manda; relate a divergência ao grupo, não decida sozinho. Especialistas: dev-web, dev-backend (conteúdo: todos ajudam nos dias 2 a 5).

## 1. Objetivo e histórias

Estudar um conteúdo com fonte, dominar pelo mini-simulado, revisar com flashcards, e escrever todo o conteúdo do seed (Português/Redação).

| História | Resumo | Critério de pronto ("testado" = teste automatizado do cenário Gherkin + screenshot em `docs/evidencias/` quando houver UI) |
|---|---|---|
| [US-012](../../requisitos/historias.md) | Estudar um conteúdo | Abre pelo drawer, roadmap ou sessão; cada seção mostra a fonte citada; pergunta rápida; ao terminar as seções segue ao mini-simulado. Sem vídeo, Book nem impressão. |
| [US-013](../../requisitos/historias.md) | Dominar e ver no Mapa | 5 questões, 80%: com 4 ou mais acertos vira "dominado" e o nó acende; com 3 ou menos mostra as seções a rever e volta ao estudo; usa `quiz_question_count` e `quiz_pass_threshold_pct` de `app_config` (teste com outros valores, sem alterar código). Teste unitário de `mastery.ts` (RN-007). Verificação em runtime: 3 de 5 e 4 de 5. |
| [US-018](../../requisitos/historias.md) (Should) | Flashcards | Respondo, viro e avalio confiança em 4 níveis, e a próxima revisão é agendada; ao fim, os conteúdos revisados ganham destaque "revisado hoje" no Mapa; sem pendências mostra mensagem de nada pendente. Teste unitário de `flashcard-scheduler.ts`. |
| [US-049](../../requisitos/historias.md) | Conteúdo de exemplo com fonte | 18 conteúdos de Português/Redação; toda seção com fonte citada; toda questão original ou pública com fonte (RF-062); cada conteúdo com pelo menos 1 seção e 5 questões (90 no total). Validado por teste Vitest sobre `content/`. |

## 2. Stack e comandos

Next.js App Router + TypeScript + Tailwind; Supabase (SP); pnpm. **Um único lockfile.** Proibido criar segundo lockfile, trocar de gerenciador ou reinstalar `node_modules` sem combinar. Todos os pacotes são instalados por A na etapa 0; acréscimo só por PR a A. Markdown das seções (`body_md`): o renderizador é instalado por A na etapa 0; troca só por PR a A, sem inventar pacote.

Comandos: `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (vitest; inclui validação do `content/`), `pnpm test:e2e`, `pnpm build`, `pnpm db:push`, `pnpm db:types`, `pnpm seed` (roda a faixa A; você valida em `aprumo-dev` quando combinado), `pnpm eval:essay` (da faixa D).

## 3. Arquivos: exclusivos, proibidos, quem ajusta

**Exclusivos da faixa C:** `src/app/(app)/{conteudos,revisar}/*`, `src/features/{study,quiz,flashcards}/*`, `src/server/actions/{study,quiz,flashcards}.ts`, `src/server/queries/{content,quiz,flashcards}.ts`, `src/domain/{mastery,flashcard-scheduler}.ts` + testes, `content/**` **exceto** `content/essays/` (da faixa D) e `content/config.json` (da faixa A), `scripts/validate-content.ts` e `src/domain/content/__tests__/*` (validador zod e testes Vitest do conteúdo), `e2e/faixa-c.spec.ts`, `docs/evidencias/faixa-c/`, `supabase/migrations/*` (migrations aditivas da faixa, com timestamp no nome). Cada faixa cria migrations aditivas com timestamp quando precisar (em `supabase/migrations/`); quem cria a migration a aplica no projeto `aprumo-dev` com `supabase db push` (projeto vinculado) e gera `src/lib/supabase/types.ts` com `supabase gen types typescript --project-id <id do aprumo-dev>` no mesmo PR. O conteúdo de `content/**` sob sua responsabilidade inclui `trail.json`, `competency-map.json` e `essay-topics.json` (temas: 3 originais e fictícios; o texto motivador é do time e leva fonte quando citar algo).

**Não pode tocar:** `src/contracts/*`, `src/lib/supabase/*`, `scripts/seed.ts`, `content/config.json`, `package.json`, lockfile, configs, `supabase/config.toml` e a migration 0001, `src/server/actions/auth.ts`, `src/server/queries/home.ts`, `src/features/{auth,home}/*`, `e2e/smoke.spec.ts` (A); `(app)/{mapa,trilhas,jornada,cronograma}`, `features/{map,journey,schedule}`, `e2e/faixa-b.spec.ts` (B); `src/server/ai/**`, `redacao`, `api/essays`, `content/essays/**`, `e2e/faixa-d.spec.ts` (D). O formato dos JSON é de A (`src/contracts/content.ts`); se exigir mudança nele ou no `seed.ts`, peça a A por PR.

**Contratos:** só por adição, com PR revisado por quem consome. Mudança que quebre teste de outra faixa: avise o canal; a pessoa dona do teste ajusta (proposta do README, confirmar no dia 1, D-031).

## 4. Contratos, dependências e fixtures

**Produz (queries em `src/server/queries/*`):**
- `getContentView(slug, userId)` retorna `ContentView { id, slug, title, sections: { id, kind: 'text'|'quick_question'|'example'|'summary', title, bodyMd, quickQuestion?, sourceCitation, sourceUrl? }[], status }`.
- `getQuizView(slug)` retorna `QuizView { contentId, questions: { id, stem, options: string[] }[] }`, **sem gabarito** (`correct_index` nunca vai ao cliente).
- `getDueFlashcards(userId)` retorna `FlashcardView[] { id, contentId, contentTitle, front, back }`.

**Produz (Server Actions, com zod e `ActionResult`):**
- `markStudying { contentId }` retorna `{}`.
- `submitQuizAttempt { contentId, answers: { questionId, optionIndex }[] }` retorna `QuizResult { correct, total, thresholdPct, passed, mastered, sectionsToReview: {id, title}[] }`. Corrige no servidor lendo `question_keys` (service role) e grava `quiz_attempts` e `content_progress` (escritas "conquistadas": só servidor, com `server-only`, depois de `supabase.auth.getUser()`).
- `reviewFlashcard { flashcardId, rating: 1|2|3|4 }` retorna `{ nextDueOn }` usando `flashcard_intervals_days` ({1:1, 2:2, 3:4, 4:7}) de `app_config`.

Erros: `VALIDATION`, `NOT_FOUND`, `UNAUTHENTICATED`, `INTERNAL` (de `ErrorCode`), mensagem em pt-BR.

**Rotas:** `/conteudos/[slug]`, `/conteudos/[slug]/mini-simulado`, `/revisar`.

**Consome:** contratos v1 (inclui `src/contracts/content.ts`, formato dos JSON de `content/`), 0001, `app_config`/`src/server/config.ts` e clientes Supabase (A, até 24/11 14h); `getActiveJourney` e rota `/jornada` (B) para "próximo conteúdo".

**Entrega a outros:** `trail.json` e `essay-topics.json` (3 temas) até **24/11 às 18h** (B e D); seed de conteúdos: **6 conteúdos completos em 25/11 (dia 2)** (B e D dependem disso), os 18 até **28/11 (dia 5)**. `competency-map.json` (competência para conteúdo) alimenta a sugestão da faixa D: toda competência de 1 a 5 com pelo menos 1 conteúdo. `getDueFlashcards` é usada por A no Início.

**Fixtures:** até o backend existir, monte as telas com `ContentView` e `QuizView` de `src/contracts/fixtures.ts`.

### Formato `content/` (validado com zod pelo seed e por Vitest)
Um JSON por conteúdo, mais `trail.json`, `competency-map.json` e `essay-topics.json` (seus); `config.json` é de A e `content/essays/demo-essays.json` é de D (o validador e os testes cobrem ambos, com o formato de A). Slugs únicos; arestas (pré-requisito) sem ciclo; cada seção com `source_citation` NOT NULL; cada questão com `origin: 'original'|'public'` e `source_citation`; mínimo de 5 questões e 3 flashcards por conteúdo; posições `pos_x` e `pos_y` dos nós. O formato (schemas zod em `src/contracts/content.ts`, incluindo `content/essays/demo-essays.json` de D, `essay-topics.json`, `trail.json`, `competency-map.json` e `config.json`) é fixado por A no dia 1 até 14h. C entrega o validador `scripts/validate-content.ts` e os testes Vitest `src/domain/content/__tests__/*` (fonte em toda seção, 5 questões por conteúdo, grafo sem ciclos, slugs únicos, competências 1 a 5). O `scripts/seed.ts` de A lê esses JSON, inclusive os dois blocos de `demo-essays.json` (`demoAccountEssays` e `fallbackExamples`, este com `example_key` único).

### Os 18 conteúdos (arestas = pré-requisito; competência entre parênteses)
1 Tipologia e gêneros: texto dissertativo-argumentativo (C2); 2 Leitura da proposta e recorte temático, fuga e tangenciamento (C2); 3 Estrutura em 4 parágrafos (C2); 4 Repertório sociocultural legitimado e produtivo (C2/C3); 5 Introdução: contextualização e tese (C2/C3); 6 Tese e projeto de texto (C3); 7 Tipos de argumento (C3); 8 Desenvolvimento: tópico frasal e aprofundamento (C3); 9 Paragrafação (C4); 10 Coesão referencial (C4); 11 Conectivos e coesão sequencial (C4); 12 Concordância verbal e nominal (C1); 13 Regência e crase (C1); 14 Pontuação: vírgula (C1); 15 Registro formal e desvios de oralidade (C1); 16 Proposta de intervenção: os 5 elementos (C5); 17 Direitos humanos na proposta (C5); 18 Conclusão: retomada e proposta (C5).

Fontes aceitas (citar edição e página quando for livro): "A redação no ENEM: Cartilha do Participante" (INEP, edição vigente), Matriz de Referência do ENEM (INEP), BNCC (MEC), Manual de Redação da Presidência da República (3ª ed.), gramáticas de referência (Bechara; Cunha e Cintra). Confirme cada fonte consultando o documento; não invente página nem citação.

Entregáveis de conteúdo: 18 conteúdos, **90 questões originais do time** (5 por conteúdo, `origin='original'`), 54 flashcards (3 por conteúdo), Trilha "ENEM: Redação" com os 18, mapa competência para conteúdo, 3 temas de redação.

## 5. Regras de produto e segurança

- RN-018: toda seção exibe a fonte; conteúdo sem fonte não entra no seed (teste falha). RF-062: nenhuma questão licenciada de terceiros; só originais ou públicas com fonte.
- RN-007: dominado via mini-simulado; **definitivo** (reprovação posterior não apaga). Flashcards **não** alteram o domínio. Valores (5, 80) lidos de `app_config`; sem hardcode.
- RN-001: o mini-simulado e as avaliações são sugestões; o aluno pode seguir sem eles onde o Gherkin permitir.
- Gabarito privado (`question_keys` sem política RLS): só o servidor lê. `content_progress` e `quiz_attempts`: escrita só no servidor com service role em `src/lib/supabase/admin.ts` (`server-only`); o aluno não pode marcar domínio pela API REST.
- Conteúdo e textos de exemplo só fictícios, sem dados pessoais; nada de nome de funcionalidade que sugira simular prova real (RNF-020) nem texto que sugira burlar prova ou plágio; nenhum segredo.
- Ao concluir a revisão, os nós dos conteúdos revisados mostram "revisado hoje" no Mapa (via `flashcard_states`; a UI do Mapa é da faixa B).
- Acessibilidade enxuta: teclado e foco visível no mini-simulado e nos flashcards; resultado anunciado em região `aria-live`.

## 6. Plano dia a dia (24 a 30/11)

| Dia | Entregas |
|---|---|
| 24/11 | Revisar contratos v1 e `content.ts` (antes das 14h); validador `scripts/validate-content.ts` + testes de conteúdo sobre o formato de A; lista dos 18 conteúdos e fontes; **`trail.json` e `essay-topics.json` (3 temas) até 18h**. |
| 25/11 | **6 conteúdos completos** (seed; B usa fixtures até aqui e fecha o Mapa real em 26/11); página de conteúdo (seções, fonte, pergunta rápida). |
| 26/11 | Mini-simulado + `submitQuizAttempt` + `mastery.ts` (RN-007, testado); nó acende. |
| 27/11 | Conteúdos 7 a 12; flashcards (US-018) começam. **Checkpoint: Jornada e Mapa ok? (decide a faixa B).** |
| 28/11 | **Meio-dia: se a redação (D) não estiver ok, US-018 é cortada e C ajuda D.** Conteúdos 13 a 18; flashcards concluídos (se mantidos). |
| 29/11 | **Congelar funcionalidades às 12h.** QA cruzado; revisão de fontes. **Meio-dia: US-014 (Início, de A) pode ser cortada.** |
| 30/11 | Disponível para chamado; só correções críticas. |

**Se a faixa atrasar:** conteúdo é o gargalo das demais (Mapa, sugestões). Prioridade: 6 conteúdos no dia 2, depois página, mini-simulado e domínio (US-012, 013, 049). Flashcards (US-018) são a primeira corte da faixa (checkpoint de 28/11 meio-dia); se faltar tempo para os 18 conteúdos, avise no canal e peça ajuda aos outros (conteúdo é "todos"), em vez de reduzir fonte ou questões. Se os 18 não saírem, o Mapa vai com os completos e o grupo decide; não publique conteúdo sem fonte.

## 7. Ambiente

- O e2e usa `AI_PROVIDER=fake` e o preview da Vercel aponta para `aprumo-dev`; você lê e grava só `aprumo-dev`. Nada em `aprumo-prod` (seed e `db push` de prod são da faixa A).
- Só a faixa A sobe Supabase local/Docker; você não precisa dele (migrations vão ao `aprumo-dev` com `supabase db push`). Se `docker info` não responder, pare e avise.
- Build, dev server e testes nunca ao mesmo tempo no mesmo diretório.

## 8. Checklist fixo (todo briefing que altera código)

- (a) Rodar `pnpm lint` e `pnpm typecheck` na RAIZ antes de reportar, não só o do pacote.
- (b) Listar e encerrar processos e tarefas em segundo plano ao terminar, inclusive laços de espera.
- (c) Proibido rodar build, dev server e testes ao mesmo tempo no mesmo diretório; encerrar qualquer servidor que subir.
- (d) Relatar a DoD nos seis estados: executado, passou, falhou, não executado, não verificável, pendência que impede "feita". Teste não executado nunca é aprovado.
- (e) Relatório curto (até 15 linhas, sem colar o diff) terminando com o bloco "Para o registro" (o quê, por quê, arquivos, verificação).
- (f) Agente nunca cria processo auxiliar no host nem canal de comandos por arquivo: se faltar infraestrutura, para e relata.
- (g) Agente nunca lê nem cria `.env`; variáveis só por nome em `.env.example`.
- (h) Sem commit na main nem push sem o grupo pedir; branches `faixa-c/...` curtas; PR com CI verde.

## Pontos a confirmar com o grupo

- US-018 (Gherkin "fim"): "os nós avançados acendem no Mapa". O plano interpreta como destaque visual "revisado hoje" sem alterar o domínio (RN-007). Confirmar com o grupo que essa leitura atende ao Gherkin.
