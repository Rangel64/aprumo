# Conteúdos da trilha "ENEM: Redação" e fontes sugeridas

Lista dos 18 conteúdos (plano §5), com slug, competência do ENEM, pré-requisitos propostos e fontes sugeridas. Autoria: faixa C (T12, KAN-43).

**Aviso sobre as fontes.** As fontes abaixo foram indicadas pelo título e pelo autor ou órgão, sem abrir os documentos. Em todas, **edição e página: a conferir ao abrir o documento**. Quem escrever o conteúdo (T13, T15) confere a edição e a página e só então preenche `sourceCitation` de cada seção e questão. Não há citação literal, número de página, edição ou URL aqui, de propósito.

## Fontes aceitas (siglas usadas na tabela)

| Sigla | Fonte |
|---|---|
| CART | "A redação no ENEM: Cartilha do Participante" (INEP) |
| MATRIZ | Matriz de Referência do ENEM (INEP) |
| BNCC | Base Nacional Comum Curricular (MEC) |
| MANUAL | Manual de Redação da Presidência da República (3ª ed.) |
| BECHARA | Gramática de referência: Evanildo Bechara |
| CUNHA | Gramática de referência: Celso Cunha e Lindley Cintra |

## Tabela dos 18 conteúdos

Os pré-requisitos formam um grafo sem ciclo (cada pré-requisito tem número menor que o conteúdo, e o validador confere). Competências: C1 norma culta, C2 compreensão do tema e repertório, C3 argumentação, C4 coesão, C5 proposta de intervenção.

| # | Slug | Título | Comp. | Pré-requisitos (slugs) | Fontes sugeridas |
|---|---|---|---|---|---|
| 1 | `tipologia-dissertativo-argumentativo` | Tipologia e gêneros: o texto dissertativo-argumentativo | C2 | nenhum | CART, MATRIZ, BNCC |
| 2 | `leitura-da-proposta-e-recorte-tematico` | Leitura da proposta e recorte temático (fuga e tangenciamento) | C2 | `tipologia-dissertativo-argumentativo` | CART, MATRIZ |
| 3 | `estrutura-em-4-paragrafos` | Estrutura em 4 parágrafos | C2 | `tipologia-dissertativo-argumentativo` | CART, BNCC |
| 4 | `repertorio-sociocultural` | Repertório sociocultural legitimado e produtivo | C2, C3 | `leitura-da-proposta-e-recorte-tematico` | CART, MATRIZ |
| 5 | `introducao-contextualizacao-e-tese` | Introdução: contextualização e tese | C2, C3 | `estrutura-em-4-paragrafos`, `repertorio-sociocultural` | CART |
| 6 | `tese-e-projeto-de-texto` | Tese e projeto de texto | C3 | `introducao-contextualizacao-e-tese` | CART, MATRIZ |
| 7 | `tipos-de-argumento` | Tipos de argumento (autoridade, dados, exemplificação, causa e consequência) | C3 | `repertorio-sociocultural`, `tese-e-projeto-de-texto` | CART |
| 8 | `desenvolvimento-topico-frasal` | Desenvolvimento: tópico frasal e aprofundamento | C3 | `estrutura-em-4-paragrafos`, `tipos-de-argumento` | CART, BECHARA |
| 9 | `paragrafacao` | Paragrafação | C4 | `estrutura-em-4-paragrafos` | CART, MANUAL |
| 10 | `coesao-referencial` | Coesão referencial (pronomes, sinônimos, elipse) | C4 | `paragrafacao` | CART, BECHARA, CUNHA |
| 11 | `conectivos-e-coesao-sequencial` | Conectivos e coesão sequencial | C4 | `paragrafacao` | CART, BECHARA, CUNHA |
| 12 | `concordancia-verbal-e-nominal` | Concordância verbal e nominal | C1 | `tipologia-dissertativo-argumentativo` | BECHARA, CUNHA, MANUAL |
| 13 | `regencia-e-crase` | Regência e crase | C1 | `concordancia-verbal-e-nominal` | BECHARA, CUNHA, MANUAL |
| 14 | `pontuacao-virgula` | Pontuação: vírgula | C1 | `concordancia-verbal-e-nominal` | BECHARA, CUNHA, MANUAL |
| 15 | `registro-formal-e-oralidade` | Registro formal e desvios de oralidade | C1 | `tipologia-dissertativo-argumentativo` | CART, BNCC, MANUAL |
| 16 | `proposta-de-intervencao-5-elementos` | Proposta de intervenção: os 5 elementos | C5 | `desenvolvimento-topico-frasal` | CART, MATRIZ |
| 17 | `direitos-humanos-na-proposta` | Direitos humanos na proposta | C5 | `proposta-de-intervencao-5-elementos` | CART, MATRIZ |
| 18 | `conclusao-retomada-e-proposta` | Conclusão: retomada e proposta | C5 | `proposta-de-intervencao-5-elementos`, `direitos-humanos-na-proposta` | CART |

