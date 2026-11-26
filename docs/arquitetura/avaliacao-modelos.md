# Avaliação de modelos de IA da redação (D-010)

Status: **preparado, ainda sem resultados reais.** A comparação só roda depois que o grupo fornecer as chaves e autorizar o gasto. Decisão final em ADR-005 (escrita pelo documentador em `docs/adr/`).

## Candidatos

Preços e IDs conferidos em página oficial pública em 2026-11-26 (registry em `src/server/ai/models.ts`). Preço muda: reconferir a fonte antes de decidir.

| modelKey | Provedor | ID da API | Entrada (US$/1 M tokens) | Saída (US$/1 M tokens) | Fonte do preço | Data |
|---|---|---|---|---|---|---|
| `anthropic-haiku-5.5` | Anthropic | `claude-haiku-5-5` | 0,10 | 0,50 | https://platform.claude.com/docs/en/about-claude/pricing | 2026-11-26 |
| `google-gemini-3.8-flash` | Google | `gemini-3.8-flash` | 0,75 | 3,75 | https://ai.google.dev/gemini-api/docs/pricing | 2026-11-26 |

Notas:
- Haiku 5.5: US$ 0,10 / 0,50 para prompts de até 100 mil tokens; acima disso, US$ 0,50 / 2,50 para a chamada inteira. `computeCostUsd` aplica a faixa longa (`longPrompt`). ID conferido em https://platform.claude.com/docs/en/about-claude/models/overview.
- Gemini 3.8 Flash: a tarifa da tabela vale até 2026-12-31; a partir de 2027-01-01 passa a US$ 1,50 (entrada) e US$ 7,50 (saída). O registry carrega as duas (`rateChanges`) e `computeCostUsd` / `estimateMaxCostUsd` aceitam uma data (padrão: agora, UTC) e escolhem a tarifa vigente. A saída inclui tokens de raciocínio, então o custo real depende do esforço de raciocínio do modelo.
- Alternativa mais barata do Google, não avaliada: `gemini-3.5-flash-lite` (US$ 0,30 entrada, US$ 2,50 saída, na mesma página).

## Protocolo

Origem: seção 5 do briefing da faixa D e plano §4.

1. Corpus: `content/essays/corpus-d010.json`, 5 partes fictícias assinadas por "Aluno Demo", sobre os 3 temas oficiais de `content/essay-topics.json`: boa, desvios de norma (C1), tangência (C2), conclusão sem proposta completa (C5) e tentativa de injeção.
2. Cada caso roda 3 vezes por modelo (30 chamadas no total), pelo mesmo adapter (`AiSdkEssayModel`) e pelo mesmo prompt (`essay-feedback@v1`).
3. Métricas automáticas: taxa de saída válida, latência p50 e p95, custo médio por retorno.
4. Métricas manuais (2 pessoas, às cegas, nota de 1 a 5): diagnóstico correto por competência, especificidade, português e **ausência de reescrita (RN-023, eliminatório)**. Marque "RN-023 violada?" em cada linha em que o retorno reescrever ou escrever trecho no lugar do aluno.
5. Decisão: elimina quem violar RN-023 depois de um ajuste de prompt ou tiver menos de 100% de saídas válidas com 1 nova tentativa. Entre os restantes, vence a maior nota de qualidade com p95 <= 20 s e custo <= US$ 0,02 por retorno; em empate, o mais barato.

## Como rodar

Nada abaixo é executado automaticamente. As chaves ficam só no ambiente do shell (nunca em arquivo versionado, nunca em log).

```
# 1. Validar corpus, prompt e config SEM chamar provedor e SEM gastar:
pnpm eval:essay --dry-run

# 2. Execução real (GASTA dinheiro; exige as duas confirmações):
AI_PROVIDER=ai-sdk EVAL_CONFIRM_SPEND=yes-eval-spend \
ANTHROPIC_API_KEY=... GOOGLE_GENERATIVE_AI_API_KEY=... \
pnpm eval:essay --confirm-spend
```

Guardas do script: sem `--confirm-spend` e `EVAL_CONFIRM_SPEND=yes-eval-spend` ele não roda; exige `AI_PROVIDER=ai-sdk` e as duas chaves; imprime a estimativa de custo máximo antes; limite duro de 30 chamadas; sem laço de repetição. Antes de rodar, confirme o limite de gasto mensal no console de cada provedor.

O script grava apenas métricas e rótulos de caso entre os marcadores abaixo: sem chave, sem resposta bruta do modelo e sem o texto completo do aluno.

## Procedimento de nota cega

Duas pessoas dão nota de 1 a 5 aos retornos dos 2 modelos sem saber qual é qual. RN-023 (sem reescrita) é eliminatório.

1. Execução real com `--save-outputs` (opcional, só junto das duas confirmações de gasto; nunca em `--dry-run`):
   ```
   AI_PROVIDER=ai-sdk EVAL_CONFIRM_SPEND=yes-eval-spend ANTHROPIC_API_KEY=... GOOGLE_GENERATIVE_AI_API_KEY=... \
   pnpm eval:essay --confirm-spend --save-outputs            # padrão: eval-output/
   ```
