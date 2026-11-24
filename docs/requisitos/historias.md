# Histórias de usuário

Tamanho: P/M/G. Escopo vigente = fase H (Hackathon Hack Brasil 2026, trilha "Acesso à educação"; PO, 2026-11-24). As seções F0 a F5 abaixo são o plano de produto completo e foram preservadas; o que não está na tabela da fase H é **pós-hackathon**. Épicos: E1 Conta e acesso, E2 Mapa e Trilhas, E3 Jornada, E4 Estudo de conteúdo, E5 Revisão, E6 Simulados, E7 Book, E8 Mentor e custo, E9 Redação, E10 Papel e foto, E11 Cronograma, E12 Planos e cobrança, E13 Grupos, E14 Professor, E15 Início e Perfil, E16 Conteúdo e dados, E17 Entrega do hackathon.

## Fase H: Hackathon (24 a 30/11/2026, 4 devs)

Capacidade: 4 pessoas por 6 dias. Se apertar, cortar nesta ordem: US-016, US-018, US-014 (todas Should). Demais: Must.

### Histórias existentes recortadas para a fase H
Os cenários Gherkin das seções F0–F2 valem, exceto onde a coluna "Recorte H" disser outra coisa.

| US | Tam. | Prior. | Recorte H |
|---|---|---|---|
| US-001 Conhecer a plataforma | P | Must | Entrada curta com aviso de que a demo usa dados fictícios. |
| US-002 Cadastrar-me | M | Must | E-mail e senha, sem confirmação de e-mail na demo; Google pós-hackathon (D-028). Sem consentimento de menores (US-003 pós). |
| US-004 Escolher perfil inicial | P | Must | Só Aluno: pula a escolha e vai a Criar Jornada. |
| US-005 Entrar | M | Must | Login simples; sem troca de área. |
| US-006 Mapa com conteúdos | M | Must | UMA matéria (Português/Redação, D-019), ~15 a 20 conteúdos de exemplo (seed), sem ciclos. |
| US-009 Explorar o Mapa | M | Must | Drawer do nó e filtro por estado; filtros por área/Trilha opcionais. |
| US-010 Trilhas da plataforma | P | Must | Uma Trilha da plataforma. |
| US-011 Criar Jornada com meta | G | Must | Meta + prazo obrigatórios; submetas, nivelamento por teste e limite de 2 Jornadas fora (RN-011 pós); metodologia: só "sem metodologia". |
| US-012 Estudar um conteúdo | G | Must | Seções com fonte citada e pergunta rápida; sem vídeo, Book, impressão. |
| US-013 Dominar e ver no Mapa | M | Must | Mini-simulado 5 questões, 80% (RN-007) com questões originais ou públicas com fonte. |
| US-014 Ver o Início | M | Should | Jornada, próximo conteúdo, prévia do Mapa, aviso de revisão de flashcards. |
| US-016 Cronograma mínimo | M | Should | Como escrito (RF-043). |
| US-018 Flashcards | G | Should | Revisão simples com confiança em 4 níveis; agendamento simples. |

Pós-hackathon (preservadas, sem alteração de ID): US-003, US-007, US-008, US-015, US-017, US-019 a US-041. US-025 (redação por partes ou completar) fica como visão completa; a fatia do hackathon é a US-042. US-021 e US-022 (mentor e custo de IA) ficam pós; o hackathon usa limite de uso (US-043, RNF-018).

### US-042 Treinar redação por partes com retorno pelas 5 competências  [Must] [E9] (G, H)
Como aluno, quero escrever uma parte da redação (introdução, desenvolvimento ou conclusão) e receber retorno pelas 5 competências do ENEM, para saber o que melhorar.
- Cenário: feliz  Dado um tema e uma parte escrita Quando envio Então recebo, em até alguns segundos e sem travar a tela, retorno por competência com pontos fortes e a melhorar.
- Cenário: texto curto ou vazio  Dado texto abaixo do mínimo Quando envio Então vejo orientação e nenhum uso do limite é consumido.
- Cenário: falha da IA  Dado que a IA falha Quando envio Então vejo erro e posso tentar de novo sem consumir o limite.
- Cenário: sem resposta pronta  Dado o retorno Quando o leio Então ele aponta problemas e caminhos, sem entregar a parte reescrita nem reescrever o texto do aluno (RN-023, D-022 resolvida).