Observações:

- Os slugs dos conteúdos 1, 3 e 6 coincidem com as fixtures de `src/contracts/fixtures.ts` (`estrutura-em-4-paragrafos`, `tese-e-projeto-de-texto`, `tipologia-dissertativo-argumentativo`).
- A ordem da tabela é a ordem de `content/trail.json` e é uma ordenação topológica válida do grafo.
- Questões: 5 por conteúdo, originais do time (`origin: "original"`), com `sourceCitation` apontando a fonte consultada (RF-062). Flashcards: 3 por conteúdo.
- Quando uma competência ou fonte da tabela não puder ser confirmada no documento aberto, ajustar aqui e em `content/competency-map.json` no mesmo PR.
- Pendente de conferência humana: abrir cada fonte, anotar edição e página, e só então citar em `sourceCitation`. Para os conteúdos 7 a 12, ver a seção "Revisão de fontes (lote 1)" abaixo.

## Revisão de fontes (lote 1)

Data: 2026-11-25. Escopo: conteúdos 7 a 12 (T15, KAN-46). Os conteúdos 1 a 6 e 13 a 18 não mudam nesta seção. Legenda: CONFERIDA, A CONFERIR, A DEFINIR.

**Cartilha (CART): CONFERIDA.** Citada nos JSON como "INEP. A Redação do Enem 2026: Cartilha do(a) Participante. Brasília: Inep/MEC, 2026", com página impressa e URL oficial (`https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/cartilha_enem_2026.pdf`). Conferida por leitura do PDF em 2026-11-25 (página impressa = página do PDF menos 2).

**Gramáticas e Manual (BECHARA, CUNHA, MANUAL): A CONFERIR.** Citados só por obra e tema, sem página (decisão do PO: "capítulo sem página"), com a marcação "capítulo e página a conferir" nos JSON. Conferir com o exemplar físico.

| # | Conteúdo | CART (páginas impressas citadas) | BECHARA / CUNHA / MANUAL | Observações |
|---|---|---|---|---|
| 7 | `tipos-de-argumento` | CONFERIDA: p. 28 a 32 e 40 | Não citados | A Cartilha não traz classificação nominal de tipos de argumento. As cinco famílias são sistematização didática da plataforma (conferir com professor). |
| 8 | `desenvolvimento-topico-frasal` | CONFERIDA: p. 28 a 30, 32 e 43 | BECHARA previsto na tabela, mas não citado nos JSON | "Tópico frasal" não consta na Cartilha; fonte do termo A DEFINIR. A Cartilha cobre só ideia principal e ideias secundárias do parágrafo (p. 32). O plano previa Bechara, mas o termo vem de manuais de redação. O roteiro em quatro passos e o de fechamento são sugestão didática da plataforma. |
| 9 | `paragrafacao` | CONFERIDA: p. 31 a 33, 40 e 43 | MANUAL previsto na tabela, mas não citado nos JSON | Sem pendência de fonte além do MANUAL previsto. A p. 43 é comentário de redação-modelo, não regra: a questão Q5 cita só a p. 40. |
| 10 | `coesao-referencial` | CONFERIDA: p. 33 e 34 | A CONFERIR: BECHARA e CUNHA; CINTRA (tema: pronomes e retomada), na ambiguidade do pronome | A Cartilha não trata a ambiguidade do pronome. |
| 11 | `conectivos-e-coesao-sequencial` | CONFERIDA: p. 31 a 34 | A CONFERIR: BECHARA e CUNHA; CINTRA (conjunções e orações coordenadas e subordinadas) | Lista ampliada de conectivos e relações vêm da gramática, não da Cartilha. |
| 12 | `concordancia-verbal-e-nominal` | CONFERIDA: p. 13 e 14 (desvios gramaticais, níveis da Competência I) | A CONFERIR: BECHARA e CUNHA; CINTRA (concordância verbal e nominal) | As regras de concordância não constam na Cartilha, só o critério de avaliação. MANUAL previsto na tabela, mas não citado nos JSON. |

Pendências para conferência humana:

- Abrir BECHARA, CUNHA e CINTRA e o MANUAL no exemplar físico e anotar edição, capítulo e página nas citações dos conteúdos 10, 11 e 12.
- Definir a fonte do termo "tópico frasal" (conteúdo 8) e preencher a citação; decidir se BECHARA e MANUAL, previstos na tabela para os conteúdos 8, 9 e 12, entram ou saem da coluna "Fontes sugeridas".
- Validar com professor a sistematização em cinco famílias de argumento (conteúdo 7).

