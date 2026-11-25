# Segurança do mini-simulado (T14, KAN-45)

Roteiro de `docs/backlog/sprints/tarefas-sprint-01.md` (T14). Estado por item: **verificado por análise de código/RLS/testes** ou **não verificável** (exige banco ou runtime reais, que esta execução não tinha). Nenhum item abaixo foi exercitado contra um Supabase real.

| # | Item | Estado | Evidência |
|---|------|--------|-----------|
| 1 | Página, payload RSC e Network sem `correct_index` | Parcial: código verificado; payload/Network não verificável | `getQuizView` (`src/server/queries/quiz.ts`) seleciona só `id, stem, options` de `questions` e monta o `QuizView` (sem campo de gabarito). `correct_index` só existe em `question_keys`, lido apenas em `src/server/actions/quiz.ts` e nunca devolvido (teste "não vaza gabarito nem explicação"). `grep` de `correct_index` e `question_keys` em `.next/static` após o build: nada. Inspeção do payload RSC e do Network no navegador: não verificável (sem banco/sessão; faz parte do e2e/runtime). |
| 2 | `select` em `question_keys` via REST com token do usuário negado | Verificado por análise de RLS; chamada REST real não verificável | Migração `20261124230000_0001_schema.sql`: `revoke all ... from anon, authenticated` inclui `question_keys`, nenhum `grant` posterior, RLS ligada e sem política. Teste real contra o REST: não verificável (sem projeto Supabase). |
| 3 | `insert`/`update` em `content_progress` e `quiz_attempts` via REST negado | Verificado por análise de RLS; chamada REST real não verificável | Mesma migração: `grant select` apenas (sem insert/update/delete) para `authenticated` nas duas tabelas; só há política de select do próprio. Escrita só pela service role em `submitQuizAttempt`. Chamada REST real: não verificável. |
| 4 | `answers` forjadas rejeitadas (outro conteúdo, repetida, índice fora da faixa) | Verificado (testes unitários com mocks) | `src/server/actions/__tests__/quiz.test.ts`: questão de outro conteúdo, repetida, `optionIndex` 3 em 3 opções, índice negativo, questão faltando e lista vazia retornam `VALIDATION` sem gravar `quiz_attempts` nem `content_progress`. O conjunto aceito é exatamente as N primeiras questões do conteúdo (N de `app_config`). Contra banco real: não verificável. |
| 5 | Chute no cliente não muda o resultado | Verificado por análise e teste | Correção só em `submitQuizAttempt` (servidor), com gabarito de `question_keys` via service role. O cliente só envia `questionId` e `optionIndex`; `total` e limiar vêm do banco/`app_config` (teste "o total vem do banco/config, não do cliente": campo `total` forjado é ignorado). O cliente não recebe o gabarito, então não há o que "chutar" localmente. |
| 6 | `SUPABASE_SERVICE_ROLE_KEY` fora de `.next/static` | Verificado | A prova correta é o build com um VALOR sentinela em `SUPABASE_SERVICE_ROLE_KEY` e a busca desse VALOR (não só do nome) em `.next/static`. Executado: sentinela inventado, definido só no shell, build com variáveis públicas de placeholder (exit 0); `grep -rl -F <valor> .next/static`: 0 arquivos; o nome da variável também não aparece em `.next/static` (0). Em `.next/server` o valor também não aparece (0), esperado, pois é lido em runtime. `admin.ts` e `config.ts` importam `server-only` e a variável não tem prefixo `NEXT_PUBLIC_`. |
| 7 | Reprovação posterior não rebaixa `mastered` | Verificado (testes unitários); banco real não verificável | Testes: "reprovação posterior NÃO rebaixa mastered nem mexe no mastered_at" e "nova aprovação mantém o mastered_at original". A reprovação não escreve em `content_progress`; a aprovação lê o progresso antes: se já `mastered`, não escreve; senão faz UM único upsert (`user_id,content_id`) para `mastered` com `mastered_at` novo (cobre `studying` e linha ausente). |

## Observações

- `questions` não tem coluna de ordem: a ordem do simulado é por `id`, limitada a `quiz_question_count`. Se um conteúdo tiver mais questões que o limite, só as N primeiras entram (view e correção usam a mesma regra).
- `QuizResult.mastered` reflete o estado final (aprovado agora OU já dominado antes); `passed` é só o resultado da tentativa.
- Contagem exata: o conteúdo precisa ter exatamente `quiz_question_count` questões (hoje 5); menos ou mais vira NOT_FOUND em `getQuizView` e na action.
- Se o upsert de promoção falhar depois de gravar `quiz_attempts`, a resposta é erro genérico e a próxima aprovação converge.
- Pendente para a revisão sensível: roteiro 1 a 3 com um projeto Supabase real (`aprumo-dev`) e `/security-review`.

## Risco aberto: força bruta no gabarito (decisão do PO)

Sem limite de tentativas, ~15 chamadas de `submitQuizAttempt` bastam para deduzir o gabarito (o resultado devolve acertos e seções a rever). Proposta: chave `app_config.quiz_max_attempts_per_day` (limite por usuário e conteúdo) + pausa mínima entre tentativas, contando `quiz_attempts` do usuário; exige migration aditiva de índice em `quiz_attempts (user_id, content_id, created_at)`. Não implementado; aguarda decisão do PO.