### US-043 Ter limite de uso e aviso de estimativa na redação  [Must] [E9] (P, H)
Como aluno, quero ver quantos retornos de redação me restam e que a nota é só uma estimativa, para não me enganar sobre minha nota real.
- Cenário: nota  Dado o retorno Quando vejo a nota por competência ou total Então ela vem rotulada "estimativa" com o aviso: "Esta nota é uma estimativa feita por inteligência artificial com base nas 5 competências do ENEM. Não é a nota oficial e pode diferir da correção de uma banca humana. Use como orientação de estudo." (RN-014, D-007).
- Cenário: valor do limite  Dado os limites por aluno e da conta de demonstração Quando o sistema os aplica Então usa os valores configurados (provisórios: 3 retornos por aluno por dia; conta de demonstração: 15 por dia, `essay_daily_limit_demo`; D-020), sem valor fixo no código e dentro do teto global de custo.
- Cenário: limite  Dado o limite por aluno esgotado Quando envio outra parte Então vejo aviso claro de que o limite acabou e nenhuma chamada de IA é feita.
- Cenário: contador  Dado a tela de redação Quando abro Então vejo quantos usos me restam.

### US-044 Transformar competência fraca em conteúdo da Jornada  [Should] [E9] (M, H)
Como aluno, quero que a competência fraca sugira conteúdos do Mapa e me deixe adicioná-los à Jornada, para ligar a redação ao meu estudo.
- Cenário: feliz  Dado uma competência fraca Quando vejo o retorno Então aparece sugestão de conteúdo(s) do Mapa de Português/Redação (D-019) e "Adicionar à Jornada".
- Cenário: sem Jornada  Dado nenhuma Jornada ativa Quando clico em adicionar Então sou levado a criar uma, com o conteúdo já escolhido.
- Cenário: sem conteúdo correspondente  Dado competência sem conteúdo no Mapa Quando vejo o retorno Então não há sugestão e o texto não promete uma.
- Cenário: recusa  Dado a sugestão Quando a ignoro Então nada é adicionado (RN-001).

### US-045 Publicar repositório público com README  [Must] [E17] (P, H)
Como jurado, quero um repositório público com instruções claras, para avaliar o código e rodar o projeto.
- Cenário: regulamento  Dado o repositório Quando o confiro Então é novo, público, sem fork, com commits só após 04/11/2026 21h e sem código privado anterior (RNF-019).
- Cenário: README  Dado o README Quando o leio Então encontro descrição, trilha "Acesso à educação", link da demo, conta de demonstração fictícia, instruções para rodar local e visão da arquitetura.
- Cenário: segredos  Dado o histórico Quando o varro Então não há chaves, senhas nem dados reais (RNF-021).

### US-046 Manter a demo no ar  [Must] [E17] (M, H)
Como jurado, quero abrir o link da demo e percorrer o fluxo principal sem configurar nada, para avaliar o produto.
- Cenário: acesso  Dado o link da demo Quando abro Então vejo a entrada, a conta de demonstração fictícia pública (credenciais no README) e a opção de cadastro livre (D-021).
- Cenário: fluxo  Dado a conta de demo Quando percorro cadastro/login, Mapa, Jornada, estudo, mini-simulado, redação e flashcards Então tudo funciona com dados fictícios.
- Cenário: cadastro livre  Dado o cadastro livre Quando me cadastro Então vejo aviso de que a demo é ambiente de teste e de que não devo informar dados pessoais reais (RNF-017).
- Cenário: disponibilidade  Dado o período de avaliação (até a final de 12/12) Quando acesso Então a demo responde (RNF-016).
- Cenário: IA indisponível ou limite global atingido  Dado o teto de custo de IA Quando atingido Então a demo continua e a redação mostra aviso, sem erro técnico (RNF-018).

