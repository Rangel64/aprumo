# Evidência T4 (KAN-35): idempotência do seed

Status: preenchido (Supabase local, 25/11/2026). Contagens reais de `pnpm seed` rodado duas vezes. Nunca registrar chaves, URL completa, e-mail ou senha.

## Como executar

Variáveis só no ambiente do shell (nunca em arquivo versionado, nunca coladas aqui):

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_USER_EMAIL` (domínio reservado, ex.: `demo@example.com`) e `DEMO_USER_PASSWORD`

Comandos:

1. Local (`localhost`/`127.0.0.1`): `pnpm seed`
2. `aprumo-dev` (remoto): `SEED_CONFIRM_REMOTE=yes-seed-remote pnpm seed --allow-remote`
3. `pnpm seed --strict` exige todos os 18 conteúdos da Trilha (use depois que a T13 concluir).

O script recusa: destino remoto sem a flag e a confirmação; qualquer destino com "prod" no nome;
e-mail da demo fora de domínio reservado; variável faltando; conteúdo inválido (aborta sem escrever).
Sem `content/essays/demo-essays.json` (T18), termina com sucesso, avisa e ignora reservas e redações da demo.

## Contagens (conteúdo real do repositório, sem `demo-essays.json`)

Banco zerado antes da execução 1 (todas as tabelas com 0, `auth.users` 0). Execução 1 = antes da segunda rodada; execução 2 = depois. A coluna "Igual?" deve ser sim em todas.

| Tabela | Após exec. 1 | Após exec. 2 | Igual? |
|---|---|---|---|
| contents | 6 | 6 | sim |
| content_edges | 6 | 6 | sim |
| content_sections | 36 | 36 | sim |
| questions | 30 | 30 | sim |
| question_keys | 30 | 30 | sim |
| flashcards | 18 | 18 | sim |
| trails | 1 | 1 | sim |
| trail_contents | 6 | 6 | sim |
| competency_contents | 8 | 8 | sim |
| essay_topics | 3 | 3 | sim |
| essay_submissions (reservas, `is_example=true`) | 0 | 0 | sim |
| essay_submissions (conta demo) | 0 | 0 | sim |
| essay_feedbacks | 0 | 0 | sim |
| profiles (`is_demo=true`) | 1 | 1 | sim |
| content_progress (demo) | 3 | 3 | sim |
| journeys / journey_contents (demo) | 1 / 6 | 1 / 6 | sim |
| flashcard_states (demo) | 9 | 9 | sim |
| ai_usage (deve NÃO mudar entre as execuções) | 0 | 0 | sim |

Consulta de apoio (SQL editor; só contagens):

```sql
select 'contents', count(*) from public.contents
union all select 'content_edges', count(*) from public.content_edges
union all select 'content_sections', count(*) from public.content_sections
union all select 'questions', count(*) from public.questions
union all select 'question_keys', count(*) from public.question_keys
union all select 'flashcards', count(*) from public.flashcards
union all select 'trails', count(*) from public.trails
union all select 'trail_contents', count(*) from public.trail_contents
union all select 'competency_contents', count(*) from public.competency_contents
union all select 'essay_topics', count(*) from public.essay_topics
union all select 'essay_submissions reservas', count(*) from public.essay_submissions where is_example
union all select 'essay_submissions demo', count(*) from public.essay_submissions s join public.profiles p on p.id = s.user_id where p.is_demo
union all select 'essay_feedbacks', count(*) from public.essay_feedbacks
union all select 'profiles demo', count(*) from public.profiles where is_demo
union all select 'ai_usage', count(*) from public.ai_usage;
```

## Contagens com `demo-essays.json` fictício (cópia temporária fora do repositório)

Mesmo banco; `pnpm seed` rodado a partir de uma cópia de `content/` com 2 redações da demo e 2 reservas fictícias
(o seed usa `process.cwd()` como raiz).

| Tabela | Antes (sem arquivo) | Após exec. 1 | Após exec. 2 | Igual (1 e 2)? |
|---|---|---|---|---|
| essay_submissions (reservas) | 0 | 2 | 2 | sim |
| essay_submissions (conta demo) | 0 | 2 | 2 | sim |
| essay_feedbacks | 0 | 4 | 4 | sim |
| demais tabelas | ver acima | iguais | iguais | sim |
| ai_usage | 0 | 0 | 1 (linha de teste inserida entre as execuções) | sim: a linha sobreviveu à reposição, com `submission_id` virando NULL |

## Verificações adicionais (local)

- Migrations 0001 e 0002 aplicadas em banco zerado (`supabase db reset`) sem erro.
- `demo_replace_essays`: `anon` e `authenticated` recebem 42501 (permission denied); `service_role` executa; usuário não-demo, `p_essays` não-array e tema inexistente são recusados; uma chamada que falha depois do DELETE reverte (as 2 redações da demo continuam).
- Conta demo (login por REST como demo, sob RLS): 3 dominados (posições 1 a 3 da Trilha), 1 Jornada `active` com prazo hoje + 30 dias, 9 `flashcard_states` com `due_on` = hoje.
- Depois de alterar a conta demo (progresso e estados de flashcard) e rodar o seed de novo, contagens e estado voltaram ao baseline.
- Guardas: URL com "prod" (com e sem flags), host remoto sem flags, `--allow-remote` sem a confirmação, protocolo ftp, DEMO_USER_* ausentes e e-mail fora de domínio reservado saem com código 1, sem imprimir URL, chave, e-mail ou senha, e sem escrever no banco.
- Conteúdo inválido (cópia temporária com fonte vazia): "Conteúdo inválido; nada foi escrito.", código 1, contagens e títulos inalterados.
- `pnpm rls:check`: 77 de 77 (após `pnpm seed:config`; sem ele, 76 de 77, falha só em "app_config tem as 10 chaves", que é do `seed:config` da T2).
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (246 testes) e `pnpm build`: ok. `pnpm test:e2e`: 14 de 14 contra `pnpm start` com build feito com o Supabase local (navegador: Edge do sistema, `E2E_BROWSER_CHANNEL=msedge`; o Chromium do Playwright não estava instalado).

## Estado-base da demo (conferir após o seed)

- 3 conteúdos dominados (os 3 primeiros da Trilha), 1 Jornada ativa com prazo hoje + 30 dias.
- Flashcards desses conteúdos com `due_on` = hoje.
- 2 redações da conta demo com retorno (`user_id` = conta demo, `is_example=false`) quando houver `demo-essays.json`.
- Entrar como conta demo e ver 3 dominados, a Jornada e as redações.

## Verificação da função de reposição (`demo_replace_essays`)

- Anon/authenticated não executam: `rpc` com a chave anon deve falhar com permissão negada.
- Lançar uma redação extra na conta demo e rodar o seed: o total de redações da conta volta a 2 e `ai_usage` mantém as linhas.

## Limitações e decisões aceitas

- O upsert do catálogo nunca remove itens apagados do JSON: um item removido do arquivo continua no banco até ser apagado à mão.
- O reset do estado-base (progresso, Jornada, `flashcard_states`) não é transacional; só as redações são (função SQL). Risco aceito no MVP; rever se o cron da T5 falhar no meio.
- O reset apaga todas as redações da conta demo, inclusive as de visitantes, de propósito (a conta volta ao estado-base).

## Resultado

25/11/2026, ambiente `local` (Supabase via Docker), executado pelo agente qa. Conclusão: a 2ª execução não altera nenhuma contagem; `ai_usage` preservado; guardas e validação recusam sem escrever. Não executado no `aprumo-dev` (fora do escopo desta verificação).
