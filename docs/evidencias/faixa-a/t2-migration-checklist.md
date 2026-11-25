# T2: roteiro para aplicar e conferir a migration 0001 (aprumo-dev)

> Verificação automatizada: `pnpm exec tsx --env-file=.env.local scripts/rls-check.ts` (cobre os casos do bloco 4.6); os casos de grants e o Security Advisor continuam no painel.

Quem executa: o PO (a senha do banco e as chaves são dele). Nada aqui deve ser colado em chat, PR, log ou screenshot: **senha do banco, `SUPABASE_SERVICE_ROLE_KEY` e tokens ficam só no seu terminal**.

Migration: `supabase/migrations/20261124230000_0001_schema.sql` (não executada pelo agente: sem Docker nem acesso ao banco).

## 1. Aplicar

Na raiz do repositório, com o `project-ref` do `aprumo-dev` (Settings > General no painel):

```bash
pnpm exec supabase login                      # abre o navegador; token fica no seu perfil
pnpm exec supabase link --project-ref <ref>   # pede a senha do banco
pnpm exec supabase db push --remote --dry-run # confere que só a 0001 será aplicada
pnpm db:push                                  # aplica (informe a senha se pedir)
```

Se `db push` reclamar de histórico de migrations, não use `--include-all` sem avisar o grupo.

## 2. Tipos

```bash
pnpm db:types
```

Substitui o placeholder `src/lib/supabase/types.ts` (escrito à mão a partir da migration). Depois rode `pnpm typecheck`: se quebrar, o placeholder divergiu do banco; avise a T2.

## 3. Seed de config

No shell (valores do ambiente `aprumo-dev`, painel > Settings > API; a service role é segredo):

```bash
# bash
export NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service role ou secret key>"
pnpm seed:config
```

Saída esperada: `app_config atualizada: 10 chaves (...)`. Depois `unset SUPABASE_SERVICE_ROLE_KEY`. O script lê só `content/config.json`.

## 4. Conferir no SQL Editor do painel

### 4.1 Tabelas e RLS (esperado: 22 linhas, `rowsecurity = true` em todas)

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Esperado: `ai_usage, app_config, availability_slots, competency_contents, content_edges, content_progress, content_sections, contents, essay_feedbacks, essay_submissions, essay_topics, flashcard_states, flashcards, journey_contents, journeys, profiles, question_keys, questions, quiz_attempts, schedule_sessions, trail_contents, trails`.

### 4.2 Políticas (esperado: nenhuma em `question_keys` e `app_config`)

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Esperado: catálogo só `SELECT`; `journeys`, `journey_contents`, `availability_slots`, `schedule_sessions` e `flashcard_states` com `ALL`; `essay_submissions` com `SELECT`, `INSERT` e `DELETE` (sem UPDATE); `content_progress`, `quiz_attempts`, `essay_feedbacks` e `ai_usage` só `SELECT`; `profiles` com `SELECT` e `UPDATE`.

### 4.3 `app_config` populada (esperado: 10 linhas)

```sql
select key, value from public.app_config order by key;
```

### 4.4 Trigger de profile e privilégio de coluna

```sql
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
-- esperado: on_auth_user_created

select column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated'
order by column_name, privilege_type;
-- esperado: UPDATE só em display_name (as demais colunas só SELECT)
```

### 4.5 CHECKs (rodam como `postgres` no editor, que ignora RLS mas respeita CHECK)

Pré-requisito: um tema qualquer. Crie e apague depois:

```sql
insert into public.essay_topics (slug, title, motivating_text)
values ('t2-teste', 'Tema de teste', 'Texto de teste');
```

Use `begin; ... rollback;` em cada caso, para não deixar lixo:

```sql
-- (a) esperado: ERRO, viola essay_submissions_owner_or_example (sem user_id e is_example = false)
begin;
insert into public.essay_submissions (topic_id, part, body)
select id, 'introduction', 'x' from public.essay_topics where slug = 't2-teste';
rollback;

-- (b) esperado: ERRO, viola essay_submissions_example_key_matches (is_example = true sem example_key)
begin;
insert into public.essay_submissions (topic_id, part, body, is_example)
select id, 'introduction', 'x', true from public.essay_topics where slug = 't2-teste';
rollback;

-- (c) esperado: ERRO, viola essay_submissions_example_key_matches (example_key com is_example = false)
begin;
insert into public.essay_submissions (topic_id, part, body, is_example, example_key)
select id, 'introduction', 'x', false, 'k' from public.essay_topics where slug = 't2-teste';
rollback;

-- (d) esperado: OK (linha de reserva: user_id nulo, is_example e example_key)
begin;
insert into public.essay_submissions (topic_id, part, body, is_example, example_key)
select id, 'introduction', 'x', true, 'k' from public.essay_topics where slug = 't2-teste';
rollback;
```

