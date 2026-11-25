-- 0001: schema inicial do Aprumo (plano §2). Sem dados de seed.
-- Fora desta migration (T18): reserve_ai_usage.
-- Escritas "conquistadas" (content_progress, quiz_attempts, essay_feedbacks, ai_usage)
-- só pelo servidor, com a service role (que ignora RLS).

-- ============================================================================
-- Tabelas
-- ============================================================================

-- Perfil 1:1 com auth.users (criado pelo trigger no fim deste arquivo).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  is_demo boolean not null default false,
  essay_daily_limit_override integer check (essay_daily_limit_override is null or essay_daily_limit_override >= 0),
  created_at timestamptz not null default now()
);

-- Catálogo -------------------------------------------------------------------

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  subject text not null,
  pos_x integer not null default 0,
  pos_y integer not null default 0,
  sort integer not null default 0
);

create table public.content_edges (
  from_id uuid not null references public.contents (id) on delete cascade,
  to_id uuid not null references public.contents (id) on delete cascade,
  kind text not null check (kind in ('prerequisite', 'related')),
  primary key (from_id, to_id, kind),
  check (from_id <> to_id)
);

create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  position integer not null,
  kind text not null check (kind in ('text', 'quick_question', 'example', 'summary')),
  title text not null,
  body_md text not null,
  quick_question jsonb,
  source_citation text not null check (btrim(source_citation) <> ''),
  source_url text,
  unique (content_id, position)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  section_id uuid references public.content_sections (id) on delete set null,
  stem text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  origin text not null check (origin in ('original', 'public')),
  source_citation text not null check (btrim(source_citation) <> ''),
  unique (content_id, stem)
);

-- Gabarito privado: sem política de leitura (só a service role acessa).
create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_index integer not null check (correct_index >= 0),
  explanation text not null
);

create table public.trails (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  objective text not null,
  origin text not null default 'platform' check (origin = 'platform'),
  color text
);

create table public.trail_contents (
  trail_id uuid not null references public.trails (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  position integer not null,
  primary key (trail_id, content_id)
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  front text not null,
  back text not null,
  unique (content_id, front)
);

create table public.competency_contents (
  competency integer not null check (competency between 1 and 5),
  content_id uuid not null references public.contents (id) on delete cascade,
  position integer not null default 0,
  primary key (competency, content_id)
);

create table public.essay_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  motivating_text text not null,
  source_citation text
);

-- Do aluno -------------------------------------------------------------------

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  base_type text not null check (base_type in ('trail', 'contents')),
  trail_id uuid references public.trails (id) on delete set null,
  goal_type text not null default 'master_contents' check (goal_type = 'master_contents'),
  goal_description text not null check (char_length(goal_description) between 3 and 200),
  deadline date not null,
  methodology text not null default 'none' check (methodology = 'none'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table public.journey_contents (
  journey_id uuid not null references public.journeys (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  position integer not null,
  added_from text not null check (added_from in ('base', 'map', 'essay_suggestion')),
  primary key (journey_id, content_id)
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  minutes integer not null check (minutes between 15 and 240)
);

create table public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  starts_at timestamptz not null,
  minutes integer not null check (minutes > 0),
  status text not null default 'planned' check (status in ('planned', 'done'))
);

create table public.flashcard_states (
  user_id uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  last_rating integer not null check (last_rating between 1 and 4),
  due_on date not null,
  reviewed_at timestamptz,
  primary key (user_id, flashcard_id)
);

create table public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  -- NULL só em linha de reserva (is_example); ver os CHECKs abaixo.
  user_id uuid references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.essay_topics (id) on delete cascade,
  part text not null check (part in ('introduction', 'development', 'conclusion')),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  is_example boolean not null default false,
  -- Chave de idempotência do seed das reservas. SEM índice único em (user_id, topic_id, part):
  -- o aluno pode reenviar a mesma parte do mesmo tema.
  example_key text unique,
  created_at timestamptz not null default now(),
  constraint essay_submissions_owner_or_example check (user_id is not null or is_example),
  constraint essay_submissions_example_key_matches check (is_example = (example_key is not null))
);

-- Conquistado ou contábil (escrita só pelo servidor) -------------------------