### US-047 Produzir vídeo e descrição da submissão  [Must] [E17] (P, H)
Como time, quero um vídeo de até 3 minutos e a descrição do projeto, para comunicar o impacto aos jurados.
- Cenário: vídeo  Dado o vídeo Quando alguém o assiste sem login Então dura no máximo 3 min e mostra o problema, o fluxo (Mapa, Jornada, estudo, redação) e o impacto.
- Cenário: descrição  Dado o formulário de submissão Quando envio Então descrição e trilha "Acesso à educação" estão preenchidas e o envio ocorre até 30/11/2026 23h59.
- Cenário: dados  Dado o vídeo Quando o reviso Então só aparecem dados fictícios (RNF-017).

### US-048 Carregar dados de demonstração fictícios (seed)  [Must] [E17] (M, H)
Como time, quero um seed reproduzível com Mapa, Trilha, conteúdos, questões, flashcards e conta de demo fictícios, para a demo e os jurados terem o que ver.
- Cenário: seed  Dado um ambiente novo Quando rodo o seed Então Mapa, Trilha, conteúdos, questões, flashcards e conta de demo existem.
- Cenário: idempotência  Dado o seed já rodado Quando rodo de novo Então não duplica registros.
- Cenário: sem dados reais  Dado o seed Quando o reviso Então nomes, e-mails e textos de aluno são fictícios (RNF-017).

### US-049 Escrever conteúdo de exemplo com fonte  [Must] [E16] (G, H)
Como time, quero ~15 a 20 conteúdos de uma matéria com seções, perguntas e questões originais ou públicas, todos com fonte citada, para o Mapa ter o que estudar.
- Cenário: fonte  Dado uma seção Quando a publico no seed Então tem fonte citada (RN-018).
- Cenário: questões  Dado uma questão Quando a incluo Então é original do time ou pública com a fonte citada; nenhuma questão licenciada de terceiros (RF-062).
- Cenário: cobertura  Dado cada conteúdo Quando o confiro Então tem ao menos 1 seção e 5 questões para o mini-simulado.
- Matéria: Português/Redação (D-019 resolvida); os conteúdos cobrem, por exemplo, as competências da redação do ENEM, para a US-044 ter a quem apontar.

## F0 Fundamentos (MVP)

### US-001 Conhecer a plataforma  [Must] [E1] (P, F0)
Como visitante, quero ver uma apresentação curta e um "Começar agora", para entender a proposta antes de me cadastrar.
- Cenário: caminho feliz  Dado que abro a página de entrada Quando leio os 3 ou 4 blocos e clico em "Começar agora" Então vou ao cadastro.
- Cenário: celular  Dado um celular Quando abro a página Então o layout se adapta sem rolagem horizontal.

### US-002 Cadastrar-me com e-mail e senha  [Must] [E1] (M, F0; H: só e-mail e senha)
Como visitante, quero me cadastrar com e-mail e senha, para acessar a plataforma. Cadastro com Google fica pós-hackathon (D-028).
- Cenário: feliz  Dado e-mail e senha informados Quando confirmo o cadastro Então a conta é criada e sigo à escolha de perfil (US-004).
- Cenário: sem confirmação de e-mail (H)  Dado a conta recém-criada na demo Quando tento entrar Então a conta já está ativa, sem e-mail de confirmação (D-028).
- Cenário: e-mail já usado  Dado um e-mail já cadastrado Quando tento cadastrar Então vejo mensagem clara e opção de entrar.
- Pendente: regras de senha e recuperação de senha (D-030).
- Pós-hackathon (D-028): Cenário: Google  Dado que escolho Google Quando autorizo Então a conta é criada e sigo à escolha de perfil. Cenário: falha do provedor  Dado que o Google falha Quando volto Então posso tentar por e-mail sem perder o que digitei.

### US-003 Consentimento para menores de 18  [Must] [E1] (M, F0)
Como menor de 18 anos, quero passar pela etapa de consentimento exigida, para usar a plataforma em conformidade com a LGPD.
- Cenário: menor  Dado que informo idade menor que 18 Quando continuo o cadastro Então a etapa de consentimento aparece e a conta só é ativada após concluí-la.
- Cenário: recusa  Dado que o consentimento não é dado Quando tento avançar Então a conta não é ativada e nenhum dado além do mínimo é mantido.
- Pendente: forma do consentimento (D-006).

