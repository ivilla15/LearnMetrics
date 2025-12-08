Purpose
Provide brief, actionable guidance so AI-assisted coding agents are immediately productive in this repository.

Big Picture

- **Framework:** Next.js (App Router) full-stack app; server and API routes live under `app/api/*` and pages/layouts under `app/`.
- **Layers:** `app/api` (HTTP handlers) → `validation/*` (Zod schemas) → `core/*` (business services, return DTOs) → `data/*` (Prisma-powered repos) → `prisma/schema.prisma` (DB model).
- **Data flow example:** `app/api/assignments/create-friday/route.ts` parses+validates request → calls `core/assignments/service.createFridayAssignment` → uses `data/assignments.repo` (Prisma) → persists to DB. Preserve this end-to-end shape when modifying behavior.

Key Files & Conventions

- **API handlers:** `app/api/**/route.ts` — keep handlers thin: validate using `validation/*.schema.ts`, call `core/*` services, and return `jsonResponse`/`errorResponse` from `utils/http`.
- **Business logic:** `core/*` exports functions and DTO types (e.g., `AssignmentDTO`). Maintain stable return shapes used by Next.js handlers and UI components.
- **Data layer:** `data/*.repo.ts` uses a single `prisma` client (`data/prisma.ts`). Respect DB constraints in `prisma/schema.prisma` (composite unique keys like `@@unique([classroomId, kind, opensAt])`).
- **Validation:** `validation/*.schema.ts` uses `zod`. Handlers treat `ZodError` as a 400 input error.
- **Timezone handling:** Time utilities live in `utils/time.ts` and conversions to UTC + readable local strings are important (see `core/assignments/service.ts`). Prefer using the existing helpers.

Developer Workflows (discoverable)

- Install & run (preferred):

```bash
pnpm install
pnpm dev      # runs `next dev`
pnpm build
pnpm start
```

- Lint/type/format:

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm format
```

- Tests: there is no `test` script defined in `package.json`. There are unit/integration files under `tests/`; ask the maintainers for the preferred runner or add a test script before running tests.

Project-specific Patterns

- **Idempotency by composite unique keys:** Repos often check uniqueness by composite indexes (see `findByClassroomKindAndOpensAt` in `data/assignments.repo.ts`). Keep these checks when creating records.
- **DTO-first services:** `core/*` returns plain JS objects (DTOs) with stable fields (e.g., `opensAt` ISO strings). When changing DTO shapes, update any consumers (API handlers + UI components).
- **Error mapping:** API handlers map `ZodError` → 400 and fallback errors → 500. Preserve this mapping for consistent client behavior.
- **No heavy side-effects in handlers:** Side effects (emails, jobs) should live in `core/*` or be extracted to separate services; handlers orchestrate only.

Integration Points & Dependencies

- **Database:** Prisma (`prisma/schema.prisma`) backed by PostgreSQL; env var `POSTGRES_URL` required. Use `prisma` CLI (package.json devDependency) to generate/update client.
- **Auth:** NextAuth configured under `app/api/auth/[...nextauth]/route.ts` (check `auth.ts` / `auth.config.ts` for provider details).
- **Third-party libs:** `zod` (validation), `date-fns`/`date-fns-tz` (time), `@prisma/client` (DB), Tailwind for UI.

If You Need To Modify or Add Endpoints

- Follow the path: `app/api/<route>` → `validation/<schema>.ts` → `core/<service>.ts` → `data/<repo>.ts`. Add tests under `tests/unit` or `tests/integration` mirroring existing patterns.
- Update `prisma/schema.prisma` for DB changes and run `pnpm prisma migrate` (or the project's preferred migration workflow). Ensure composite keys and indexes are represented correctly.

Questions / Unknowns To Clarify

- The repo has `tests/` but no `test` script or test runner dependency in `package.json` — ask which test runner (Jest, Vitest, etc.) to use.

How to proceed when AI suggests changes

- Keep PRs small and focused. For backend changes, include a short integration test under `tests/integration` that hits the new/changed API route.
- Prefer editing `core/*` for behavior changes rather than modifying handlers directly. Update `validation/*` first if input shapes change.

Contact

- Ask me to expand any section, add a sample PR checklist, or wire up a `test` script once you confirm the test runner.
