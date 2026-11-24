# Changelog

## [Não lançado]
### Adicionado
- Especificação executável das tarefas T1 a T25 da Sprint 01 em docs/backlog/sprints/tarefas-sprint-01.md, copiada para a descrição das issues KAN-32 a KAN-56 no Jira (M-028)
- Sprint 01 com execução por issue do Jira (KAN-1 a KAN-56), chaves Jira nos épicos e pendências D-039 e D-040, abertas e de baixa prioridade (M-027)
- RNF-024 (interface segue o protótipo do Figma na fase H; fidelidade com evidência por faixa), D-036 resolvida e D-037/D-038 abertas (M-026)
- Sprint 01 aprovada e ativada; repositório Rangel64/aprumo criado; commit inicial 3ca1d5b (M-025)
- Sprint 01 planejada (hackathon, 24 a 30/11, 21 histórias da fase H em "em sprint") em docs/backlog/sprints/sprint-01.md; épicos E1 a E17 em docs/backlog/epicos.md; pendências D-033 (Docker desligado) e D-034 (autorizações de commit), abertas (M-024)
- Doc de referência da plataforma em docs/referencias (M-001)
- Documentação de requisitos em docs/requisitos: histórias, casos de uso, RF/RNF/RN, rastreabilidade (M-002)
- Backlog e pendências com decisões em aberto D-001 a D-018 (M-003)
- Definition of Done e registro de mudanças (M-004)
- Fase H (hackathon): US-042 a US-049, RF-054 a RF-062, RNF-016 a RNF-021, RN-022, RN-023, UC-013, cronograma de 6 dias, perfil DoD hackathon, D-019 a D-023 (M-006)
- Pendências D-029 (escala de plantão de 29/11 a 12/12, aberta) e D-030 (regras de senha e recuperação na demo, aberta) (M-014, M-016)
- 5 briefings das faixas A a D criados em docs/arquitetura/briefings/ (README.md, faixa-a-plataforma.md, faixa-b-mapa-jornada.md, faixa-c-estudo-conteudo.md, faixa-d-redacao-ia.md), a partir do plano da fase H; D-010, D-020 e D-030 seguem em aberto (M-018)
- Pendências D-031 (regra de quem ajusta teste quebrado de outra faixa) e D-032 (possível divergência de Gherkin em US-010 e US-018), ambas abertas e de baixa prioridade (M-018)
### Alterado
- Sprint 01: design system em T2 e T3, critério de fidelidade ao Figma nas tarefas de UI, risco R-16 e D-037/D-038 em aberto; matriz liga RNF-024 às histórias de UI da fase H (M-026)
- Página do artefato plano-rumo-artefato.html sincronizada com plano e briefings (donos, datas, pacotes, migrations, esquema de exemplos); termo do modo de prova removido (M-023)
- Plano e briefings: reposição da conta demo por apagar e reinserir as 2 redações (sem ON CONFLICT na tripla), ai_usage.submission_id com ON DELETE SET NULL, redações semeadas da conta demo não consomem o limite de 15 nem o teto, CHECK (is_example = (example_key IS NOT NULL)), db push de produção só de A (supabase link e dump antes), seed de config distinto do seed.ts v1 (M-022)
- Plano e briefings ajustados para linhas de exemplo de redação: user_id nulo só com CHECK, example_key único para idempotência do seed e do cron, redações da conta demo separadas das reservas, db push de produção só de A, migrations listadas em B e C (M-021)
- Correções finais dos briefings e do plano (7 itens): demo-essays.json entregue por D em 25/11; content/config.json passa a ser de A; migrations aplicadas em aprumo-dev sem Docker (supabase db push e gen types por project-id); corpus do D-010 com 3 temas provisórios; D-010 comparado em 24/11 e decidido em 25/11; evidências por faixa e migrations de D listadas; linhas is_example com user_id nulo lidas só no servidor (M-020)
- Briefings das faixas A a D e plano corrigidos após revisão (14 itens): A é dona de auth e Início, A instala todos os pacotes na etapa 0, C é dona do validador de content/, A fixa o formato dos JSON em src/contracts/content.ts, datas de trilha, temas e app_config ajustadas, US-047 passa à faixa D, exemplo gravado lido no servidor, reserve_ai_usage vira migration de D em 25/11, e2e por faixa, primeiro dump antes do primeiro db push de prod, D-031 e D-032 listadas (M-019)
- Sem escala de plantão: qualquer integrante do grupo atende quando houver chamado; dump diário (29/11 a 12/12 e antes de cada db push), monitor com alerta e cron mantidos; D-029 resolvida com nota de risco; RNF-023, R-14 e D-027 ajustados (M-017)
- Plantão de 29/11 a 12/12 feito pelo grupo; escala ainda a definir (D-029; RNF-023 e R-14) (M-016)
- Nome "Aprumo" aceito pelo grupo sem verificação formal; D-024 resolvida e R-13 atualizado (M-015)
- Limites de IA: 3 retornos de redação por aluno por dia e 15 por dia na conta de demonstração (`essay_daily_limit_demo`); teto global de US$ 20 segue provisório e aberto em D-020 (RF-056, RN-022, RNF-018, US-043) (M-013)
- Custo de IA pago pelo próprio grupo (D-026 resolvida); limite de gasto a configurar nos provedores no dia 1 (RNF-018, R-15) (M-012)
- Login na fase H só por e-mail e senha, sem confirmação de e-mail na demo; cadastro com Google fica pós-hackathon (US-002, RF-002, UC-001, D-028 resolvida) (M-014)
- Dump manual do banco passa a ser diário (por quem estiver de plantão) de 29/11 a 12/12 e antes de cada `db push`, fora do repositório; RNF-023 e R-14 alinhados, D-027 resolvida (M-011)
- Infraestrutura em planos gratuitos (Vercel Hobby, Supabase Free, monitor externo, GitHub e CI gratuitos); só a IA é paga; RNF-022 e RNF-023 criados, D-025 resolvida e D-026 aberta (M-010)
- Nome provisório da plataforma trocado para "Aprumo" (substitui Rumo e Veredas) nos docs de requisitos e pendências (D-015, D-024; M-009)
- Nome provisório da plataforma trocado de "Rumo" para "Veredas" nos docs de requisitos e pendências (D-015, D-024; M-008)
- Decisões do PO aplicadas: nome provisório "Rumo" (D-015), Vercel + Supabase (D-009), matéria Português/Redação (D-019), demo com conta pública e cadastro livre (D-021), RN-023 aceita (D-022), docs no repositório novo (D-023), texto do aviso da nota estimada (D-007); D-010 e D-020 abertas com recomendação e valores provisórios; D-024 nova; US-042, US-043, US-046 e US-049 prontas (M-007)
- Decisões D-001 a D-003 resolvidas: Trilhas e perfil Professor só na F5, cronograma mínimo na F1 (US-016), mini-simulado com 5 questões e 80% configuráveis (RN-007); requisitos, backlog e matriz atualizados (M-005)
- Escopo redefinido para o hackathon Hack Brasil 2026: histórias fora do hackathon marcadas pós-hackathon, backlog reordenado, D-004 descartada, D-005/D-006/D-018 reduzidas, D-011/D-012/D-016/D-017 pós-hackathon (M-006)
### Corrigido
### Removido
