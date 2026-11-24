# ADR-002 (rascunho): bootstrap da plataforma, política do pnpm e limites dos planos gratuitos

Status: rascunho (KAN-32, T1). Data: 2026-11-24. Autor: faixa A (DevOps).

## 1. Política do pnpm

- Gerenciador único: pnpm. Campo `packageManager` do `package.json`: `pnpm@11.25.0` (resultado de `pnpm -v`). `engines.node >= 24` (ambiente: Node v24.20.0).
- Um único `pnpm-lock.yaml`, na raiz. Proibido `package-lock.json` e `yarn.lock`. A faixa A é dona do lockfile e do `pnpm-workspace.yaml`; as demais faixas que precisarem de pacote novo pedem à A ou avisam no PR.
- O CI e o preview instalam com `pnpm install --frozen-lockfile`.
- Scripts de build (postinstall) de dependências no pnpm 11: ficam bloqueados por padrão e a permissão é explícita em `allowBuilds` do `pnpm-workspace.yaml` (o pnpm 11 falha a instalação com `ERR_PNPM_IGNORED_BUILDS` quando há script ignorado sem decisão). Decisão atual:
  - `esbuild: true` (usado por vitest e tsx; o postinstall só valida o binário nativo).
  - `sharp: false` (opcional do Next; a Vercel otimiza imagens por conta própria e a página não depende dele).
  - `unrs-resolver: false` (usado pelo eslint-config-next; tem binários pré-compilados e cai para fallback sem o script).
  - Qualquer dependência nova com script de build exige decisão explícita (true/false) no mesmo PR.
- `@types/node` fixado em `^24` (peer exigido pelo vitest 5; `pnpm peers check` sem pendências).

## 2. Versões instaladas (2026-11-24)

next 16.4.6, react/react-dom 19.3.0, tailwindcss 4.3.3 (com `@tailwindcss/turbopack` 4.3.3, vindo do template), typescript 5.9.3, eslint 9.39.5, @supabase/supabase-js 2.119.2, @supabase/ssr 0.12.7, zod 4.6.7, server-only 0.0.1, ai 7.0.181, @ai-sdk/anthropic 4.0.107, @ai-sdk/google 4.0.125, @ai-sdk/openai 4.0.122, @xyflow/react 13.0.3, react-markdown 10.1.0, sonner 2.0.8; dev: vitest 5.1.1, @playwright/test 1.65.1, supabase (CLI) 3.3.0 (o registro já tem 3.4.0; o pnpm instalou 3.3.0), tsx 4.23.15.

Escolha do renderizador de markdown: `react-markdown` (existe no registro, 10.1.0; renderiza para elementos React sem `dangerouslySetInnerHTML`, o que evita HTML injetado vindo do conteúdo). Provedores do D-010 instalados: anthropic, google, openai (o conjunto final do D-010 pode remover os que não forem usados).

## 3. Observações sobre a versão instalada

- Arquivo de borda da sessão: no Next 16 o nome é `proxy.ts` (função exportada `proxy`); `middleware.ts` está deprecated e foi renomeado. Fonte: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. A T3 deve criar `src/proxy.ts`.
- Google Fonts: `import { Nunito, Quicksand } from "next/font/google"`, com `subsets: ["latin"]` e `variable: "--font-..."`; fontes variáveis dispensam `weight`. Fonte: `.../03-api-reference/02-components/font.md`. O template atual usa Geist da mesma forma. Nada foi instalado nem alterado (T2/T3).
- ATENÇÃO, decisão para o PO/faixa A: o template do `create-next-app` 16.4.6 já traz `cacheComponents: true` e `partialPrefetching: true` em `next.config.ts` (mantidos como gerados). Com `cacheComponents`, dados dinâmicos (cookies, headers, fetch de dados do usuário) fora de `<Suspense>` ou `use cache` quebram o build, e as configs de segmento `dynamic`, `revalidate` e `fetchCache` deixam de ser aceitas. Isso afeta Server Components com sessão do Supabase. Se o grupo preferir o modelo clássico, basta remover essas duas linhas antes da T2/T3.
- Supabase CLI 3.x mudou o alvo padrão: `db push` e `gen types` agem no banco LOCAL por padrão; para o projeto vinculado é preciso `--remote` (sem `--linked`/`--project-id` como no plano §1). Os scripts `db:push` e `db:types` já usam `--remote` (ambos exigem `supabase link` feito pela pessoa; `db:types` não foi executado).
- `supabase init` rodou sem Docker; `supabase/config.toml` com `project_id = "aprumo"`. Não foi feito `login`, `link` nem `start`.
- Playwright: `pnpm test:e2e` ainda não tem `playwright.config.ts` nem testes (vêm da tarefa do smoke e2e); até lá o comando falha por falta de testes.

