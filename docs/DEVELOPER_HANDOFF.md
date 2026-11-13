# ParroDash New (AI Studio) — Developer Handoff

**Updated:** 2026-11-13. **Status:** Experimental React integration, committed on this branch; NOT accepted as full product or production ready.

## Canonical ownership and task boundaries

The latest user's **Master Product Restoration** specification identifies `findmojahid-tech/parrodash` as the existing real application to modify. The original AI Studio UI here is the **pixel-perfect design reference**, not permission to discard old business logic.

- Original product / primary ongoing implementation: https://github.com/findmojahid-tech/parrodash/tree/integration/original-parrodash-ai-studio-parity-20261111
- Canonical developer handoff: https://github.com/findmojahid-tech/parrodash/blob/integration/original-parrodash-ai-studio-parity-20261111/docs/DEVELOPER_HANDOFF.md
- Visual reference: this repository's `main` (original AI Studio UI).
- Experimental feature branch: `integration/oarkie-feature-parity-20261111` (this document).
- Foundation experiment: `integration/oarkie-supabase-foundation-20261111`. **Separate branch, not automatically in this branch.**
- Oarkie public marketing website must not be modified.

Do NOT merge the React experiment into the original modular JS app or into this repo's `main` without architectural review, real-data QA, visual sign-off and rollback readiness. Keep all original branches and code.

## Architecture

- React 19, TypeScript, Vite 8, Tailwind 4; Express `server.ts` for the dev server/AI endpoint; Supabase JS for browser data access.
- `src/App.tsx` owns the design/demo shell. The original design's List, Board, Calendar, Gantt, Table, Docs and Whiteboard views live under `src/components/views/`.
- `src/components/layout/Sidebar.tsx` and `TopHeader.tsx` are key approved visual references.
- Experimental real-auth and data integration files: `src/services/supabaseClient.ts`, `src/components/auth/AuthGate.tsx`, `EmployeeJoin.tsx`, `EmployeeInviteManager.tsx`, `EmployeeApprovalInbox.tsx`.
- Integration UI: `src/components/live/LiveWorkspace.tsx`, `LivePeopleActions.tsx`, `LiveCrm.tsx`, `LiveCollaboration.tsx`, `LiveTaskSubmissions.tsx`, `src/components/task/LiveTasks.tsx`, new task/detail modals.
- The task-submissions implementation inserts into existing `task_submissions`, uses Supabase RLS for reads/writes and `review_work_submission` RPC for manager review. Role and lifecycle tests have not been verified end-to-end.
- Some demo-only state and localStorage persistence may remain. Do not label demo mode as production persistence.

## What has been committed

GitHub comparison before this handoff: this branch was **67 commits ahead of `main`**, zero behind. The branch contains real integration experiments for Auth, employee approvals, CRM, People, collaboration, tasks and task submissions. These commits are already in GitHub; no additional local push is needed for those changes. This documentation commit adds the developer guide.

Previous Vercel READY preview recorded for this branch: https://parrodash-new-preview-cignxasd0-tparro-dev-s.vercel.app at SHA `5ee4cf66892be9834d172af35fa09bb6e17d3422`. It is not a verified complete app; preview environment keys/real-account flows require review.

## Developer commands

```bash
git clone https://github.com/findmojahid-tech/parrodash_new.git
cd parrodash_new
git fetch --all
git switch integration/oarkie-feature-parity-20261111
npm install
npm run lint
npm run build
npm run dev
```

Use the `.env.example` variable names. Only public Supabase anon/publishable keys belong in browser `VITE_*` settings. Never commit service-role keys, passwords, tokens or production secrets. The actual GitHub CI verification status for the latest commit must be checked; a Vercel READY state alone is not a passing typecheck, role test or browser QA.

## Visual parity and functionality acceptance

Reference **`main` UI directly**. Verify desktop 1440x900, 1366x768, 1280x720, tablet 768x1024 and mobile 390x844/320x568. Compare sidebar, top bar, List/Board/Calendar, project/task dialogs, shadows/typography/spacing; ensure no extra generic dashboards, hidden controls or horizontal clipping.

Reconcile all original backend workflows before proposing this React version as a replacement: founder/signup/invite/approval, role isolation, employee privacy, task status/assignment/resources/submissions, projects, recurring calendar/holidays, attendance/leave, CRM, invoices/payroll, messaging, notifications, creative studio, documents, reports, AI, audit. Design appearance is not sufficient.

Crucial gap: audited original schema has no verified multi-organization isolation in common tables. Multi-company billing/onboarding must not go live without schema/RLS redesign and cross-tenant negative tests.

## No destructive operations

Do not touch existing original production app/DB, marketing site, Vercel production or current users until independently authorized. This branch is a **preserved experimental workstream**, not the authoritative production app. Use staged preview, tests, screenshot diffs, feature-by-feature parity matrix and rollback plan before promotion.

## Documentation links

- Original app canonical handoff: https://github.com/findmojahid-tech/parrodash/blob/integration/original-parrodash-ai-studio-parity-20261111/docs/DEVELOPER_HANDOFF.md
- Existing experimental phase plan: `docs/INTEGRATION_PHASES.md`
- Minimal alternate foundation branch: https://github.com/findmojahid-tech/parrodash_new/tree/integration/oarkie-supabase-foundation-20261111