### US-004 Escolher perfil inicial  [Must] [E1] (P, F0)
Como novo usuário, quero escolher meu perfil, para entrar na área certa. No MVP só existe o perfil Aluno; o Professor entra na F5 (RN-020, D-001).
- Cenário: aluno  Dado que escolho Aluno Quando confirmo Então vou a Criar Jornada.
- Cenário: MVP sem Professor  Dado o MVP (F0–F2) Quando vejo a escolha de perfil Então não há opção de Professor.
- Cenário: professor (F5)  Dado a F5 e que escolho Professor Quando confirmo Então vou a Minhas Trilhas.
- Cenário: segundo perfil (F5)  Dado que tenho um perfil Quando adiciono o outro no Perfil Então passo a ter dois perfis.

### US-005 Entrar e trocar de área  [Must] [E1] (M, F0; troca de área na F5)
Como usuário, quero entrar na minha área e, a partir da F5, alternar entre Aluno e Professor, para usar cada área separadamente.
- Cenário: um perfil  Dado um só perfil Quando faço login Então caio direto na área dele.
- Cenário: dois perfis (F5)  Dado dois perfis Quando faço login Então vejo "Como você quer entrar hoje?".
- Cenário: troca (F5)  Dado que estou numa área Quando uso "Trocar para área de ..." Então a navegação da outra área é carregada sem itens da primeira.

### US-006 Ver o Mapa com conteúdos de teste  [Must] [E2] (M, F0)
Como membro do time, quero um Mapa que carregue conteúdos de teste ligados por pré-requisito, para validar o modelo do grafo.
- Cenário: carga  Dado conteúdos de teste cadastrados Quando abro o Mapa Então os nós e ligações aparecem.
- Cenário: ciclo  Dado uma ligação que criaria ciclo de pré-requisito Quando cadastro Então ela é rejeitada com erro.

### US-007 Medir produto  [Should] [E8] (M, F0)
Como time de produto, quero eventos de ativação e retenção desde o início, para medir o MVP.
- Cenário: evento  Dado um aluno que conclui o cadastro Quando o evento é emitido Então fica registrado sem dados pessoais além do necessário.

### US-008 Publicar conteúdo com fonte validada  [Must] [E16] (M, F0)
Como editor de conteúdo, quero um fluxo de produção e validação com fonte citada, para publicar só conteúdo confiável.
- Cenário: sem fonte  Dado uma seção sem fonte Quando tento publicar Então a publicação é bloqueada.
- Cenário: validado  Dado uma seção com fonte e revisão feita Quando publico Então ela fica disponível aos alunos.
- Pendente: quem produz e valida (D-005).

## F1 Núcleo do aluno (MVP)

### US-009 Explorar o Mapa  [Must] [E2] (M, F1)
Como aluno, quero filtrar o Mapa e abrir o drawer de um nó, para entender onde estou e o que estudar.
- Cenário: filtro  Dado o Mapa Quando filtro por área, Trilha e estado Então só os nós correspondentes aparecem.
- Cenário: drawer  Dado um nó Quando clico Então vejo estado, pré-requisitos e Trilhas, com "Estudar conteúdo" e "Adicionar a uma Jornada".
- Cenário: vazio  Dado filtros sem resultado Quando aplico Então vejo mensagem e opção de limpar.

### US-010 Usar Trilhas da plataforma  [Must] [E2] (P, F1)
Como aluno, quero escolher uma Trilha da plataforma (ex.: ENEM: Matemática), para ter um recorte do Mapa para meu objetivo.
- Cenário: listar  Dado Trilhas publicadas Quando abro a lista Então vejo nome, objetivo e quantidade de conteúdos.
- Cenário: origem  Dado uma Trilha Quando a abro Então ela indica a plataforma como origem (no MVP só existem Trilhas da plataforma; RN-020, D-001).
- Cenário: sem criação  Dado o MVP Quando procuro criar uma Trilha Então não existe essa opção ao aluno.

