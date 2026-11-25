# Verificação T9 (Mapa, drawer, filtro, Trilha), modo Supabase local

- Branch: faixa-b/KAN-40-mapa (mudanças não commitadas). Data: 2026-11-25.
- Ambiente: stack `verify-aprumo` (Supabase local, API 22321), 6 conteúdos fictícios; app via `next build` + `next start -p 23000 -H 127.0.0.1` (build com variáveis da stack local só no shell). Usuário de teste novo (conta limpa), credenciais só em arquivo ignorado.
- Navegador: msedge. Evidências: `docs/evidencias/faixa-b/`.

## Placar
| Passou | Falhou | Bloqueado | Não verificado |
|---|---|---|---|
| 12 | 2 (3 defeitos: F1, F2; O1 é observação) | 0 | 1 (related) + estados estudando/bloqueado |

## Itens
| # | Item | Status | Comando / saída resumida |
|---|---|---|---|
| 1a | `pnpm test:e2e e2e/smoke.spec.ts e2e/faixa-b.spec.ts e2e/faixa-c.spec.ts` | falhou (9 passou, 2 falhou) | ver F1 e F2 |
| 1b | smoke (2), faixa-c: 3/5, resposta faltando, 4/5 domina | passou | |
| 2 | Mapa: 6 nós, 6 arestas prerequisite cheias | passou | |
| 2 | Aresta related tracejada | não verificado | seed tem 0 relações related; só o teste unitário cobre |
| 2 | Nó dominado com check e rótulo "dominado" | passou | nome "Estrutura em 4 parágrafos, dominado" |
| 2 | Filtros dominado=1, nao-iniciado=5, todos=6, inválido (xyz)=todos com aria-current | passou | |
| 2 | Estado vazio (estudando) com mensagem e "Limpar filtros" -> /mapa | passou | |
| 2 | Teclado: Tab chega aos nós, Enter abre; dialog; foco entra; Tab circula (12 Tabs, sempre dentro); Esc fecha; foco volta ao nó; links Estudar/Adicionar corretos | passou | |
| 2 | Clique de MOUSE em um nó abre o drawer | falhou | ver F1 |
| 2 | Trilha: cartão -> /trilhas/enem-redacao, nome, objetivo, "6 conteúdos", "Origem: plataforma"; sem "criar trilha" | passou | |
| 2 | /trilhas/inexistente mostra "Trilha não encontrada" | passou | HTTP 200 (ver observação O1) |
| 3 | Celular 375x812 sem rolagem horizontal (scrollWidth 375 = innerWidth 375), com e sem drawer | passou | |
| 3 | Screenshots desktop/celular + lado a lado com Figma | passou | `mapa-lado-a-lado.png` |
| 4 | Token do usuário: POST/PATCH/DELETE em content_progress = 403; abrir o Mapa não cria linha (3 antes, 3 depois); 0 escritas REST do navegador | passou | |
| 5 | /conteudos/<slug> e /mini-simulado (5 questões) | passou | HTTP 200 |

## Defeitos
- F1 (media): clique de mouse não abre o drawer. O React Flow põe `pointer-events: none` nos nós quando `nodesDraggable`, `elementsSelectable` e `onNodeClick` estão ausentes; o botão herda e o `.react-flow__pane` recebe o clique. Reproduz: abrir /mapa, clicar em qualquer nó (também `locator.click()` do Playwright: "react-flow__pane intercepts pointer events"). Só teclado funciona. Local: `src/features/map/MapCanvas.tsx:106-110` (props) e `:40` (botão; faltaria `pointer-events-auto`). Faz falhar `e2e/faixa-b.spec.ts:82`.
- F2 (baixa, spec ou componente): `e2e/faixa-c.spec.ts:121` espera o nome acessível `^<título>, dominado`, mas o real é "<título> , dominado" (com espaço antes da vírgula), porque o `<span className="sr-only">` do `MapNode` (`src/components/ui/MapNode.tsx:64-66`) é posicionado de forma absoluta e o navegador separa os textos. O nó está de fato dominado (provado em 2); o spec `faixa-b.spec.ts` usa `/, dominado/` e passa. Corrigir o regex (`\s*,\s*dominado`) ou o span.
- O1 (observação): /trilhas/inexistente responde HTTP 200 com a tela not-found (o `loading.tsx` já enviou o status); /conteudos/inexistente-xyz se comporta igual, então segue o padrão do repositório.

## Diferenças visíveis em relação ao Figma (04-mapa)
Sem busca "Buscar um conteúdo"; sem chips de área (Todas as áreas, Matemática...) e sem seletor "Todos": no real há pílulas de estado; sem zonas coloridas por área/rótulos de área nem fundo pontilhado; cartão da Trilha fica acima do canvas (no Figma flutua dentro do mapa, no canto, com ícone de compartilhar); sem breadcrumb "Início > Mapa"; botão "Criar Jornada" sem o "+"; nós do real só têm estados não iniciado/dominado no seed (Figma mostra em estudo com ponto, bloqueado com cadeado, nós coloridos por área); arestas curvas sem os pontos de cor; navegação lateral no desktop (Figma mostra barra inferior); controles de zoom no canto inferior esquerdo (Figma: superior direito) e marca "React Flow" visível.

## Não verificado
Arestas related (seed sem relações); estados "estudando" e "bloqueado" com nós visíveis (conta sem esse progresso).

## Rodada 2 (reverificação após as correções F1 e F2), 2026-11-25
- Mesmo ambiente (stack `verify-aprumo`, `next build` novo + `next start -p 23000 -H 127.0.0.1`, msedge, conta de teste existente).

### Placar
| Passou | Falhou | Bloqueado | Não verificado |
|---|---|---|---|
| 17 de 17 verificações práticas + 11 de 11 testes E2E | 0 | 0 | related; estados estudando/bloqueado (igual à rodada 1) |

### Itens
| # | Item | Status | Comando / saída resumida |
|---|---|---|---|
| 1 | `pnpm test:e2e e2e/smoke.spec.ts e2e/faixa-b.spec.ts e2e/faixa-c.spec.ts` | passou | 11 passed (10.2s), incluindo clique de mouse no drawer (faixa-b:75) e nó aceso (faixa-c) |
| 2 | Clique de mouse num nó abre o drawer (F1) | passou | |
| 2 | Enter e Espaço no nó abrem o drawer | passou | |
| 2 | Esc fecha e o foco volta ao mesmo nó (mouse, Enter, Espaço) | passou | |
| 2 | Sem arrasto de nós (posição igual após arrastar 120x80) | passou | |
| 2 | Zoom: aproximar, afastar e ajustar à tela funcionam; clique segue abrindo o drawer depois | passou | |
| 2 | Clique no pane vazio (desktop) e toque no pane vazio (celular) não abrem drawer | passou | |
| 3 | Celular 375x812: scrollWidth<=innerWidth sem drawer e com drawer (toque no nó abre) | passou | |
| 4 | F2 (nome acessível do nó dominado) | passou | faixa-c "nó aceso" verde |

### Defeitos
Nenhum novo. F1 e F2 fechados. O1 segue como observação.

### Visual
`mapa-lado-a-lado.png` não regenerado: a correção não muda o visual (só pointer-events e foco).