create table public.content_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  status text not null check (status in ('studying', 'mastered')),
  mastered_at timestamptz,
  primary key (user_id, content_id),
  check (status <> 'mastered' or mastered_at is not null)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  answers jsonb not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0),
  threshold_pct integer not null check (threshold_pct between 0 and 100),
  passed boolean not null,
  created_at timestamptz not null default now(),
  check (correct <= total)
);

create table public.essay_feedbacks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.essay_submissions (id) on delete cascade,
  model_key text not null,
  prompt_version text not null,
  payload jsonb not null,
  total_estimate integer,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null check (feature = 'essay_feedback'),
  status text not null check (status in ('reserved', 'succeeded', 'failed')),
  usage_date date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  model_key text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  -- A reserva 'reserved' com menos de 3 min conta no limite (reserve_ai_usage, T18).
  created_at timestamptz not null default now(),
  -- O gasto permanece e continua contando no teto e no limite diário mesmo sem a redação.
  submission_id uuid references public.essay_submissions (id) on delete set null
);

-- Configuração (sem política: só o servidor lê) ------------------------------

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Índices (PKs e UNIQUEs já criam os seus)
-- ============================================================================

create index content_edges_to_id_idx on public.content_edges (to_id);
create index questions_content_id_idx on public.questions (content_id);
create index questions_section_id_idx on public.questions (section_id);
create index trail_contents_content_id_idx on public.trail_contents (content_id);
create index competency_contents_content_id_idx on public.competency_contents (content_id);
create index journeys_user_status_idx on public.journeys (user_id, status);
create index journeys_trail_id_idx on public.journeys (trail_id);
create index journey_contents_content_id_idx on public.journey_contents (content_id);
create index content_progress_content_id_idx on public.content_progress (content_id);
create index quiz_attempts_user_content_idx on public.quiz_attempts (user_id, content_id);
create index quiz_attempts_content_id_idx on public.quiz_attempts (content_id);
create index availability_slots_user_id_idx on public.availability_slots (user_id);
create index schedule_sessions_user_starts_idx on public.schedule_sessions (user_id, starts_at);
create index schedule_sessions_journey_id_idx on public.schedule_sessions (journey_id);
create index schedule_sessions_content_id_idx on public.schedule_sessions (content_id);
create index flashcard_states_user_due_idx on public.flashcard_states (user_id, due_on);
create index flashcard_states_flashcard_id_idx on public.flashcard_states (flashcard_id);
create index essay_submissions_user_topic_part_idx on public.essay_submissions (user_id, topic_id, part);
create index essay_submissions_topic_id_idx on public.essay_submissions (topic_id);
create index ai_usage_user_date_idx on public.ai_usage (user_id, usage_date);
create index ai_usage_date_idx on public.ai_usage (usage_date);
create index ai_usage_submission_id_idx on public.ai_usage (submission_id);

-- ============================================================================
-- Funções e triggers
-- ============================================================================

-- Mantém app_config.updated_at quando o valor muda pelo painel.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();

-- Cria o profile ao inserir em auth.users. Só display_name vem dos metadados do
-- cadastro; is_demo e o limite nunca vêm de dado controlado pelo usuário.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Função SECURITY DEFINER não deve ser chamável pela API (rpc).
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Privilégios (defesa em profundidade, além da RLS)
-- ============================================================================

revoke all on
  public.profiles, public.contents, public.content_edges, public.content_sections,
  public.questions, public.question_keys, public.trails, public.trail_contents,
  public.flashcards, public.competency_contents, public.essay_topics,
  public.journeys, public.journey_contents, public.availability_slots,
  public.schedule_sessions, public.flashcard_states, public.essay_submissions,
  public.content_progress, public.quiz_attempts, public.essay_feedbacks,
  public.ai_usage, public.app_config
  from anon, authenticated;

-- Catálogo: só leitura.
grant select on
  public.contents, public.content_edges, public.content_sections, public.questions,
  public.trails, public.trail_contents, public.flashcards, public.competency_contents,
  public.essay_topics
  to authenticated;

-- Tabelas do aluno: CRUD (a RLS restringe às linhas do próprio usuário).
grant select, insert, update, delete on
  public.journeys, public.journey_contents, public.availability_slots,
  public.schedule_sessions, public.flashcard_states
  to authenticated;

