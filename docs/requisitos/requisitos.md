# Requisitos: RF, RNF e Regras de Negócio

Fonte: `docs/referencias/plataforma-estudos-fluxos-stack.md` (doc original, 2026-11-20). Fase = H (Hackathon, vigente), F0..F5 (plano completo; tudo que não é fase H é pós-hackathon). Itens marcados "proposta" dependem de decisão em `docs/backlog/pendencias.md` (D-nnn).

## Requisitos funcionais

| ID | Requisito | Fase | Origem (fluxo) |
|---|---|---|---|
| RF-001 | Página de entrada com apresentação em 3 ou 4 blocos e botão "Começar agora". | F0 | 1 |
| RF-002 | Cadastro e login por e-mail e senha, sem confirmação de e-mail na demo (fase H). Cadastro com Google fica pós-hackathon (D-028). | F0 (H: só e-mail e senha) | 1 |
| RF-003 | Etapa de consentimento para menores de 18 anos, conforme a LGPD exigir (regras em D-006). | F0 | 1 |
| RF-004 | Escolha do perfil inicial. No MVP (F0–F2) só o perfil Aluno, que segue para Criar Jornada. A partir da F5, Aluno ou Professor (Professor segue para Minhas Trilhas) e o outro perfil pode ser adicionado depois, no Perfil (RN-020, D-001). | F0 (Aluno); F5 (Professor) | 1 |
| RF-005 | Login: com um perfil, vai direto à área; com dois perfis (a partir da F5), exibe "Como você quer entrar hoje?". | F0; F5 (dois perfis) | 2 |
| RF-006 | Menu de cada área com "Trocar para área de Professor/Aluno" (a partir da F5); as áreas não compartilham navegação. | F5 | 2 |
| RF-007 | Mapa: grafo de conteúdos ligados por pré-requisito e relação, criado só pela plataforma. | F0 | Visão |
| RF-008 | Mapa com filtros por área, Trilha e estado; clicar num nó abre drawer com estado, pré-requisitos e Trilhas em que aparece, com ações "Estudar conteúdo" e "Adicionar a uma Jornada". | F1 | 6 |
| RF-009 | Estado de domínio por aluno em cada nó; ao dominar, o nó acende no Mapa. | F1 | 7, 8 |
| RF-010 | Trilha como recorte do Mapa para um objetivo (ex.: ENEM: Matemática); no MVP, publicada só pela plataforma (RN-020, D-001). | F1 | 3 |
| RF-011 | Criar Jornada tendo como base uma Trilha ou conteúdos escolhidos no Mapa. | F1 | 3 |
| RF-012 | Meta obrigatória na Jornada (dominar conteúdos ou nota em simulado, com prazo); o fluxo não avança sem ela. | F1 | 3 |
| RF-013 | Metodologia na Jornada: a recomendada, alternativas e "Prefiro sem metodologia" (no MVP só "Prefiro sem metodologia" e a recomendada se D-013 liberar; metodologias plenas na F4). | F1/F4 | 3 |
| RF-014 | Submetas opcionais na Jornada. | F1 | 3 |
| RF-015 | Nivelamento da Jornada: começar do zero, teste rápido ou autoavaliação. | F1 | 3 |
| RF-016 | Revisão final da Jornada com mini-grafo e "Começar"; a Jornada passa a aparecer no Início e no Perfil. | F1 | 3 |
| RF-017 | Estudar conteúdo, com entrada pelo drawer do Mapa, pelo roadmap da Jornada ou por sessão do cronograma. | F1 | 7 |
| RF-018 | Seções do conteúdo (texto com destaques, carrossel, pergunta rápida, vídeo, exemplo guiado, resumo), cada uma com fonte citada. | F1 | 7 |
| RF-019 | Avaliação inicial opcional (~5 atividades) com recomendação (pular, estudar só algumas seções ou tudo); se já domina, o conteúdo vira dominado. | F2 | 7 |
| RF-020 | Avaliação final opcional ou mini-simulado para confirmar o aprendizado; se não passou, indica as seções a rever e volta ao estudo. | F1/F2 | 7 |
| RF-021 | Regra de "dominado" via avaliação final ou mini-simulado (5 questões e 80% de acerto, parametrizáveis; RN-007, D-003). | F1 | 7 |
| RF-022 | Durante o estudo: anotar no Book, criar flashcards, imprimir questão, corrigir resolução por foto (as três últimas conforme a fase da funcionalidade). | F1–F3 | 7 |
| RF-023 | Início: Jornada ativa com meta e submetas, próximo conteúdo, revisões de hoje, sequência de dias, meta de simulado, grupo e prévia do Mapa (blocos aparecem conforme a fase). | F1 | 5 |
| RF-024 | Perfil: números principais, metas e submetas, histórico de simulados, evolução, "Meu mapa", Jornadas, grupos, atividade recente, troca de área. | F1 | 14 |
| RF-025 | Flashcards: tentar responder, virar, avaliar confiança em 4 níveis (ou arrastar), próxima; ao fim, nós avançados acendem e a próxima revisão fica agendada. | F2 | 8 |
| RF-026 | Demais tipos de revisão: áudio do aluno, explique com suas palavras, quiz relâmpago, revisão dos erros, mapa de revisão. | F4 | 8 |
| RF-027 | Simulados nos formatos completo, por área, da Jornada, personalizado e modo prova. | F2/F3 | 9 |
| RF-028 | Simulado personalizado: conteúdos, quantidade, nível e tempo. | F2 | 9 |
| RF-029 | Resolver simulado: cronômetro, navegador de questões, marcar para revisar, salvar e continuar (exceto completo cronometrado), revisar antes de entregar e entregar. | F2 | 9 |
| RF-030 | Resultado do simulado: nota estimada (ENEM com aviso sobre TRI), acertos por área e conteúdo, tempo por questão, comparação com a meta e ação "Adicionar conteúdos fracos à Jornada". | F2 | 9 |
| RF-031 | Banco de questões reais, com ano, prova e fonte, que alimenta simulados e mini-simulados (licença/uso em D-005). | F2 | Fases |
| RF-032 | Mentor de IA com retorno individual ao aluno, sujeito a cotas. | F2 | Fases, Stack |
| RF-033 | Book: cadernos por Jornada ou matéria, páginas de blocos; cada bloco referencia Conteúdo > Seção; "Anotar no Book" preenche a referência; marcador nas seções com notas abre painel lateral. | F2 | 12 |
| RF-034 | Redação por partes (uma parte por vez, retorno por competência) e completar a redação (tema, partes faltantes ou sugestão pelas competências fracas, retorno da parte e da coerência). | F3 | 10 |
| RF-035 | Redação completa no papel: baixar folha, escrever, digitalizar, revisar a leitura, receber correção com marcações e nota por competência; cada problema leva a "Treinar esta parte". | F3 | 10 |
| RF-036 | Resolução por foto: "Corrigir minha resolução", captura automática, revisão da leitura, etapas com estado e dica no primeiro erro; resolução completa só se o aluno pedir. | F3 | 11 |
| RF-037 | Mapa mental à mão: captura, mapa reconhecido ao lado da versão digital, conceitos que faltaram, ligações a revisar, Trilhas semelhantes. | F3 | 11 |
| RF-038 | Imprimir questão e folhas: selo "Melhor no papel", pré-visualização, PDF (folhas de redação, questões, folhas de estudo com QR code) e resposta marcada na plataforma. | F3 | 11 |
| RF-039 | Tudo que é digitalizado pode ser enviado ao Book. | F3 | 11 |
| RF-040 | Modo prova: escolher ano, dia e cor do caderno; marcar na folha de respostas com a referência de cada questão; resultado com gabarito oficial. | F3 | 9 |
| RF-041 | Cronograma completo (evolui o RF-043): sessões com tipo (estudar, revisar, simulado, grupo, desafio, sem tela) seguindo a metodologia da Jornada; disponibilidade com períodos, recorrência e duração das sessões. | F4 | 4 |
| RF-042 | Ajustes no cronograma (arrastar, pular, trocar tipo, bloquear dia, regerar). | F4 | 4 |
| RF-043 | Cronograma mínimo: o aluno informa disponibilidade (dias e horários) e a plataforma gera sessões a partir da Jornada, cada uma abrindo o conteúdo a estudar ("Começar sessão" no Início ou Cronograma). Sem metodologias, tipos de sessão, ajustes, cotas nem cobrança (D-002 resolvida). | F1 | 4 |
| RF-044 | Cotas mensais por recurso e por plano (gratuito x Plus), com contagem e aviso ao aluno ao se esgotar. | F4 (medição desde F2) | Planos |
| RF-045 | Assinatura do plano pago (Plus): Pix Automático e cartão, mensal ou anual com desconto. | F4 | Planos |
| RF-046 | Cancelamento com reembolso em até 7 dias. | F4 | Planos |
| RF-047 | Plano social (gratuidade ou desconto para escola pública ou baixa renda); critérios em D-017. | F4 | Planos |
| RF-048 | Criar grupo: tipo (meta coletiva ou estudo recorrente), meta ou matéria, frequência e tipos de desafio; convite por link. | F5 | 13 |
| RF-049 | Página do grupo: progresso conjunto, desafio atual (diário ou semanal, definido pelo grupo), atividade aberta e resultados da semana. | F5 | 13 |
| RF-050 | Pergunta aberta: cada um responde; quem erra ou chega perto desbloqueia a resposta de um colega que acertou. | F5 | 13 |
| RF-051 | Correção colaborativa por marcações guiadas e reações rápidas, sem chat. | F5 | 13 |
| RF-052 | Professor cria Trilha (nome, objetivo, cor), seleciona conteúdos no Mapa, ordena e confere pré-requisitos, publica com selo "Professor". | F5 | 15 |
| RF-053 | Professor acompanha nº de alunos que usam a Trilha e progresso agregado, sem dados individuais. | F5 | 15 |