## 4. Limites dos planos gratuitos (consultados em 2026-11-24)

Conteúdo das páginas tratado como dado. Onde a página não traz o item, consta "não verificado".

### Supabase Free (https://supabase.com/pricing, 2026-11-24)
- Projetos ativos: limite de 2 projetos ativos (aprumo-dev e aprumo-prod ocupam os dois; sem folga para um terceiro).
- Pausa por inatividade: projetos Free são pausados após 1 semana de inatividade.
- Banco: 500 MB por projeto. Armazenamento de arquivos: 1 GB. Tráfego (egress): 5 GB (mais 5 GB de cached egress). MAU de Auth: 50.000. Requisições de API: ilimitadas.
- Backups automáticos: "Not included in free" (https://supabase.com/docs/guides/platform/backups, 2026-11-24: Pro 7 dias, Team 14 dias; para Free a página recomenda exportar regularmente com `supabase db dump` e manter cópia fora). PITR: não incluído no Free.
- Restauração: o restore pelo painel parte dos backups diários, que o Free não tem; no Free a recuperação é por dump manual + reaplicar migrations e `pnpm seed`. Procedimento de retomada de projeto pausado pelo painel: não verificado nesta consulta.
- E-mails de Auth: 2 e-mails por hora com o provedor embutido; para mais, SMTP próprio (https://supabase.com/docs/guides/auth/rate-limits, 2026-11-24). Outros limites da mesma página: cadastros/logins 30 requisições por 5 min por IP; token (login por senha/refresh) 150 por 5 min por IP. Implicação: confirmação de e-mail desligada no dev/prod (T3/T8) é necessária para a demo.
- Região us-east-2 (Ohio): escolhida pelo PO em 2026-11-24 (o `aprumo-dev` foi criado nela; `aprumo-prod` seguirá a mesma). Desvio da D-009: sa-east-1 (São Paulo) deixa de ser requisito. Dados da demo são fictícios, então o RNF-007 fica como risco aceito. Disponibilidade no plano Free confirmada pela criação do projeto no painel.

### Vercel Hobby
- Duração máxima de função: 300 s (padrão e máximo no Hobby, com Fluid compute) (https://vercel.com/docs/plans/hobby e https://vercel.com/docs/functions/configuring-functions/duration, 2026-11-24).
- Uso incluído no Hobby por mês (https://vercel.com/docs/plans/hobby): 1.000.000 invocações de função, 4 CPU-horas ativas, 360 GB-h de memória provisionada, 100 GB de Fast Data Transfer, 10 GB de Fast Origin Transfer, 1.000.000 de requisições de CDN; 100 deployments por dia; 200 projetos. Ao exceder, é preciso esperar 30 dias (sem cobrança adicional no Hobby).
- Cron: no Hobby, no máximo 1 execução por dia (mínimo "Once per day"), precisão por hora (±59 min); expressão mais frequente faz o deploy falhar (https://vercel.com/docs/cron-jobs/usage-and-pricing, 2026-11-24). Observação: a documentação agora chama a área de "Schedules" no menu; a página de limites de cron continua válida. Até 100 cron jobs por projeto.
- Região iad1 (Washington, D.C.): a mais próxima do banco em us-east-2; gru1 deixa de ser requisito. Disponibilidade no Hobby: não verificada (sem fonte consultada); confirmação definitiva ao implantar com `regions: ["iad1"]`. Consequência: latência do navegador (Brasil) até a função maior que com gru1, mas as consultas ao banco ficam na mesma região.
- Uso não comercial no Hobby: não verificado (as páginas consultadas, plans/hobby, pricing e limits, não trazem essa frase em texto; confirmar nos termos/fair use da Vercel).
- Rollback: Instant Rollback existe na documentação da Vercel (menu "Instant Rollback"); o procedimento é manual no painel.