### US-011 Criar Jornada com meta  [Must] [E3] (G, F1)
Como aluno, quero criar uma Jornada com base em Trilha ou conteúdos do Mapa, com meta e prazo, para estudar com direção.
- Cenário: feliz  Dado que escolho a base, defino meta com prazo, nivelamento e revisão Quando clico "Começar" Então a Jornada aparece no Início e no Perfil.
- Cenário: sem meta  Dado que não defini meta Quando tento avançar Então o fluxo é bloqueado com mensagem.
- Cenário: recusa de metodologia  Dado a metodologia sugerida Quando escolho "Prefiro sem metodologia" Então a Jornada é criada sem metodologia.
- Cenário: limite  Dado 2 Jornadas ativas no gratuito Quando tento criar a terceira Então vejo o limite e a opção de arquivar uma (RN-011).

### US-012 Estudar um conteúdo  [Must] [E4] (G, F1)
Como aluno, quero estudar as seções de um conteúdo com fonte citada, para aprendê-lo.
- Cenário: entrada  Dado o drawer, o roadmap ou uma sessão Quando clico em estudar Então abre o conteúdo.
- Cenário: fonte  Dado uma seção Quando a leio Então vejo a fonte citada.
- Cenário: sem avaliações  Dado que recusei avaliações Quando termino as seções Então sigo ao mini-simulado.

### US-013 Dominar conteúdo e ver progresso no Mapa  [Must] [E4] (M, F1)
Como aluno, quero que o domínio volte ao Mapa, para ver meu progresso.
- Cenário: aprovado  Dado um mini-simulado de 5 questões Quando acerto 4 ou mais (80%) e concluo Então o conteúdo vira dominado e o nó acende.
- Cenário: reprovado  Dado um mini-simulado de 5 questões Quando acerto 3 ou menos e concluo Então vejo as seções a rever e volto ao estudo.
- Cenário: configuração  Dado outro valor de questões ou limiar na configuração Quando o aluno faz o mini-simulado Então a regra usa os valores configurados, sem alterar o código (RN-007, D-003).

### US-014 Ver o Início  [Should] [E15] (M, F1)
Como aluno, quero um Início com Jornada ativa, próximo conteúdo e prévia do Mapa, para retomar o estudo.
- Cenário: com Jornada  Dado Jornada ativa Quando abro o Início Então vejo meta, submetas e próximo conteúdo.
- Cenário: sem Jornada  Dado nenhuma Jornada Quando abro o Início Então vejo convite para criar uma.

### US-015 Ver meu Perfil  [Should] [E15] (M, F1)
Como usuário, quero ver Jornadas, metas, evolução e atividade, e gerenciar meus perfis.
- Cenário: dados  Dado atividade registrada Quando abro o Perfil Então vejo Jornadas, metas, evolução e "Meu mapa".
- Cenário: adicionar perfil (F5)  Dado só o perfil Aluno Quando adiciono Professor Então a troca de área passa a existir; no MVP a opção não aparece (RN-020).

### US-016 Ter um cronograma mínimo  [Should] [E11] (M, F1; D-002 resolvida)
Como aluno, quero sessões geradas a partir da minha Jornada e da minha disponibilidade, para saber o que estudar em cada dia. Versão mínima: sem metodologias, tipos de sessão, ajustes, cotas nem cobrança (ficam na F4, US-031 e US-032). Depende de US-011 e US-012.
- Cenário: geração  Dado Jornada ativa e disponibilidade informada Quando gero Então vejo sessões em datas e horários, cada uma ligada a um conteúdo da Jornada.
- Cenário: começar  Dado a sessão do dia Quando clico "Começar sessão" Então abre o conteúdo a estudar (US-012).
- Cenário: sem disponibilidade  Dado que não informei Quando abro o Cronograma Então sou levado a informá-la.
- Cenário: sem Jornada  Dado nenhuma Jornada ativa Quando abro o Cronograma Então vejo convite para criar uma Jornada.
- Cenário: disponibilidade insuficiente  Dado que a disponibilidade não cabe nos conteúdos até o prazo da meta Quando gero Então vejo aviso de que o prazo não será atingido, e as sessões são geradas mesmo assim.
- Cenário: gratuito  Dado o plano gratuito Quando uso o Cronograma Então não há cota nem cobrança (RN-009).