### Fase H (hackathon)

RF-054 a RF-062 abaixo. Dos RF antigos, entram na fase H: RF-001, RF-002, RF-004 (só Aluno), RF-005 (um perfil), RF-007 a RF-012, RF-014 (opcional), RF-016 a RF-018, RF-020 e RF-021, RF-023, RF-025, RF-043. Os demais são pós-hackathon.

| ID | Requisito | Fase | Origem |
|---|---|---|---|
| RF-054 | Redação por partes no hackathon: o aluno escolhe um tema de exemplo e uma parte (introdução, desenvolvimento, conclusão), envia o texto e recebe retorno por IA para cada uma das 5 competências do ENEM (fatia do RF-034). | H | Hackathon |
| RF-055 | Nota de redação exibida sempre como "estimativa", com aviso de que não é a nota oficial (RN-014). | H | Hackathon |
| RF-056 | Limite de usos de IA da redação por aluno (3 por dia) e limite diário da conta de demonstração (15 por dia, chave `essay_daily_limit_demo`), ambos configuráveis, sem hardcode e dentro do teto global de custo (teto em D-020, ainda aberto). Contador visível e bloqueio sem chamar a IA quando esgotado. | H | Hackathon |
| RF-057 | Competência fraca da redação sugere conteúdo(s) do Mapa de Português/Redação (D-019) e permite adicioná-los à Jornada. | H | Hackathon |
| RF-058 | Repositório novo e público no GitHub com README: descrição, trilha "Acesso à educação", link da demo, conta de demonstração fictícia, como rodar local e arquitetura. | H | Regulamento |
| RF-059 | Demo publicada em URL pública, com conta de demonstração fictícia pública e também cadastro livre com aviso de dados de teste, e fluxo completo (D-021 resolvida). | H | Regulamento |
| RF-060 | Seed reproduzível e idempotente de dados fictícios: Mapa, Trilha, conteúdos, questões, flashcards, conta de demo. | H | Hackathon |
| RF-061 | Material de submissão: vídeo de até 3 min assistível sem login, descrição e trilha escolhida, enviados até 30/11/2026 23h59. | H | Regulamento |
| RF-062 | Conteúdo de exemplo de Português/Redação (D-019) escrito pelo time, com fonte citada; questões originais ou públicas com fonte; sem questões licenciadas de terceiros (D-005 na fase H). | H | Hackathon |

## Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-001 | Desempenho | Correção de redação, leitura de foto e geração de flashcards rodam em segundo plano e não travam a tela; o aluno vê o estado do processamento. Metas de tempo: a definir após medição. |
| RNF-002 | Usabilidade | Site responsivo instalável (PWA) para desktop e celular; câmera via navegador; app nativo fora do escopo. |
| RNF-003 | Acessibilidade | Navegação por teclado, foco visível, regiões `aria-live` para estados assíncronos, contraste adequado (proposta: WCAG 2.1 AA). |
| RNF-004 | LGPD | Base legal, minimização, transparência e atendimento a direitos do titular (acesso, correção, exclusão) para todos os usuários. |
| RNF-005 | LGPD (menores) | Para menores de 18 anos: consentimento, guarda e acesso às fotos e retenção conforme D-006 e D-018; nenhuma foto de menor é tratada antes dessa definição. |
| RNF-006 | LGPD | Fotos de resoluções, redações e mapas mentais com prazo de retenção definido e exclusão automática ao fim do prazo. |
| RNF-007 | Segurança | Dados em região do Brasil (São Paulo); TLS; autenticação com papéis Aluno e Professor no mesmo usuário; acesso mínimo; log de acesso a fotos; sem segredos em repositório. Nota de desvio (D-046, 2026-11-24): o banco `aprumo-dev` está em us-east-2 (Ohio), por decisão do PO, e não em São Paulo; na fase H o requisito de região é aceito como risco (R-17), com dados só fictícios (RNF-017). Demais itens valem. |
| RNF-008 | Segurança/Privacidade | Área de Professor só consulta agregados; nenhuma consulta expõe dados individuais de alunos (RN-005). |
| RNF-009 | Métricas | Medir ativação e retenção desde o primeiro dia (eventos de produto). |
| RNF-010 | Custo | Medir custo de IA por aluno e por recurso a partir da F2 (mentor usa IA), não só na F4; relatório consultável pelo time. |
| RNF-011 | Custo | Gerar uma vez por conteúdo e reaproveitar entre alunos (flashcards, questões); só correções individuais são geradas por aluno. |
| RNF-012 | Qualidade de conteúdo | Toda seção cita fonte; existe processo de produção e validação de conteúdo antes da publicação (responsáveis em D-005). |
| RNF-013 | Qualidade de IA | Modelo de IA validado com material real em português (redações, fotos) antes de uso (D-010). Fase H: comparar 2 modelos com ~5 redações fictícias (qualidade em português, custo, latência) no 1º dia; a escolha é do arquiteto/time. |
| RNF-014 | Disponibilidade | Ambiente de testadores estável (sem pausa por inatividade) e backup diário; metas de SLA a definir após D-009. |
| RNF-015 | Idioma | Interface e conteúdo em português do Brasil. |

