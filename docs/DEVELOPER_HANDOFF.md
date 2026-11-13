# Supabase Foundation Experiment — Developer Handoff

**Updated:** 2026-11-13. Branch: `integration/oarkie-supabase-foundation-20261111`. This is a **minimal, separate experiment** and not a finished, deployable ParroDash.

## Critical orientation

- The approved AI Studio design reference is `findmojahid-tech/parrodash_new` `main`.
- Canonical real product work has been directed to `findmojahid-tech/parrodash`, branch `integration/original-parrodash-ai-studio-parity-20261111`.
- Canonical developer guide: https://github.com/findmojahid-tech/parrodash/blob/integration/original-parrodash-ai-studio-parity-20261111/docs/DEVELOPER_HANDOFF.md
- A **more advanced but independent React experiment** exists at `integration/oarkie-feature-parity-20261111`. This foundation branch's seven earlier commits are not automatically included in that branch. Compare changes before reusing any file.
- The Oarkie marketing website is separate; do not touch.

## Committed changes on this branch

- `src/integrations/parrodash/client.ts`: lazy public Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/integrations/parrodash/auth.ts`: typed login/signup/recovery/session/logout adapter.
- `src/integrations/parrodash/IntegrationPreview.tsx`: standalone read-only sign-in and projects/tasks prototype. It is **not** visually identical to the AI Studio main UI and is not a complete production experience.
- `src/main.tsx`: original design continues at `/`; optional integration prototype at `/integration-preview`.
- `package.json`: Supabase JS client dependency; `.env.example` documents public variables.
- `docs/OARKIE_INTEGRATION_STATUS.md`: original integration notes.

Prior to the handoff document the foundation branch was **7 commits ahead of `main`**, zero behind.

## Running locally

```bash
git clone https://github.com/findmojahid-tech/parrodash_new.git
cd parrodash_new
git fetch --all
git switch integration/oarkie-supabase-foundation-20261111
npm install
npm run lint
npm run build
npm run dev
```

Set only appropriate public browser environment variables from a **safe staging** Supabase context. Do not copy service-role keys or production secrets into `VITE_*`. Retain proper RLS and active/approved member checks.

## Status and next action

- Source files are committed on GitHub.
- Real login/approval/password recovery, tenant isolation, UI parity and end-to-end tests are **not verified**.
- Do not merge this preview directly into main or into production. Compare with the more advanced React experimental branch and adopt only useful pieces after review.
- Primary ongoing product handoff is the **original ParroDash repository**, not this minimal experiment.
