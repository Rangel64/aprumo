# Aprumo

Plataforma de estudos (Hack Brasil 2026). Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Requisitos
- Node 24 e pnpm 11.25.0 (campo `packageManager`). Use apenas pnpm; nao crie `package-lock.json` nem `yarn.lock`.
- Variaveis de ambiente: copie `.env.example` para `.env.local` e preencha localmente. Nunca versione valores.

## Comandos
`pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Politica do pnpm, versoes e limites dos planos gratuitos: `docs/adr/ADR-002-rascunho.md`. Plano tecnico: `docs/arquitetura/plano-hackathon.md`.
