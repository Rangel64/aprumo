-- 0002 (T4, KAN-35): reposição atômica das redações da conta demo. Migration ADITIVA.
-- O supabase-js não abre transação; esta função (uma transação implícita) apaga TODAS as
-- redações da conta demo (as 2 do estado-base e as de visitantes) e insere de novo as do
-- estado-base com seus retornos. Sem ON CONFLICT em (user_id, topic_id, part): não existe
-- índice único global. NÃO toca em ai_usage (submission_id é ON DELETE SET NULL: o gasto fica).
--
-- p_essays: array jsonb; cada item: { topic_slug, part, body, model_key, prompt_version,
-- total_estimate (int ou null), payload (objeto do retorno) }.
-- Só a service role executa; recusa qualquer usuário que não seja a conta demo.

create function public.demo_replace_essays(p_user_id uuid, p_essays jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  v_topic_id uuid;
  v_submission_id uuid;
  v_count integer := 0;
begin
  if p_essays is null or jsonb_typeof(p_essays) <> 'array' then
    raise exception 'p_essays deve ser um array jsonb';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id and is_demo) then
    raise exception 'usuário não é a conta demo';
  end if;

  -- essay_feedbacks sai em cascata; ai_usage.submission_id vira NULL.
  delete from public.essay_submissions where user_id = p_user_id;

  for item in select value from jsonb_array_elements(p_essays) loop
    select id into v_topic_id from public.essay_topics where slug = item ->> 'topic_slug';
    if v_topic_id is null then
      raise exception 'tema inexistente para a redação da demo';
    end if;

    insert into public.essay_submissions (user_id, topic_id, part, body, status, is_example)
    values (p_user_id, v_topic_id, item ->> 'part', item ->> 'body', 'completed', false)
    returning id into v_submission_id;

    insert into public.essay_feedbacks (submission_id, model_key, prompt_version, payload, total_estimate)
    values (
      v_submission_id,
      item ->> 'model_key',
      item ->> 'prompt_version',
      item -> 'payload',
      nullif(item ->> 'total_estimate', '')::integer
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Fora da API pública: só a service role chama.
revoke all on function public.demo_replace_essays(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.demo_replace_essays(uuid, jsonb) to service_role;