## F2 Prática e simulados (MVP)

### US-017 Avaliar antes e depois do conteúdo  [Should] [E4] (M, F2)
Como aluno, quero avaliação inicial (~5 atividades) e final opcionais, para pular o que já sei e confirmar o que aprendi.
- Cenário: já domina  Dado avaliação inicial Quando acerto o suficiente Então o conteúdo vira dominado.
- Cenário: não domina  Dado a avaliação inicial insuficiente Quando concluo Então sigo ao estudo das seções.
- Cenário: recusa  Dado a sugestão de avaliar Quando recuso Então vou direto ao estudo (RN-001).
- Cenário: final reprovada  Dado a avaliação final Quando não passo Então vejo seções a rever.

### US-018 Revisar com flashcards  [Must] [E5] (G, F2)
Como aluno, quero flashcards com confiança em 4 níveis e agendamento, para fixar o conteúdo.
- Cenário: feliz  Dado flashcards do dia Quando respondo, viro e avalio a confiança Então a próxima revisão é agendada.
- Cenário: fim  Dado o último cartão Quando termino Então os nós avançados acendem no Mapa.
- Cenário: nenhum  Dado nenhuma revisão do dia Quando abro Revisar Então vejo mensagem de nada pendente.

### US-019 Resolver simulados  [Must] [E6] (G, F2)
Como aluno, quero simulados completo, por área, da Jornada ou personalizado, para treinar com questões reais.
- Cenário: personalizado  Dado conteúdos, quantidade, nível e tempo Quando inicio Então recebo as questões com cronômetro.
- Cenário: salvar  Dado um simulado por área Quando saio Então posso continuar depois.
- Cenário: completo  Dado o completo cronometrado Quando saio Então não posso salvar e continuar (RN-017).
- Cenário: entrega  Dado questões em branco Quando vou entregar Então a revisão avisa quais faltam.
- Cenário: cota  Dado 2 simulados longos no mês no gratuito Quando tento o terceiro Então vejo a cota esgotada.

### US-020 Ver resultado do simulado  [Must] [E6] (M, F2)
Como aluno, quero nota estimada, acertos e tempo por questão, para saber onde melhorar.
- Cenário: ENEM  Dado simulado ENEM Quando vejo a nota Então há aviso sobre TRI (RN-014).
- Cenário: fracos  Dado conteúdos com erro Quando clico "Adicionar conteúdos fracos à Jornada" Então são incluídos na Jornada.
- Pendente: cálculo (D-007).

### US-021 Pedir retorno ao mentor de IA  [Should] [E8] (G, F2)
Como aluno, quero retorno individual de um mentor, para tirar dúvidas e orientar o estudo.
- Cenário: feliz  Dado uma pergunta Quando envio Então recebo resposta sem travar a tela.
- Cenário: cota  Dado a cota esgotada Quando peço Então vejo o limite e as opções.
- Cenário: falha  Dado que a IA falha Quando peço Então vejo erro e posso tentar de novo sem perder o uso da cota.

### US-022 Medir custo de IA  [Must] [E8] (M, F2)
Como time de produto, quero custo de IA por aluno e recurso desde a F2, para decidir cotas e preço.
- Cenário: registro  Dado uma chamada de IA Quando conclui Então custo e recurso ficam registrados por aluno.
- Cenário: consulta  Dado o período Quando consulto Então vejo custo por aluno e por recurso.

### US-023 Anotar no Book  [Should] [E7] (M, F2)
Como aluno, quero cadernos com blocos que referenciam Conteúdo > Seção, para organizar minhas notas.
- Cenário: anotar  Dado uma seção Quando clico "Anotar no Book" Então o bloco nasce com a referência.
- Cenário: marcador  Dado seções com notas Quando abro o conteúdo Então o marcador abre o painel lateral.

