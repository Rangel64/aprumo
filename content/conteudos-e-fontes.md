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
