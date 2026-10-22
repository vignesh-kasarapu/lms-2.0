# LMS 2.0 API

Leave Management System backend — FastAPI, SQLAlchemy 2.0, Alembic, MySQL.

A rewrite of the Node/Express/Sequelize service in `../backend`, built to the same
API contract so it can serve the existing React web client and a React Native
client without client-side changes. `../MIGRATION_PLAN.md` holds the full
migration plan.

---

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Seed data](#seed-data)
- [Architecture](#architecture)
- [API surface](#api-surface)
- [Database migrations](#database-migrations)
- [Scheduled jobs](#scheduled-jobs)
- [Testing](#testing)
- [Known limitations](#known-limitations)

---

## Requirements

| Component | Version |
|---|---|
| Python | 3.12 (3.14 has no prebuilt `pydantic-core` wheel) |
| MySQL | 8.0 |
| Node.js | 20+ (frontend only) |

---

## Quick start

### Local

```bash
cd backend-py
python -m venv .venv
source .venv/Scripts/activate    # Windows Git Bash; .venv/bin/activate elsewhere
pip install -r requirements.txt

cp .env.example .env             # then set DB_PASSWORD and the Entra values
python -m app.core.bootstrap_db  # creates the database if absent, runs migrations
python -m uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/health`

### Both services together

From the repository root:

```bash
npm run install:all
npm run dev     # backend-py on :8000, frontend on :5173
```

### Docker

The root `docker-compose.yml` defines a `backend-py` service on port 8000,
sharing the `mysql` container with the Node backend but using its own schema
(`lms_2_0_py`). The two backends never share tables.

```bash
docker compose up --build backend-py
```

---

## Configuration

All settings load from `.env` via `app/core/config.py`. Copy `.env.example` and
fill in the blanks.

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection. `DB_NAME` must differ from the Node backend's schema. |
| `SESSION_JWT_SECRET` | Signing key for session tokens. Replace the placeholder before any deployment. |
| `SESSION_COOKIE_NAME` | Cookie carrying the web session token. |
| `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_REDIRECT_URI` | Microsoft Entra ID confidential client, used by the web sign-in flow. |
| `ENTRA_MOBILE_CLIENT_ID`, `ENTRA_MOBILE_REDIRECT_URI` | Separate public-client registration for the mobile PKCE flow. |
| `DEV_AUTH_BYPASS_ENABLED`, `DEV_AUTH_BYPASS_EMPLOYEE_CODE` | Development only. Signs every request in as the named employee. Must be `false` outside local development. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `SMTP_FROM_ADDRESS` | Outbound SMTP. Sends are synchronous and best-effort; a failure is logged, never raised. |
| `DEFAULT_TIMEZONE`, `DEFAULT_LEAVE_YEAR_START` | Organisation defaults. Scheduled jobs are pinned to `DEFAULT_TIMEZONE`. |

`.env` is git-ignored and must stay that way — it holds the Entra client secret
and SMTP credentials.

---

## Seed data

Run in order, or use `npm run seed` from the repository root.

| Script | Contents |
|---|---|
| `python -m scripts.seed` | Reference data: roles, management levels, the five organisation leave types with policies and accrual configs, the system `LOP` and `COMP_OFF` types, the current leave year, 26 notification templates, configuration defaults. |
| `python -m scripts.seed_employees` | Employee roster with reporting lines and role grants. |
| `python -m scripts.seed_demo` | Grades, regions, holidays, and a year of demo activity: leave requests, approvals, ledger entries, delegations and optional-holiday selections, for walkthroughs and manual testing. |

Sample CSVs for the bulk-import endpoint live in `scripts/sample-imports/`.

---

## Architecture

### Layering

```
routers/    HTTP only — parse, authorise, delegate. No business logic.
services/   Business rules. The only layer that decides anything.
dao/        The only layer holding a SQLAlchemy Session.
models/     ORM table definitions.
schemas/    Pydantic DTOs — what crosses every layer boundary.
```

A raw ORM instance never crosses a layer boundary. Files stay under roughly 250
lines, split by use-case rather than by size: see `services/leave_request/`
(`validation`, `gates`, `routing`, `preview`, `submission`, `decision`,
`cancellation`, `drafts`, `detail`) and the `leave_request_dao` /
`leave_request_query_dao` split between writes and read-heavy queries.

### Authentication

One token scheme, two transports. `get_current_user` and `require_role` accept
either a `lms_session` cookie (web) or an `Authorization: Bearer` header
(mobile), so every endpoint serves both clients unmodified.

| Endpoint | Flow |
|---|---|
| `GET /api/auth/config` | Reports which sign-in flows are enabled. |
| `GET /api/auth/login` → `GET /api/auth/callback` | Entra authorisation-code flow, sets the session cookie. |
| `POST /api/auth/mobile/token` | PKCE exchange, returns a bearer token. |
| `GET`/`POST /api/auth/dev-login` | Development bypass, browser and JSON variants. |
| `POST /api/auth/signout` | Clears the session. |

### Request casing

The Node service's wire format is not uniformly snake_case: most responses are
raw Sequelize dumps (snake_case), but several controllers hand-build camelCase
objects, and the React client was written against each endpoint's actual
casing. Two pieces preserve that contract:

- **`app/core/casing_middleware.py`** — raw ASGI middleware rewriting inbound
  camelCase query-string and JSON body keys to snake_case before routing.
  Idempotent on snake_case input. Skips `multipart/form-data`, keeping avatar,
  attachment and bulk-import uploads binary-safe.
- **`app/schemas/base.py`'s `CamelOut`** — applied to the handful of responses
  Node returns in camelCase: `GET /api/auth/config`, `POST /api/auth/signout`,
  the digest-preference pair, `GET /api/holidays/optional-summary`, and
  `GET /api/admin/holidays/optional-usage`.

---

## API surface

All routes are mounted under `/api`.

| Area | Routes |
|---|---|
| Authentication | `/auth/...` |
| Employees | `/employees` — directory, profile, avatar, roles, manager assignment, deactivation, bulk import |
| Dashboard and team views | `/employees/{dashboard,my-team,team-calendar,peer-calendar}` |
| Leave requests | `/leave-requests` — preview, submit, approve, reject, withdraw, cancel, drafts |
| Attachments | `/attachments` |
| Ledger | `/ledger` — per-employee, organisation-wide, manual adjustment |
| Delegation | `/delegations` |
| Notifications | `/notifications`, `/employees/me/digest-preference` |
| Reports | `/reports/{leave-taken,lop,balances,audit-log}` |
| Holidays | `/holidays`, optional-holiday selection and summary |
| Administration | `/admin/...` — departments, regions, grades, projects, leave types and policies, holidays, working patterns, notification templates, blackout periods, team capacity limits, self-approval permissions, carry-forward trigger |
| Calendar feed | `GET /calendar-feed/{token}.ics` — token-authenticated, no session required, so Outlook can poll it unattended |

### Access control

Three rules carry most of the risk and are worth knowing before changing any
read endpoint:

- A manager sees every report at any depth of the hierarchy (BR-39).
- The peer calendar shows colleagues under the same manager at the same
  management level, and never discloses the leave type (BR-41, NFR-14).
- An `employeeId` or `managerId` filter on a report can only narrow a manager's
  existing scope, never widen it (BR-40). `tests/test_reports.py` exists
  specifically to hold this line.

Request detail is scoped to one of three levels — `FULL` for the owner,
approver and HR, `WATCHER_MASKED` for watchers (reason and leave-type name
removed), `DENIED` for everyone else (NFR-13, BR-42).

---

## Database migrations

Models are the source of truth. After editing anything under `app/models/`:

```bash
alembic revision --autogenerate -m "describe the change"
# review the generated file in alembic/versions/ before committing it
alembic upgrade head
```

`alembic check` with no output confirms the models and the live schema agree.

---

## Scheduled jobs

`app/jobs/scheduler.py` runs an APScheduler `BackgroundScheduler`, started and
stopped by the FastAPI lifespan hook. Each job is wrapped in an in-memory
overlap guard that skips a tick while the previous run is still in flight.

| Job | Schedule | Behaviour |
|---|---|---|
| SLA sweep | every 15 min | Reminder band plus one-level escalation, terminating at the active HR queue (BR-33 to BR-36). |
| LOP conversion | daily 01:00 | Converts expired `REJECTED_PENDING_WITHDRAWAL` requests to `LOP_APPLIED`, idempotent per request (BR-18 to BR-20). |
| Daily digest | daily 08:00 | Bundles suppressed notification emails per opted-in recipient into one summary. |
| Periodic accrual | monthly, 1st at 02:00 | Keyed on period, leave type and employee; retry-safe. |
| Year-end rollover | daily 02:30 | Caps carried-over balance, lapses the excess, closes the year and opens the next. |

All five are pinned to `DEFAULT_TIMEZONE`. This is a deliberate difference from
the Node service, whose `node-cron` wiring runs on unpinned host-local time.

Carry-forward is also reachable on demand via
`POST /api/admin/carry-forward/trigger`.

---

## Testing

The test suite points at the database named in `DB_NAME`. Always override it, or
the run will overwrite your development data:

```bash
DB_NAME=lms_2_0_pytest python -m pytest -q
```

First run against a new database needs the schema and reference data:

```bash
DB_NAME=lms_2_0_pytest python -m alembic upgrade head
DB_NAME=lms_2_0_pytest python -m scripts.seed
```

| File | Covers |
|---|---|
| `test_auth.py` | Token round-trip, expiry, dev bypass, sign-out across both transports. |
| `test_employees.py` | Onboarding, circular reporting lines, self-service field allow-list, last-HR-admin guard. |
| `test_leave_requests.py` | Submit and approve with ledger write, overlap rejection, advance-leave rejection and withdrawal, drafts, detail scoping. |
| `test_review_fixes.py` | Per-request day cap, sick-leave certificate threshold, delegation date matching, entitlement edits, report exports. |
| `test_jobs.py` | SLA escalation, LOP conversion, accrual idempotency, carry-forward caps. |
| `test_phase5.py` | Bulk-import batch rollback, manager wiring across rows, optional-holiday quota. |
| `test_reports.py` | Manager scoping and the narrow-only filter rule. |
| `test_admin.py` | Departments, system leave-type lock, holiday overlap warning, working-pattern overlap, protected notification templates. |

Job tests mock the SMTP send and build isolated leave-year pairs, because
carry-forward unconditionally flips `is_current` and `is_closed` on whatever
pair it is given.

---

## Known limitations

- **Bulk import is not fully transactional.** Several DAOs commit rather than
  flush, so a circular-hierarchy failure found during the manager-wiring pass
  will not roll back employee rows committed earlier in the same batch. The
  validation pass catches cycles before any write, which covers the common
  case. Flagged in the module docstring.
- **Leave-type creation writes three rows without a transaction** (type, policy,
  accrual config), reproducing the same gap in the Node service.
- **Email is synchronous.** Jobs that notify many employees at once are slow
  against a large development database and can hit the provider's daily send
  limit. Every failure is caught and logged, so no business action is blocked.
- **The Entra flow has not been exercised against a live tenant.** The
  authorisation-code exchange and JWKS verification are implemented but need
  real `ENTRA_*` credentials to test end to end.
- **The outbound-casing audit is not provably complete.** It was done at
  controller level, which has a blind spot for camelCase objects built inside a
  service and passed through. One endpoint was missed on the first pass and
  found by reading service source directly. Treat the `CamelOut` list as known,
  not exhaustive.
- **The nginx upstream flip is not done.** `frontend/nginx.conf` still points at
  `backend:4000`. `MIGRATION_PLAN.md` §6 requires a side-by-side response diff
  across real flows before switching to `backend-py:8000`.