### US-024 Receber questões reais licenciadas  [Must] [E16] (M, F2)
Como aluno, quero questões reais com ano e fonte, para treinar com material fiel.
- Cenário: fonte  Dado uma questão Quando a vejo Então ano e prova aparecem.
- Cenário: sem licença  Dado questão sem uso confirmado Quando importo Então ela não é publicada (D-005).

## F3 Papel e redação

### US-025 Treinar redação por partes ou completar  [Must] [E9] (G, F3)
Como aluno, quero escrever uma parte por vez ou completar uma redação, para receber retorno por competência.
- Cenário: parte  Dado uma parte escrita Quando envio Então recebo retorno pelas competências afetadas.
- Cenário: completar  Dado tema e partes faltantes Quando envio Então recebo retorno da parte e da coerência com o texto.
- Cenário: assíncrono  Dado a correção em andamento Quando aguardo Então vejo o estado sem travar.

### US-026 Corrigir redação no papel  [Must] [E9] (G, F3)
Como aluno, quero baixar a folha, escrever à mão, digitalizar e receber correção, para treinar como na prova.
- Cenário: feliz  Dado foto da folha Quando reviso a leitura e confirmo Então recebo marcações e nota por competência.
- Cenário: leitura ruim  Dado foto ilegível Quando envio Então peço nova foto sem gastar cota.
- Cenário: treinar  Dado um problema Quando clico "Treinar esta parte" Então vou à prática da parte.

### US-027 Corrigir resolução por foto  [Must] [E10] (G, F3)
Como aluno, quero fotografar minha resolução e ver etapas com estado, para achar onde errei.
- Cenário: feliz  Dado a foto Quando confirmo a leitura Então vejo etapas e dica no primeiro erro.
- Cenário: resolução completa  Dado a dica Quando peço a resolução completa Então ela é exibida (RN-016).
- Cenário: leitura abaixo da taxa  Dado leitura abaixo da taxa mínima Quando envio Então a correção não é liberada e sugiro refazer a foto (RN-015).

### US-028 Enviar mapa mental feito à mão  [Could] [E10] (M, F3)
Como aluno, quero digitalizar meu mapa mental, para comparar com a versão digital.
- Cenário: feliz  Dado a foto Quando confirmo Então vejo o mapa reconhecido, conceitos que faltaram e ligações a revisar.

### US-029 Imprimir questões e folhas  [Should] [E10] (M, F3)
Como aluno, quero gerar PDF de questões e folhas, para estudar no papel.
- Cenário: feliz  Dado uma questão com "Melhor no papel" Quando pré-visualizo e baixo Então o PDF é gerado e posso marcar a resposta na plataforma.
- Cenário: Book  Dado algo digitalizado Quando envio ao Book Então vira bloco no caderno.

### US-030 Fazer modo prova  [Should] [E6] (G, F3)
Como aluno, quero simular uma prova real (ano, dia, cor) e marcar a folha de respostas, para treinar o formato.
- Cenário: feliz  Dado ano, dia e cor Quando fotografo a folha Então recebo o resultado com gabarito oficial.
- Cenário: marcação dupla  Dado questão com duas marcações Quando leio Então ela é sinalizada para revisão.

## F4 Rotina e planos

### US-031 Evoluir o cronograma: tipos de sessão e ajustes  [Must] [E11] (G, F4)
Como aluno, quero sessões por tipo seguindo a metodologia e poder ajustá-las, para manter minha rotina. Evolui o cronograma mínimo da US-016 (F1); depende dela.
- Cenário: tipos  Dado a Jornada com metodologia Quando gero Então as sessões têm tipo (estudar, revisar, simulado, grupo, desafio, sem tela).
- Cenário: ajuste  Dado sessões geradas Quando arrasto, pulo, troco tipo, bloqueio dia ou regero Então o cronograma reflete a mudança.
- Cenário: começar  Dado a sessão do dia de qualquer tipo Quando clico "Começar sessão" Então vou à atividade correspondente.