## Revisão de fontes (lote 2)

Data: 2026-11-25. Escopo: conteúdos 13 a 18 (T15, KAN-46). Os conteúdos 1 a 12 não mudam nesta seção. Legenda: CONFERIDA, A CONFERIR, A DEFINIR.

**Cartilha (CART): CONFERIDA.** Mesma citação e URL oficial do lote 1; páginas conferidas por leitura do PDF em 2026-11-25 (página impressa = página do PDF menos 2).

**Gramáticas (BECHARA, CUNHA): A CONFERIR.** Citadas só por obra e tema, sem página, com a marcação "capítulo e página a conferir" nos JSON. Conferir com o exemplar físico.

| # | Conteúdo | CART (páginas impressas citadas) | BECHARA / CUNHA | Observações |
|---|---|---|---|---|
| 13 | `regencia-e-crase` | CONFERIDA: p. 13, 14 e 40 | A CONFERIR: BECHARA e CUNHA; CINTRA (regência verbal e nominal; crase) | A Cartilha só nomeia regência e crase como desvios da Competência I (p. 13) e recomenda atenção a eles na leitura guiada (p. 40). As regras de regência e de crase não constam nela. Nos níveis (p. 14) ela usa "poucos, alguns, muitos" e "reincidência". Casos de uso controverso (por exemplo, "assistir" no sentido de ver) ficaram fora do conteúdo: o item de regência "assistir" não entrou por não ser consenso, e "assistiram à uma palestra" (Q2 de regência) é usado só pela crase antes de "uma". |
| 14 | `pontuacao-virgula` | CONFERIDA: p. 13, 14, 40 e 61 | A CONFERIR: BECHARA e CUNHA; CINTRA (pontuação, emprego da vírgula; aposto; orações adjetivas) | A Cartilha não traz regras da vírgula: só a pontuação entre os desvios (p. 13), a vírgula no lugar de ponto-final como falha de estrutura sintática (p. 13) e um comentário de vírgula sem justificativa sintática (p. 61). |
| 15 | `registro-formal-e-oralidade` | CONFERIDA: p. 12, 13, 14 e 40 | A CONFERIR: BECHARA e CUNHA; CINTRA (variação linguística e níveis de linguagem) | A Cartilha define escolha de registro e escolha vocabular (p. 13), mas não traz lista nem exemplos de marcas de oralidade. A lista é da plataforma. |
| 16 | `proposta-de-intervencao-5-elementos` | CONFERIDA: p. 35, 36, 38, 40 e 44 | Não citados | A Cartilha descreve os elementos em prosa (p. 35 e 36) e fala em "cinco elementos" ao comentar uma redação (p. 44), mas não traz quadro de definições com nomes fixos. Numeração e ordem de 1 a 5 são da plataforma. |
| 17 | `direitos-humanos-na-proposta` | CONFERIDA: p. 5 a 8, 35, 37, 38 e 40 | Não citados | O desrespeito aos direitos humanos gera nota 0 apenas na Competência V (p. 38). A lista de situações de nota 0 da redação inteira (p. 7 e 8) não o inclui. |
| 18 | `conclusao-retomada-e-proposta` | CONFERIDA: p. 27, 29, 35, 36, 40, 43, 51, 58 e 65 | Não citados | A Cartilha pede conclusão que feche a discussão (p. 40), sem fórmula. "Retomada da tese" e "proposta no último parágrafo" aparecem só como prática descrita em redações comentadas de 2025 com boas notas (amostra), nunca como regra. A redação da p. 43 é comentada como não atingindo o nível máximo; as demais são citadas só como prática observada. |

Não consta na Cartilha:

- As regras de regência, de crase e de vírgula (conteúdos 13 e 14).
- A lista de marcas de oralidade (conteúdo 15).
- O quadro de definições dos cinco elementos da proposta (conteúdo 16).
- "Retomada da tese" e "proposta no último parágrafo" como regra (conteúdo 18).

Sistematização didática da plataforma (conferir com professor):

- Numeração e ordem de 1 a 5 dos elementos da proposta (conteúdo 16).
- Roteiro em três passos da conclusão: retomar, propor, fechar (conteúdo 18).
- Lista de marcas de oralidade e suas reescritas (conteúdo 15).

Pendências para conferência humana:

- Abrir BECHARA e CUNHA; CINTRA no exemplar físico e anotar edição, capítulo e página nas citações dos conteúdos 13, 14 e 15, e validar os casos de consenso de regência e de crase.
- Validar com professor a lista de marcas de oralidade (15), a numeração dos cinco elementos (16) e o roteiro da conclusão (18).
- Confirmar com professor ou humano a leitura da p. 37 e 38 sobre direitos humanos antes de ampliar o conteúdo 17 além do que a Cartilha diz.