Limpeza: `delete from public.essay_topics where slug = 't2-teste';`

### 4.6 RLS como usuário autenticado (um caso por execução)

Cada caso é um bloco `begin; ...; rollback;` com **um** comando de teste. Rode **um bloco por vez** (selecione só o bloco e execute): um erro esperado aborta a transação e, se tudo fosse colado junto, os casos seguintes não testariam nada.

Preparação: crie 2 usuários de teste em Authentication > Users (e-mails fictícios) e anote os ids como `<U1>` e `<U2>`. Confirme os profiles: `select id, display_name, is_demo from public.profiles;`. Depois, como `postgres` no editor, crie dados do usuário 1 (ids fixos para os casos):

```sql
insert into public.essay_topics (slug, title, motivating_text) values ('t2-teste', 'Tema de teste', 'Texto de teste');
insert into public.contents (slug, title, summary, subject) values ('t2-conteudo', 'Conteúdo de teste', 'Resumo', 'Teste');
insert into public.journeys (id, user_id, base_type, goal_description, deadline)
  values ('00000000-0000-4000-8000-000000000001', '<U1>', 'contents', 'Meta de teste', '2099-12-31');
insert into public.essay_submissions (id, user_id, topic_id, part, body)
  select '00000000-0000-4000-8000-000000000002', '<U1>', id, 'introduction', 'x' from public.essay_topics where slug = 't2-teste';
insert into public.essay_feedbacks (submission_id, model_key, prompt_version, payload)
  values ('00000000-0000-4000-8000-000000000002', 'm', 'essay-feedback@v1', '{}');
-- linha de reserva (user_id nulo) com feedback
insert into public.essay_submissions (id, topic_id, part, body, is_example, example_key)
  select '00000000-0000-4000-8000-000000000003', id, 'introduction', 'x', true, 'reserva-t2' from public.essay_topics where slug = 't2-teste';
insert into public.essay_feedbacks (submission_id, model_key, prompt_version, payload)
  values ('00000000-0000-4000-8000-000000000003', 'm', 'essay-feedback@v1', '{}');
```

**Sem privilégio (esperado: ERRO `permission denied`).** Molde do bloco, com o comando de teste no meio:

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U1>';
select * from public.question_keys;
rollback;
```

Repita o molde trocando o comando de teste por cada um destes (um bloco por comando; todos devem dar ERRO `permission denied`):

```sql
select * from public.app_config;
insert into public.content_progress (user_id, content_id, status) values ('<U1>', (select id from public.contents limit 1), 'studying');
insert into public.ai_usage (user_id, feature, status) values ('<U1>', 'essay_feedback', 'succeeded');
insert into public.quiz_attempts (user_id, content_id, answers, correct, total, threshold_pct, passed) values ('<U1>', (select id from public.contents limit 1), '[]', 5, 5, 80, true);
insert into public.essay_feedbacks (submission_id, model_key, prompt_version, payload) values ('00000000-0000-4000-8000-000000000002', 'm', 'v', '{}');
delete from public.quiz_attempts;
update public.essay_feedbacks set model_key = 'x';
update public.profiles set is_demo = true where id = '<U1>';
update public.profiles set essay_daily_limit_override = 999 where id = '<U1>';
update public.essay_submissions set status = 'completed' where id = '00000000-0000-4000-8000-000000000002';
```

(o último confirma que o aluno não tem UPDATE em `essay_submissions`.)

**Permitido (esperado: sucesso):**

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U1>';
update public.profiles set display_name = 'Aluno Teste' where id = '<U1>';
rollback;
```

Esperado: `UPDATE 1`.

**(a) Usuário 2 não vê nem altera dados do usuário 1 (esperado: contagem 0, `UPDATE 0`, `DELETE 0`, sem erro).** Molde com `<U2>`:

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U2>';
select count(*) from public.journeys where id = '00000000-0000-4000-8000-000000000001';
rollback;
```

Troque o comando de teste (um bloco por comando):

```sql
select count(*) from public.essay_submissions where id = '00000000-0000-4000-8000-000000000002';
select count(*) from public.essay_feedbacks where submission_id = '00000000-0000-4000-8000-000000000002';
update public.journeys set goal_description = 'invadido' where id = '00000000-0000-4000-8000-000000000001';
delete from public.essay_submissions where id = '00000000-0000-4000-8000-000000000002';
```

**(b) Inserir na Jornada de outro usuário (esperado: ERRO `violates row-level security policy`), um bloco por caso:**

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U2>';
insert into public.journey_contents (journey_id, content_id, position, added_from)
  values ('00000000-0000-4000-8000-000000000001', (select id from public.contents limit 1), 1, 'map');
rollback;
```

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U2>';
insert into public.schedule_sessions (user_id, journey_id, content_id, starts_at, minutes)
  values ('<U2>', '00000000-0000-4000-8000-000000000001', (select id from public.contents limit 1), '2099-01-01T10:00:00Z', 30);