### Fase H

| ID | Categoria | Requisito |
|---|---|---|
| RNF-016 | Disponibilidade | Demo no ar de 30/11/2026 até o fim da avaliação (final em 12/12), sem pausa por inatividade; repositório congelado entre 30/11 e 12/12. |
| RNF-017 | LGPD/Dados | Demo, seed, vídeo e repositório só com dados fictícios; nenhum dado pessoal real de terceiros. O cadastro livre da demo (D-021) exibe aviso de dados de teste, pedindo que não se informem dados pessoais reais. |
| RNF-018 | Custo | Custo de IA limitado: limite por aluno (3 por dia) e limite da conta de demonstração (15 por dia, `essay_daily_limit_demo`), RF-056; teto global configurável (provisório US$ 20; valor final no dia 1, D-020). Ao atingir o teto, a demo segue sem a IA, com aviso. Quem paga a conta da IA é o próprio grupo (D-026 resolvida). No dia 1, configurar o limite de gasto mensal no console de cada provedor de IA, sem alterar o teto global. Chaves de IA só no servidor. |
| RNF-019 | Conformidade | Repositório novo e público, sem fork nem código privado anterior; commits só após 04/11/2026 21h. Nenhum código anterior ao evento entra no repositório; os docs de requisitos podem entrar (D-023 resolvida). |
| RNF-020 | Conformidade/Ética | Nenhuma funcionalidade ou texto de produto sugere colar em prova ou burlar plágio: não usar o nome "Modo prova"; resolução completa só se o aluno pedir (RN-016). |
| RNF-021 | Segurança | Repositório público sem segredos (variáveis de ambiente fora do código; exemplo `.env.example` sem valores reais). |
| RNF-022 | Custo | Infraestrutura no plano gratuito: Vercel Hobby, Supabase Free, monitor externo gratuito, GitHub público e CI gratuito; nenhum plano pago de infraestrutura (Supabase Pro recusado, D-025). Só o custo de IA é pago, limitado por RNF-018. Limites do plano Free (banco, armazenamento, banda, execuções) confirmados no dia 1 e anotados neste requisito; se um limite for ultrapassado, o time decide o ajuste de escopo. |
| RNF-023 | Disponibilidade | Demo no ar de 30/11/2026 até 12/12/2026 (complementa RNF-016) com: monitor externo gratuito com alerta; cron que mantém o banco ativo, evitando pausa por inatividade do Supabase Free; dump manual do banco, sem backup diário garantido pelo plano gratuito, feito uma vez por dia por qualquer integrante do grupo, sem escala, de 29/11/2026 a 12/12/2026, e também antes de cada `db push` (D-027); sem escala de plantão: qualquer integrante do grupo atende quando houver chamado (alerta do monitor, queda da demo, necessidade de dump), conforme D-029; dump guardado fora do repositório; restauração ensaiada uma vez. Dump só com dados fictícios e sem segredos (RNF-017, RNF-021). |
| RNF-024 | Usabilidade/Design | A interface segue o protótipo do Figma (cores, tipografia Nunito e Quicksand, raios, componentes e estrutura das telas da fase H; referência e imagens em `docs/design/`). A fidelidade é conferida lado a lado com a imagem de referência, com evidência por faixa em `docs/evidencias/faixa-x/`. O Gherkin das histórias manda no comportamento; divergências visuais são relatadas na evidência, sem alterar o comportamento. Decisão do PO em 2026-11-24 (D-036); divergências a confirmar em D-037 e alcance em D-038. |

