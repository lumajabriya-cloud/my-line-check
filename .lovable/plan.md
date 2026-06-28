## Goal

Add Google sign-in and move all line-check data out of `localStorage` into Lovable Cloud, so:
- Anyone has to sign in (with Google) to use the app.
- All signed-in team members see and edit the same shared line checks.
- Data survives app updates, browser changes, and devices (no more `localStorage`-only state).

## What I'll do

1. **Enable Lovable Cloud** (creates the backend, no extra accounts).
2. **Configure Google sign-in** through Lovable's auth broker.
3. **Create two tables** (shared across all users — no per-user filter):
   - `section_structs` — one row per section name, holds the edited category/item structure that's currently in `linecheck:section-items:*` localStorage keys.
   - `section_checks` — one row per `(section_name, date)`, holds the daily check state (entries, shift times, member) that's currently in `linecheck:<name>:<date>`.
   Both tables: RLS on, `SELECT/INSERT/UPDATE/DELETE` allowed to any `authenticated` user (since the team shares data). `service_role` full access. `anon` gets nothing.
4. **Build the auth surface**:
   - Public `/auth` route with a "Continue with Google" button using the Lovable broker.
   - Move all existing app routes (`/`, `/history`, `/settings`, `/section/$name`) under the integration-managed `_authenticated/` layout so they require sign-in.
   - Add a "Sign out" control in `AppShell`.
5. **Swap data layer in `src/lib/lineCheck.ts`** from localStorage to Cloud-backed server functions + TanStack Query:
   - Reads use `createServerFn` + `requireSupabaseAuth` and are wrapped in `useQuery`/`useSuspenseQuery`.
   - Writes (toggle, set status, save check, edit categories) become server-function mutations that upsert rows and invalidate queries.
   - The History page reads from `section_checks` instead of scanning `localStorage`.
6. **Migration**: on first launch after sign-in, offer a one-time "Import data from this browser" action that uploads any existing `linecheck:*` localStorage entries into Cloud. (Optional, opt-in — no automatic overwrite.)

## Technical notes

- Auth: Google via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. I'll also call `supabase--configure_social_auth` for Google so the provider is enabled.
- Server functions live in `src/lib/lineCheck.functions.ts` (client-safe path) and use `requireSupabaseAuth`; `src/start.ts` will get the bearer attacher appended.
- The shared-data RLS policy is intentionally `USING (true)` for authenticated users (everyone on the team sees everything). If you later want per-user privacy, we'd add a `user_id` column and tighten policies — not in scope now.
- Real-time updates between teammates are out of scope for this pass; cache invalidates on each mutation.

## Quick check before I start

You answered **Shared team data**, but the original message said "all account will be independent from each other". Those are opposite — please confirm: should every signed-in user share the same line checks (Option A: shared), or should each user have their own private checks (Option B: private per user)?

I'll wait for that confirmation before building.