rollback;
```

**(c) Virar reserva (esperado: ERRO nos dois; o UPDATE dá `permission denied`, o INSERT dá RLS):**

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U1>';
update public.essay_submissions set is_example = true, example_key = 'k3' where id = '00000000-0000-4000-8000-000000000002';
rollback;
```

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U1>';
insert into public.essay_submissions (user_id, topic_id, part, body, is_example, example_key)
  values ('<U1>', (select id from public.essay_topics limit 1), 'introduction', 'x', true, 'k2');
rollback;
```

**(d) Reserva e o feedback dela invisíveis (esperado: `0` e `0`):**

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U1>';
select (select count(*) from public.essay_submissions where is_example) as reservas,
       (select count(*) from public.essay_feedbacks where submission_id = '00000000-0000-4000-8000-000000000003') as feedbacks_reserva;
rollback;
```

**(e) Privilégios de tabela (conferir contra o esperado):**

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where grantee in ('anon', 'authenticated') and table_schema = 'public'
order by grantee, table_name, privilege_type;
```

Esperado: nenhuma linha para `anon`. Para `authenticated`:
- SELECT nas 9 tabelas de catálogo (`contents`, `content_edges`, `content_sections`, `questions`, `trails`, `trail_contents`, `flashcards`, `competency_contents`, `essay_topics`);
- SELECT, INSERT, UPDATE e DELETE em `journeys`, `journey_contents`, `availability_slots`, `schedule_sessions`, `flashcard_states`;
- SELECT, INSERT e DELETE (sem UPDATE) em `essay_submissions`;
- só SELECT em `content_progress`, `quiz_attempts`, `essay_feedbacks`, `ai_usage` e `profiles` (o UPDATE de `display_name` aparece em `column_privileges`, 4.4);
- nada em `question_keys` e `app_config`.

**(f) Função do trigger não chamável (esperado: `false`):**

```sql
select has_function_privilege('authenticated', 'public.handle_new_user()', 'execute');
```

**(g) Metadata não vira is_demo.** Crie um usuário em Authentication > Users (ou por signup) com user metadata `{"is_demo": true, "display_name": "Teste"}` e confira (esperado: `is_demo = false`, `display_name = 'Teste'`):

```sql
select id, display_name, is_demo from public.profiles order by created_at desc limit 1;
```

**(h) Security Advisor** (ver 4.7): sem alerta crítico.

**Conta demo (profile protegido).** Como `postgres`: `update public.profiles set is_demo = true where id = '<U2>';`. Depois o bloco abaixo deve dar `UPDATE 0`:

```sql
begin; set local role authenticated; set local request.jwt.claim.sub = '<U2>';
update public.profiles set display_name = 'x' where id = '<U2>';
rollback;
```

Desfaça com `update public.profiles set is_demo = false where id = '<U2>';`.

**Limpeza** (como `postgres`):

```sql
delete from public.essay_submissions where id in ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003');
delete from public.journeys where id = '00000000-0000-4000-8000-000000000001';
delete from public.essay_topics where slug = 't2-teste';
delete from public.contents where slug = 't2-conteudo';
```

Os casos de "escrita negada" também devem falhar pela API REST com a chave anon e o JWT de um usuário (revisão com 2 usuários na T7).

### 4.7 Security Advisor

Painel > Advisors > Security: esperado sem alerta de tabela sem RLS. Esperado: nenhum alerta crítico. É normal aparecer o aviso informativo "RLS enabled, no policy" para `question_keys` e `app_config` (é o desenho).

## 5. Notas e riscos aceitos

- Risco aceito na fase H: visitantes logados na conta demo pública podem editar a Jornada e apagar redações dela até a reposição diária (o cron repõe). O profile da demo (`is_demo`) não aceita UPDATE pelo aluno.
- Não há índice único de Jornada ativa por usuário (decisão da faixa B/PO).
- `src/lib/supabase/types.ts` tem `Relationships: []` até rodar `pnpm db:types`.
- A T3 precisa enviar `options.data.display_name` no cadastro (o trigger lê `raw_user_meta_data.display_name`).
- `quiz_attempts.answers` deve guardar só `{questionId, optionIndex}`, nunca o gabarito.
- `essay_submissions` não tem UPDATE para o aluno: status e retornos mudam pelo servidor (service role).

## 6. Se algo falhar

Não edite a migration depois de mergeada: mudanças são em migration nova e aditiva. Antes do merge, avise a T2 com a mensagem de erro (sem chaves).