Na fase H, RNF-009, RNF-010 (relatório), RNF-014 (backup diário e SLA; substituídos na fase H por RNF-022 e RNF-023, D-025) e RNF-005/006 ficam pós-hackathon; RNF-003 e RNF-015 valem de forma enxuta.

## Regras de negócio

| ID | Regra |
|---|---|
| RN-001 | Avaliações, metodologias e papel (impressão) são sempre sugestões que o aluno pode recusar. |
| RN-002 | Jornada exige meta (dominar conteúdos ou nota em simulado, com prazo); submetas são opcionais. |
| RN-003 | Um usuário pode ser Aluno e Professor, em áreas separadas. |
| RN-004 | Conteúdo geral é criado só pela plataforma; professor só monta Trilhas. |
| RN-005 | Professor vê apenas progresso agregado, nunca dados individuais. |
| RN-006 | Grupos não têm chat; interação só por desafios, pergunta aberta, marcações guiadas e reações. |
| RN-007 | Conteúdo vira "dominado" ao passar na avaliação final, ao passar na avaliação inicial ("já domina") ou ao atingir o limiar do mini-simulado. Mini-simulado: 5 questões e acerto de pelo menos 80% (4 de 5), definidos em D-003. Os dois valores são parametrizáveis por configuração, sem valor fixo no código. |
| RN-008 | Ao dominar, o nó acende no Mapa do aluno. |
| RN-009 | Nada que trave o estudo é pago: Mapa, Trilhas, Jornadas, conteúdos, flashcards, cronograma e grupos funcionam no gratuito. |
| RN-010 | O pago cobre o que custa por uso (correção de redação, leitura de fotos, retorno individual do agente); cada recurso pago tem cota pequena no gratuito. |
| RN-011 | Cotas do gratuito (ponto de partida a validar, D-011): 2 Jornadas ativas; 5 retornos de áudio/explique por mês; 2 simulados longos por mês; 4 retornos de redação por partes; 1 redação completa no papel; 10 fotos; 2 mapas mentais; 1 grupo. Mini-simulados e modo prova ilimitados. |
| RN-012 | Professor não paga; criação de Trilhas é gratuita. |
| RN-013 | Preços do Plus (R$ 24,90/mês ou R$ 199/ano) são valores a validar com testadores antes de cobrar (D-011). |
| RN-014 | Nota estimada do ENEM é exibida sempre com aviso de que se baseia em estimativa e não é a nota TRI oficial; método de cálculo TRI a definir (pós-hackathon). Fase H, redação (D-007 resolvida): a nota vem rotulada "estimativa" com o texto: "Esta nota é uma estimativa feita por inteligência artificial com base nas 5 competências do ENEM. Não é a nota oficial e pode diferir da correção de uma banca humana. Use como orientação de estudo." |
| RN-015 | A correção por foto só é liberada se a leitura atingir a taxa mínima de acerto (D-008); o aluno revisa a leitura antes da correção. |
| RN-016 | A resolução completa só aparece se o aluno pedir; antes, só dica no primeiro erro. |
| RN-017 | Simulado pode ser salvo e continuado, exceto o completo cronometrado. |
| RN-018 | Toda seção de conteúdo exibe a fonte citada; conteúdo sem fonte não é publicado. |
| RN-019 | Reembolso integral no cancelamento em até 7 dias. |
| RN-020 | Trilhas no MVP vêm só da plataforma; o perfil Professor e a criação de Trilhas por professores existem a partir da F5 (D-001 resolvida; momento exato em D-014). |
| RN-021 | Grupo: meta coletiva ou matéria recorrente; desafios diários ou semanais definidos pelo grupo. |
| RN-022 | Fase H: cada aluno tem um número máximo de usos de IA na redação por dia (3), e a conta de demonstração tem limite próprio (15 por dia, `essay_daily_limit_demo`). Ambos definidos por configuração, sem hardcode e dentro do teto global de custo (D-020, RNF-018). |
| RN-023 | O retorno de redação orienta e aponta problemas, mas nunca reescreve nem escreve o texto no lugar do aluno (D-022 resolvida). |

Na fase H valem RN-001, RN-002, RN-007, RN-008, RN-014, RN-016, RN-018 e RN-022; RN-009 a RN-013, RN-019 e as regras de grupos e professor são pós-hackathon.