### US-032 Escolher metodologia de estudo  [Should] [E11] (M, F4, proposta D-013)
Como aluno, quero uma metodologia recomendada ou nenhuma, para organizar as sessões.
- Cenário: recusar  Dado a recomendação Quando escolho nenhuma Então as sessões seguem a Jornada sem metodologia (RN-001).

### US-033 Ter novos tipos de revisão  [Should] [E5] (G, F4)
Como aluno, quero revisão por áudio, "explique com suas palavras", quiz relâmpago, revisão dos erros e mapa de revisão.
- Cenário: áudio  Dado a cota Quando gravo e envio Então recebo retorno do agente.
- Cenário: erros  Dado erros anteriores Quando abro "revisão dos erros" Então só eles são apresentados.

### US-034 Ver e usar cotas  [Must] [E12] (M, F4)
Como aluno, quero ver quanto uso me resta em cada recurso, para me planejar.
- Cenário: consulta  Dado uso no mês Quando abro minhas cotas Então vejo consumo e renovação.
- Cenário: esgotada  Dado cota esgotada Quando uso o recurso Então vejo aviso e opção de assinar; o estudo básico segue livre (RN-009).

### US-035 Assinar o plano Plus  [Must] [E12] (G, F4)
Como aluno, quero assinar por Pix Automático ou cartão, mensal ou anual, para ampliar as cotas.
- Cenário: feliz  Dado escolho plano e meio Quando pago Então as cotas do Plus valem.
- Cenário: falha  Dado pagamento recusado Quando tento Então mantenho o gratuito com mensagem.
- Cenário: cancelamento  Dado cancelamento em até 7 dias Quando solicito Então há reembolso (RN-019).
- Pendente: CNPJ, preço (D-011, D-012).

### US-036 Pedir plano social  [Could] [E12] (M, F4)
Como aluno de escola pública ou baixa renda, quero gratuidade ou desconto, para ter acesso.
- Cenário: feliz  Dado comprovação conforme critério Quando solicito Então recebo o benefício (critério em D-017).

## F5 Grupos e professor

### US-037 Criar grupo  [Should] [E13] (M, F5)
Como aluno, quero criar um grupo com meta ou matéria e convidar por link, para estudar com colegas.
- Cenário: feliz  Dado tipo, meta, frequência e desafios Quando crio Então recebo link de convite.
- Cenário: limite  Dado 1 grupo no gratuito Quando tento o segundo Então vejo o limite.

### US-038 Participar de desafios do grupo  [Should] [E13] (G, F5)
Como membro, quero ver progresso conjunto e desafios, para me manter engajado sem chat.
- Cenário: página  Dado um grupo Quando abro Então vejo progresso, desafio atual e resultados da semana.
- Cenário: sem chat  Dado a página Quando procuro conversa Então não existe chat (RN-006).

### US-039 Responder pergunta aberta e corrigir em grupo  [Could] [E13] (G, F5)
Como membro, quero responder uma pergunta aberta e ver a resposta de um colega se errar, para aprender com o grupo.
- Cenário: desbloqueio  Dado que errei ou cheguei perto Quando solicito Então vejo a resposta de um colega que acertou.
- Cenário: correção  Dado respostas Quando marco com marcações guiadas e reajo Então o colega vê o retorno.

### US-040 Criar Trilha como professor  [Should] [E14] (G, F5)
Como professor, quero montar e publicar Trilhas a partir do Mapa, para guiar meus alunos.
- Cenário: feliz  Dado nome, objetivo, cor e conteúdos ordenados Quando publico Então a Trilha aparece com selo "Professor".
- Cenário: pré-requisito  Dado ordem que viola pré-requisito Quando confiro Então vejo o alerta no grafo.

### US-041 Acompanhar Trilha de forma agregada  [Should] [E14] (M, F5)
Como professor, quero ver quantos alunos usam minha Trilha e o progresso agregado, sem dados individuais.
- Cenário: feliz  Dado uma Trilha usada Quando abro o acompanhamento Então vejo total e progresso agregado.
- Cenário: privacidade  Dado qualquer tela Quando navego Então não vejo nome nem dados individuais (RN-005).
