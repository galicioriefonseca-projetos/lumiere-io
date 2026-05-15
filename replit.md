# Lumière.io

Premium salon management platform for Portuguese-speaking markets — web dashboard and mobile companion app.

## Run & Operate

- `pnpm --filter @workspace/salon-app run dev` — run the web app (Vite)
- `pnpm --filter @workspace/salon-app-mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (optional, fallbacks hardcoded for dev)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React + Vite + Tailwind CSS v3
- Mobile: Expo (SDK 54) + Expo Router v6 + React Query
- Data: Supabase (Mode B — direct from client, no backend layer)
- Auth: Supabase Auth (email/password) — shared across web + mobile

## Where things live

- `artifacts/salon-app/` — web app (React + Vite), routes at `/`
- `artifacts/salon-app-mobile/` — Expo mobile app, preview at `/mobile/`
- `artifacts/salon-app/src/integrations/supabase/client.ts` — Supabase web client
- `artifacts/salon-app-mobile/lib/supabase.ts` — Supabase mobile client (AsyncStorage)
- `artifacts/salon-app-mobile/constants/colors.ts` — Lumière design tokens (dark/light)
- `artifacts/salon-app/src/index.css` — web theme (HSL variables, source of truth)

## Architecture decisions

- **Mode B (Supabase direct)**: Both web and mobile query Supabase directly — no custom API backend for data. The Express api-server exists in the scaffold but is not used by the product.
- **Shared Supabase credentials**: URL and anon key are hardcoded as dev fallbacks in both artifacts so the app works without env vars set.
- **LockManager bypass**: Mobile Supabase client uses a no-op `lock` function to avoid `navigator.locks` errors in Expo web / Replit iframe contexts.
- **Auth guard via useEffect**: Expo Router auth redirect uses `useEffect` + `router.replace` (not `<Redirect />`) because `Redirect` must be rendered inside a navigator.
- **Dark-first theming**: Both artifacts default to the dark luxury palette (Deep Blue `#060c1a` + Gold `#e8b23a`).

## Product

**Lumière.io** is a premium salon management system for Portuguese-speaking salon owners and professionals.

**Web app** (26 routes): Full management suite — professionals, appointments (agendamentos), evaluations (avaliações), gamification, goals (metas), services, clients, commissions, checklists, TV mode, insights, and master admin.

**Mobile app** (5 tabs): Companion app for on-the-go management:
- **Dashboard** — KPI cards (team size, evaluations, avg score, revenue) + recent evaluations feed
- **Equipe** — professionals list with specialty, status badges, commission %
- **Agenda** — appointments with status filter chips (All / Pending / Confirmed / Completed / Cancelled)
- **Conquistas** — gamification achievements with gold/silver/bronze/diamond level badges
- **Configurações** — account info, salon settings, sign out

## User preferences

- Portuguese-language UI throughout (Brazilian Portuguese)
- Luxury dark aesthetic: Deep Blue (#060c1a) + Gold (#e8b23a), Inter font

## Gotchas

- Supabase `navigatorLock` API is blocked in Replit's iframe context — the mobile client uses a custom `lock: noOpLock` bypass in `artifacts/salon-app-mobile/lib/supabase.ts`
- Web app LockManager errors in console are benign (Supabase iframe restriction) — the web app still works
- Mobile Expo app is accessed via `$REPLIT_EXPO_DEV_DOMAIN` (not the shared proxy) — QR code scan works for physical device testing via Expo Go

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Design tokens: web `artifacts/salon-app/src/index.css` → mobile `artifacts/salon-app-mobile/constants/colors.ts`
