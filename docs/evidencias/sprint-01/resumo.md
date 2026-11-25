# Sprint 01: verificação em Supabase local (verify-aprumo)

- Branch: main c41a892 (detached, worktree `escola-wt-verify`). Data: 2026-11-25.
- Subida: stack `verify-aprumo` (API :22321, db :22322; migrations + 6 conteúdos fictícios) já de pé; `pnpm build` (exit 0) e `pnpm exec next start -p 23000 -H 127.0.0.1` (a porta é respeitada com `-p`; `PORT` não foi testado). Variáveis só no shell; usuários criados na Auth local por cenário, com credenciais geradas em memória. Segredos não constam neste relatório.
- Navegador: Microsoft Edge (`E2E_BROWSER_CHANNEL=msedge`). Roteiro das provas: `verify-env/e2e/verify.mjs`. Roteiro de segurança: `docs/evidencias/faixa-c/seguranca-quiz.md` (T14).

## Placar (itens verificados)

| Passou | Falhou | Bloqueado | Não verificado | Total |
|---|---|---|---|---|
| 17 | 1 | 0 | 2 | 20 |

## Suíte e2e do projeto

| Comando | Resultado |
|---|---|
| `pnpm test:e2e e2e/smoke.spec.ts` | 2 passed |
| `pnpm test:e2e e2e/faixa-c.spec.ts` | 2 passed, 1 failed, 1 skipped (fixme da T9; não é falha) |

Falha: `4 de 5 domina...` em `e2e/faixa-c.spec.ts:105` (`getByText('Estrutura em 4 parágrafos')` não existe em `/mapa?estado=dominado`). Resposta, foco no h2 e status anunciado do mesmo teste passaram antes dessa linha.

## Itens

| # | Item | Status | Evidência (comando e saída resumida) |
|---|---|---|---|
| US-013 | 3 de 5 em conta nova: reprova, status "Você acertou 3 de 5. Veja as seções a rever." sem links, foco no h2, lista seções, não domina | passou | `node verify-env/e2e/verify.mjs`; `US-013/US-013__07-...jpg` |
| US-013 | Envio sem respostas: "Faltam 5 respostas para enviar.", foco em q0-o0 | passou | `US-013__06-...jpg` |
| US-013 | 4 de 5: status "Você acertou 4 de 5. Conteúdo dominado.", foco no h2 "Conteúdo dominado", `content_progress=mastered` | passou | `US-013__04-...jpg` |
| US-013 | Teclado: Tab entre grupos, setas/Espaço marcam, Tab+Enter no envio; foco visível (outline solid 2px) | passou | `US-013__02-...jpg`, `__03-...jpg` |
| US-013 | "Ver no Mapa" lista o conteúdo dominado | **falhou** | Defeito abaixo; `US-013__04b-mapa-dominado.jpg` |
| US-013 | Mapa: nó "aceso" (fixme T9) | não verificado | Depende da T9 (decisão do briefing) |
| US-012 | `role=status aria-live=polite` vazio antes; após Conferir (Enter) anuncia "Não foi dessa vez. A resposta é a alternativa C. ..." | passou | `US-012__03-...jpg` |
| US-012 | Teclado (setas/Espaço/Tab/Enter) e foco visível no rádio, no Conferir e no link de fonte (outline solid 2px) | passou | `US-012__02-...jpg`, `__04-...jpg` |
| US-012 | Links de fonte: 6 de 6 com http(s), `target=_blank`, `rel=noopener noreferrer` | passou | idem |
| T14-1 | Sem `correct_index`/`correctIndex`/`question_keys`/`explanation` (nome) nem as 5 explicações (valor) em 8 respostas de rede (HTML, RSC soft-nav, server actions, `RSC: 1`); enunciado presente | passou | `verify.mjs` |
| T14-2 | `GET /rest/v1/question_keys?select=*` com token do usuário | passou | HTTP 403 |
| T14-3 | POST/PATCH/DELETE em `content_progress` e `quiz_attempts` com token | passou | 6 chamadas, todas HTTP 403 (42501); estado do banco inalterado |
| T14-4 | Server action real com POST adulterado: `optionIndex` 9, questão repetida, questão inexistente, 4 de 5, índice negativo | passou | Todas `VALIDATION`; `quiz_attempts` 0 antes e 0 depois; campo extra `total`/`correct` ignorado |
| T14-5 | Chute no cliente não muda o resultado | não verificado | Só coberto por análise e teste unitário (T14); sem prova de runtime além do item 4 |
| T14-6 | Valor de `SUPABASE_SERVICE_ROLE_KEY` em `.next/static` | passou | `grep -rlF <valor> .next/static` = 0 de 27 arquivos; nome da variável 0; `question_keys`/`correct_index` 0; valor também 0 em `.next/server` |
| T14-7 | 3 de 5 depois de 4 de 5 na mesma conta não rebaixa mastered | passou | `status=mastered`, `mastered_at` inalterado, 2 tentativas (passed true, false) |
| Health | `GET /api/health` | passou | 200; campos `status,db,ai,commit` = `ok,ok,{enabled:boolean,budgetRemainingUsd:number},c41a892`. O commit veio de `VERCEL_GIT_COMMIT_SHA=c41a892`, que eu defini no shell; sem a variável o campo é `null` |
| Cron | `GET /api/cron/daily` sem segredo / segredo errado / `Bearer ` vazio | passou | 401 / 401 / 401 |
| Cron | com `Authorization: Bearer <CRON_SECRET>` | passou | 200 `{"status":"ok","keepAlive":"ok","demoReset":"skipped"}` |
| Smoke | 2 testes de `e2e/smoke.spec.ts` | passou | 2 passed |


## Defeito

- **Mapa não lista o conteúdo dominado** (severidade média): `/mapa?estado=dominado` renderiza o placeholder "Em construção" (`src/app/(app)/mapa/page.tsx:1`), mas o cartão do resultado promete "Seu nó já aparece aceso no Mapa" (`src/features/quiz/QuizForm.tsx:186`) e o spec espera o título do conteúdo (`e2e/faixa-c.spec.ts:105`). Reprodução: conta nova, 4 de 5, clicar "Ver no Mapa". Causa provável: T9 ainda não entregue. Não corrigido (fora do escopo).

## Planejados x executados

| Planejados | Executados | Não executados |
|---|---|---|
| 20 | 18 | 2 (fixme do nó aceso, T9; prova de runtime do item 5 "chute no cliente") |

## Observações

- Domínio é definitivo (RN-007): cada cenário usou conta nova; a conta de `verify-env/.local-secrets` já passou pelo spec faixa-c e está dominada.
- Contas criadas: 3 na Auth local pelo `verify.mjs` (descartáveis, ficam na stack).
- Ligação à matriz: só `passou` vira `testado` (US-012 inteira). US-013 permanece `implementado` até o Mapa (T9) listar o dominado.
