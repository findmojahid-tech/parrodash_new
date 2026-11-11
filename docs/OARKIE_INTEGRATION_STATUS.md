# Oarkie integration — foundation

Target frontend: **parrodash_new** (React + Vite + Tailwind).
Source of real business behavior: **existing ParroDash** (Supabase backend).

## Verified from source
- Current parrodash_new App.tsx initializes task and document data from initialData and persists it in browser localStorage.
- Current AI Studio UI contains List, Board, Calendar, Gantt, Table, Docs, Whiteboard, Time Tracker and Command Palette.
- Existing ParroDash includes employee privacy and document flows with RLS dependencies and coordinated migrations. These must be preserved.

## First integration commit
- Adds a lazily created Supabase browser client using environment variables.
- Adds a typed authentication adapter for existing Supabase Auth identities.
- Does **not** replace the AI Studio UI, overwrite fake task data, migrate data, or enable production authentication.
- Does **not** alter the old ParroDash repo, Supabase, Vercel production, or Oarkie marketing website.

## Required next integration gates
1. Inventory existing ParroDash routes, tables, roles, RLS policies and current deploy SHA.
2. Confirm compatibility of existing Auth redirect configuration and invitation/employee approval flows.
3. Wire a login screen to the adapter, protected route, and server-authorized profile; test real accounts.
4. Replace task localStorage reads/writes with tenant-scoped Supabase repositories after schema/RLS verification. Never merge mock tasks into production data.
5. Port HR, CRM, Calendar, messaging and approvals module by module.
6. Only after isolation testing, implement self-service multi-tenant onboarding and billing.

## Security
The Supabase anon key is a public browser key, not a bypass. Proper RLS is mandatory.
Never use a service-role key in a browser bundle. No workspace identity or role is trusted
from localStorage. Do not deploy this branch as a production replacement until complete
end-to-end tests pass.

## Validation
This branch introduces integration infrastructure but no connected screen yet.
Static source inspection only; build, login, real-account flow and browser QA pending.
