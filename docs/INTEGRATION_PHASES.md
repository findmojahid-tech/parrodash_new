# ParroDash integration — preservation-first execution

Date: 2026-11-11
Target (write access): `findmojahid-tech/parrodash_new` only.
Reference (read-only): `findmojahid-tech/parrodash`.
Base SHA of new project: `84536c96650a32e14b9e26a10e849e43d1c43467`.
Working branch: `integration/phase0-preservation-and-quality-gates-20261111`.

## Hard invariants

- Preserve the AI Studio-approved UI as the final app's **primary design system and navigation framework**.
- Before redesigning any UI, finish or explicitly gate the underlying reliability/security phases.
- No code writes, branches, deployments, or pull requests in the original `parrodash` repository.
- No production Supabase modifications, destructive migrations, role changes, or user deletions.
- No production Vercel changes without preview verification and explicit release approval.
- No visual regressions to the new application's sidebar, task views, Docs, Whiteboard, AI UI, animations, or light/dark themes.
- Never claim a mock/localStorage state is production persistence.

## Verified source observations (not production acceptance)

### New app
- React 19, TypeScript, Vite 8, Express, Motion, Tailwind 4, Gemini SDK.
- `src/App.tsx` currently initializes Spaces and demo users from `src/data/initialData`.
- Tasks, Docs, and Whiteboard use `localStorage` for persistence.
- UI includes List, Board, Calendar, Gantt, Table, Docs, Whiteboard, task modals, command palette, timers, and Brain modal.
- `server.ts` contains a Gemini-driven Brain endpoint with fallback; actual AI-provider success is not verified.

### Original app (read-only)
- Supabase-backed work/HR modules are visible in source; multiple active feature/security/design branches exist.
- `docs/PARRODASH_MASTER_ROADMAP.md` (branch `security/phase1-final-gates-20261111`) reports Phase 0 accepted and Phase 1 deployed with real-user acceptance still open.
- `docs/PHASE1_SECURITY_ACCEPTANCE.md` records the recovery email's redirect to the public domain was fixed, but a real end-to-end password-change session remained untested.
- Historical QA evidence is *not* proof that the new app's auth or roles work.
- Shared-production-Supabase migration cannot proceed without a staged isolated environment and RLS review.

## Phases and acceptance gates

| Phase | Status | Deliverable | Acceptance |
|---|---|---|---|
| 0. Preservation and baselines | IN PROGRESS | Inventory, branch isolation, compile/build CI | Baseline builds, no existing UI regressions |
| 1. Auth, invitations, roles, security | NOT STARTED IN NEW APP | Supabase Auth adapter, route guards, role matrix, invite/recovery handling | Real test identities: signup, login, reset, invite, deny-by-role, session persistence |
| 2. UI stability and navigation | NOT STARTED | Preserve approved new design; remove clipping/scroll jumps | Desktop/tablet/mobile screenshots, keyboard and 100% zoom |
| 3. Employee documents and privacy | NOT STARTED | Typed secure adapters for employee identity and private documents | Authenticated cross-user and unauthorized read/write denial |
| 4. People, attendance, leave, payroll | NOT STARTED | Functional modules in the approved React UI | End-to-end employee/manager workflows |
| 5. Projects, tasks, calendar, spaces | NOT STARTED | Map local demo types to authorized Supabase records, retain all views | Changes persist and synchronize across List/Board/Gantt/Table/Calendar |
| 6. CRM, invoices and clients | NOT STARTED | Existing business workflows integrated into new UI | Correct permissions, records, auditability |
| 7. Resources, voice and creative studio | NOT STARTED | Existing employee/creative modules without UI fragmentation | Real upload/download and review permissions |
| 8. Messaging, approvals, reports, AI | NOT STARTED | Chat, notification, analytics, Gemini assistant with truthful states | Permission-safe queries/actions and tested limits |
| 9. SaaS subscriptions | NOT STARTED | Organization tenancy, billing entitlements, plan states | Tenant-isolation tests, verified billing webhooks |
| 10. Release | BLOCKED | Staged preview, smoke tests, rollback | User acceptance before production |

**Status rule:** Prior original repo phases are *reference history*, not accepted phases of the new app. The new implementation must independently pass every gate.

## Immediate next implementation tasks

1. Run CI typecheck/build on this branch; fix any pre-existing errors without visual changes.
2. Inventory old production Supabase table names, RLS, and auth redirect allowlists **read-only**; define explicit TypeScript contracts for the new UI.
3. Create an isolated Supabase staging project or equivalent approved test environment before applying changes.
4. Add a Supabase Auth adapter to the new app with no production DB mutation; preserve demo mode until auth is verified.
5. Validate login, recovery, pending employee approval, role-denial and session restoration with authorized test accounts.
6. Only after these gates integrate HR/work modules into the existing AI Studio interface.

## Validation evidence

- GitHub CI workflow added to the integration branch (typecheck, build, tracked-runtime-env guard).
- Workflow run result: NOT YET VERIFIED in this document.
- Actual browser tests: NOT RUN.
- Supabase database changes: NONE.
- Old repository changes: NONE.
- Production deployment: NONE.