2. Dois diretórios irmãos, ambos git-ignorados (o script recusa gravar se `git check-ignore` disser que não, ou se o git não estiver disponível; caminhos só dentro do repositório): `eval-output/` recebe um arquivo `case-<id>-r<rodada>-<X|Y>.json` por retorno válido (só os campos do schema `EssayFeedbackAI`, mais `rn023Flags`; sem chave, sem usage, sem nome do modelo) e a planilha `notas-template.csv`; `eval-output-key/` recebe o `key.json` (semente, mapa rótulo-modelo, métricas automáticas, linhas esperadas) e, no `--fake`, o relatório. Os rótulos X e Y são sorteados por caso com uma semente local, balanceados (diferença de no máximo 1 caso) e sem relação com o nome do modelo. Com `--save-outputs <dir>`, a pasta da key é `<dir>-key`; `<dir>` só pode ter um nível (sem `/`), para a key nunca ficar dentro de uma pasta entregue. O script recusa, antes de qualquer chamada, pastas de saída que já tenham arquivos (p.ex. de um ensaio `--fake`); `--overwrite-output` apaga só `case-*.json`, `notas-template.csv`, `key.json`, `relatorio-fake.md` e `resumo-notas-fake.md`. A planilha deve ser CSV separado por vírgulas (o Excel pt-BR salva com `;` por padrão e é recusado com aviso); `--allow-partial` nunca produz recomendação.
3. **Os avaliadores recebem SÓ `eval-output/` e nunca o `eval-output-key/`.** Eles recebem também o texto fictício do caso, por id, em `content/essays/corpus-d010.json`. Cada um preenche `nota_avaliador_N` (inteiro de 1 a 5) e `violou_RN023_avaliador_N` (`sim`, `nao` ou vazio; qualquer outro valor, como um typo, é rejeitado). Quem coordena só abre `eval-output-key/` depois das duas planilhas prontas.
   - Blindagem: os arquivos são gravados numa ordem embaralhada pela semente (não agrupada por modelo) e com mtime/atime fixos, para a ordem e a data de gravação não revelarem o modelo. A data de criação (birthtime/ctime) não pode ser alterada, mas a ordem embaralhada a neutraliza. O estilo de resposta de cada modelo continua distinguível pelo conteúdo: é inerente e não dá para eliminar.
   - Em modo real os arquivos só são gravados depois de TODAS as chamadas; se o processo cair no meio, os retornos pagos se perdem (aceito, para não gravar na ordem de coleta).
4. `rn023Flags` é só ajuda, a decisão é humana. `longCopy`: 12 ou mais palavras seguidas iguais ao texto do aluno fora de `evidence` (citações literais são permitidas). `rewriteLikeLength`: um campo livre com 200 ou mais caracteres e 70% ou mais do tamanho do texto do aluno.
5. Depois das notas: `pnpm eval:essay --summarize-grades eval-output/notas-template.csv eval-output-key/key.json`. A planilha precisa ter exatamente as linhas do template (sem duplicadas, sem faltando, sem extras) e 2 notas inteiras de 1 a 5 por linha; senão o script para com erro listando o que falta, sem recomendação. `--allow-partial` aceita linhas ou notas faltando só para uma prévia, com aviso grande de RESULTADO PARCIAL no resultado (duplicadas e extras continuam erro). Imprime e grava abaixo só as agregações por modelo (nota média, retornos com RN-023 violada, p50, p95, custo, saídas válidas), sem texto nem respostas. O `key.json` é validado (campos obrigatórios) antes do uso.
6. Regra de decisão aplicada como **recomendação** (o grupo decide, ADR-005): elimina quem violou RN-023 (reavalie depois de um ajuste de prompt) ou teve menos de 100% de saídas válidas; entre os restantes, só entram p95 <= 20 s e custo médio <= US$ 0,02; vence a maior nota média; empate, o mais barato.

Ensaio sem custo: `pnpm eval:essay --fake --save-outputs` usa 2 modelos falsos (`fake-a`, `fake-b`; latência e custo sintéticos) e gera os mesmos arquivos cegos, `key.json` (marcado `fake`) e a planilha; o relatório vai para `eval-output-key/relatorio-fake.md` e o `--summarize-grades` de uma key fake (campo `fake` ou modelKeys `fake-a`/`fake-b`) grava `resumo-notas-fake.md` ao lado dela. Tudo marcado "RESULTADO FAKE — NÃO VALE PARA D-010"; este doc nunca é alterado por `--fake`, que também recusa combinar com provedor real.

Não publique nem versione os retornos brutos: o doc recebe apenas as agregações.

### Notas agregadas

<!-- EVAL-GRADES:START -->

Ainda não agregado.

<!-- EVAL-GRADES:END -->

## Limitações e requisitos para a T18

- Tamanho do texto: o limite `essay_max_chars` é requisito da rota (T18); o adapter não corta nem valida o tamanho, e o custo de entrada cresce com o texto.
- Thinking do Gemini pode consumir o teto de saída (`MAX_OUTPUT_TOKENS` = 4096) e truncar o JSON: no eval real, medir ocorrências de `finishReason=length` (vêm em `EssayModelError.finishReason`) e, se houver, ajustar o teto ou o esforço de raciocínio antes de decidir.
- `AI_TIMEOUT_MS`: inteiro de 1000 a 55000 (a rota tem maxDuration de 60 s); valor inválido ou fora da faixa gera `EssayModelError` CONFIG, sem cair em silêncio no padrão de 45000.
- Sem `AI_PROVIDER` o padrão é o Fake (respostas de exemplo); em `NODE_ENV=production` a fábrica emite um aviso único de log. Defina `AI_PROVIDER=ai-sdk` para IA real.
- Pendência da faixa A: regra de lint/boundary para importar `src/server/ai` só por `server.ts` (o eval e os testes importam os módulos direto, de propósito).
- O prompt `essay-feedback@v1` segue a Cartilha 2026: tangenciamento limita C2, C3 e C5 a 40 (p.25); fuga ao tema ou texto não dissertativo-argumentativo anula tudo (p.27 e p.40). A nota é sempre estimativa de estudo.

## Resultados

<!-- EVAL-RESULTS:START -->

Ainda não executado.

<!-- EVAL-RESULTS:END -->