-- essay_submissions: SELECT, INSERT e DELETE do próprio; SEM UPDATE (o servidor atualiza
-- status e retornos com a service role).
grant select, insert, delete on public.essay_submissions to authenticated;

-- RISCO ACEITO (fase H): visitantes logados na conta demo pública podem editar a Jornada
-- e apagar redações dela até a reposição diária (cron). O profile da demo é protegido abaixo.

-- Conquistado ou contábil: só leitura do próprio.
grant select on
  public.content_progress, public.quiz_attempts, public.essay_feedbacks, public.ai_usage
  to authenticated;

-- profiles: leitura do próprio; UPDATE só na coluna display_name.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- question_keys e app_config: nenhum privilégio para anon/authenticated.

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.content_edges enable row level security;
alter table public.content_sections enable row level security;
alter table public.questions enable row level security;
alter table public.question_keys enable row level security;
alter table public.trails enable row level security;
alter table public.trail_contents enable row level security;
alter table public.flashcards enable row level security;
alter table public.competency_contents enable row level security;
alter table public.essay_topics enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_contents enable row level security;
alter table public.availability_slots enable row level security;
alter table public.schedule_sessions enable row level security;
alter table public.flashcard_states enable row level security;
alter table public.essay_submissions enable row level security;
alter table public.content_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.essay_feedbacks enable row level security;
alter table public.ai_usage enable row level security;
alter table public.app_config enable row level security;
-- question_keys e app_config: RLS ligada e NENHUMA política (negado a todos, exceto service role).

-- profiles: SELECT e UPDATE do próprio (o UPDATE fica restrito a display_name pelo privilégio de coluna).
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- `not is_demo`: a conta demo pública não tem o nome alterado por visitantes.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and not is_demo)
  with check (id = (select auth.uid()) and not is_demo);

-- Catálogo: SELECT para authenticated.
create policy contents_select on public.contents for select to authenticated using (true);
create policy content_edges_select on public.content_edges for select to authenticated using (true);
create policy content_sections_select on public.content_sections for select to authenticated using (true);
create policy questions_select on public.questions for select to authenticated using (true);
create policy trails_select on public.trails for select to authenticated using (true);
create policy trail_contents_select on public.trail_contents for select to authenticated using (true);
create policy flashcards_select on public.flashcards for select to authenticated using (true);
create policy competency_contents_select on public.competency_contents for select to authenticated using (true);
create policy essay_topics_select on public.essay_topics for select to authenticated using (true);

-- Tabelas do aluno: CRUD onde user_id = auth.uid().
create policy journeys_own on public.journeys
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- journey_contents: a checagem é feita via journeys.
create policy journey_contents_own on public.journey_contents
  for all to authenticated
  using (exists (
    select 1 from public.journeys j
    where j.id = journey_contents.journey_id and j.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.journeys j
    where j.id = journey_contents.journey_id and j.user_id = (select auth.uid())
  ));

create policy availability_slots_own on public.availability_slots
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- schedule_sessions: além do dono da linha, a Jornada referenciada também precisa ser do usuário.
create policy schedule_sessions_own on public.schedule_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.journeys j
      where j.id = schedule_sessions.journey_id and j.user_id = (select auth.uid())
    )
  );

create policy flashcard_states_own on public.flashcard_states
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- essay_submissions: o aluno nunca cria nem vira linha de reserva (is_example); essas são só do servidor.
-- Sem política de UPDATE (nem privilégio): status e retornos mudam só pelo servidor.
create policy essay_submissions_select_own on public.essay_submissions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy essay_submissions_insert_own on public.essay_submissions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and not is_example);

create policy essay_submissions_delete_own on public.essay_submissions
  for delete to authenticated
  using (user_id = (select auth.uid()) and not is_example);

-- Conquistado ou contábil: só SELECT do próprio.
create policy content_progress_select_own on public.content_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_attempts_select_own on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

-- essay_feedbacks: não tem user_id; o dono vem da submissão.
create policy essay_feedbacks_select_own on public.essay_feedbacks
  for select to authenticated
  using (exists (
    select 1 from public.essay_submissions s
    where s.id = essay_feedbacks.submission_id and s.user_id = (select auth.uid())
  ));
