# Task Breakdown / Sprint Backlog

## 1. Purpose

This document converts the high-level implementation phases into an execution-ready sprint backlog.

It adds the missing operational planning pieces:
- sprint structure
- owner assignment model
- Definition of Ready (DoR)
- Definition of Done (DoD)
- acceptance criteria per workstream
- release gates and dependencies

## 2. Planning Assumptions

- Sprint length: **1 week**
- Cadence: **Mon–Fri delivery**, with sprint review at end of week
- Priority: production-safe foundations before visual polish
- Build order follows the existing implementation plan and dependency map
- Production gate model follows `production-readiness-execution-plan.md`

## 3. Team Role Placeholders

Replace placeholders with real names.

- **TL** = Tech Lead / Architect
- **BE** = Backend Engineer
- **FE** = Frontend Engineer
- **FS** = Fullstack Engineer
- **QA** = QA Engineer
- **OPS** = DevOps / Platform

## 4. Definition of Ready (DoR)

A task is Ready only if:
1. Scope is bounded (clear in/out)
2. Dependency tasks are completed
3. Acceptance criteria are listed
4. Security/permission impact is identified
5. Required schema or API contract is specified
6. Test approach is specified (unit/integration/e2e)

## 5. Definition of Done (DoD)

A task is Done only if:
1. Code merged to main branch
2. Required tests implemented and passing
3. Logging/audit behavior implemented for sensitive actions
4. Role/mode restrictions validated
5. Documentation updated (if behavior or contract changed)
6. Known risks and follow-ups tracked

## 6. Sprint Plan (Execution Order)

## Sprint 0 — Foundation Setup

### Goal
Lock project skeleton, environment model, and deployment baseline.

### Work items
- [ ] Initialize Next.js app shell and route groups (`public`, `entry`, `admin`, `api`) — **FS**
- [ ] Set up database connection and migration workflow — **BE**
- [ ] Define `.env` contract for local/stage/prod — **OPS**
- [ ] Create shared services skeleton (`auth`, `permissions`, `reports`, `scheduler`, `telegram`, `automation`) — **FS**
- [ ] First deployment smoke check in target environment — **OPS**

### Acceptance criteria
- App boots locally and in target deployment
- Migration command runs cleanly on empty database
- Route groups exist and are reachable
- Environment variable template documented

### Dependencies
- None

---

## Sprint 0.5 — Release Engineering Baseline (New)

### Goal
Establish non-functional controls early so feature work can ship safely.

### Work items
- [ ] Define `.env.example` and secret ownership map — **OPS/BE**
- [ ] Implement required CI checks (lint/type/unit/integration/build) — **OPS/BE**
- [ ] Create base observability dashboards + alert routes — **OPS**
- [ ] Write daily-link failure runbook and rollback runbook — **OPS/TL**
- [ ] Execute first staging backup/restore drill — **OPS**

### Acceptance criteria
- CI required checks are enforced on PR merge
- Alert channels tested and acknowledged by owners
- Restore drill report published and approved
- Runbooks are reviewed by TL + QA

### Dependencies
- Sprint 0 complete

---

## Sprint 1 — Schema + Seed Baseline

### Goal
Ship initial production-safe schema and deterministic seed process.

### Work items
- [ ] Implement initial schema models and migration — **BE**
- [ ] Seed owner account and lookup data — **BE**
- [ ] Seed Telegram room destinations and initial settings — **BE**
- [ ] Add schema sanity tests — **QA/BE**

### Acceptance criteria
- DB can be migrated from zero state
- Seed can run repeatedly without corruption
- Owner account exists after seed
- Lookup tables are queryable from API/service layer

### Dependencies
- Sprint 0 complete

---

## Sprint 2 — Auth + Access Control Foundation

### Goal
Enforce identity and authorization boundaries before feature expansion.

### Work items
- [ ] Integrate Google sign-in for admin users — **BE/FS**
- [ ] Implement owner approval flow for head accounts — **BE/FE**
- [ ] Implement account states (`pending`, `approved`, `disabled`, `rejected`) — **BE**
- [ ] Add permission helpers and route guards — **BE**
- [ ] Implement worker key verification foundation utilities — **BE**

### Acceptance criteria
- Owner can sign in and approve a pending head
- Pending head cannot access protected admin routes
- Public users cannot access admin routes
- Permission helper APIs reusable by later modules

### Dependencies
- Sprint 1 complete

---

## Sprint 3 — Worker Entry Gate

### Goal
Enable daily-link and key-verification gate with expiry behavior.

### Work items
- [ ] Build `/entry/[dailyToken]` landing + validation — **FE/BE**
- [ ] Build `/entry/[dailyToken]/verify` + key submission flow — **FE/BE**
- [ ] Build expired state screen and redirect logic — **FE/BE**
- [ ] Log verification attempts and outcomes — **BE**

### Acceptance criteria
- Valid token reaches verification path
- Invalid/expired token lands on expired page
- Valid worker key opens worker “today” shell
- Failed attempts are logged

### Dependencies
- Sprint 2 complete

---

## Sprint 4 — Core Operational CRUD (Food/Growout/Nursery/Water Prep)

### Goal
Ship the operational core for worker daily data entry.

### Work items
- [ ] Implement create/update/soft-delete flows for all 4 categories — **BE/FE**
- [ ] Build worker “today” list and aggregation shell — **FE/BE**
- [ ] Enforce expiry lock for write actions — **BE**
- [ ] Ensure actor metadata stored in all writes — **BE**

### Acceptance criteria
- Worker can create/update/delete records during active window
- Write operations are blocked when window expires
- Soft delete flags are applied and auditable

### Dependencies
- Sprint 3 complete

---

## Sprint 5 — Telegram Operational Integration

### Goal
Integrate Telegram notifications and message logging.

### Work items
- [ ] Implement Telegram client abstraction + retries — **BE**
- [ ] Implement room 1/2 formatter templates — **BE**
- [ ] Trigger room 2 sends on create/update/delete success — **BE**
- [ ] Persist delivery logs and failure details — **BE**

### Acceptance criteria
- Activity events send correct Telegram messages
- Delivery failures logged without rolling back successful DB writes
- Message format is consistent across event types

### Dependencies
- Sprint 4 complete

---

## Sprint 6 — Admin Configuration Modules

### Goal
Enable admin management of core configuration.

### Work items
- [ ] `/admin/people` — **FE/BE**
- [ ] `/admin/keys` — **FE/BE**
- [ ] `/admin/dropdowns` — **FE/BE**
- [ ] `/admin/calculations` — **FE/BE**
- [ ] `/admin/tasks` — **FE/BE**

### Acceptance criteria
- Approved heads can manage all intended config
- Owner-only actions are correctly restricted
- Changes do not break historical record interpretation

### Dependencies
- Sprint 2 complete
- Sprint 4 recommended

---

## Sprint 7 — Admin Dashboard + Reporting Query Layer

### Goal
Provide accurate admin insights and reusable reporting queries.

### Work items
- [ ] Build `/admin/dashboard` summary views — **FE/BE**
- [ ] Build `/admin/reports` with filters — **FE/BE**
- [ ] Implement shared reporting service for dashboard/report/export — **BE**
- [ ] Enforce explicit REAL/DEMO mode filtering — **BE**

### Acceptance criteria
- Dashboard and reports are numerically consistent
- Deleted-item filtering works as specified
- REAL and DEMO data cannot mix by default

### Dependencies
- Sprint 4 complete

---

## Sprint 8 — Scheduler Jobs

### Goal
Automate daily link and daily summary operations.

### Work items
- [ ] Implement 09:00 Asia/Bangkok daily link generation + previous expiry — **BE**
- [ ] Implement 18:00 Asia/Bangkok daily summary send — **BE**
- [ ] Add idempotency guards and run logs — **BE**
- [ ] Validate production scheduler runtime behavior — **OPS/BE**

### Acceptance criteria
- Exactly one active worker link per cycle
- Duplicate scheduler sends are prevented
- Failures are observable in logs/alerts

### Dependencies
- Sprint 5 and Sprint 7 complete

---

## Sprint 9 — Export Generation

### Goal
Provide CSV/Excel/PDF exports from the reporting source of truth.

### Work items
- [ ] Build `/admin/export` request UX — **FE**
- [ ] Implement export job persistence and status tracking — **BE**
- [ ] Implement CSV, Excel, PDF renderers — **BE**
- [ ] Validate export correctness against report totals — **QA/BE**

### Acceptance criteria
- Exports support required date filters and includeDeleted behavior
- Export totals match dashboard/report shared queries
- Large-range exports complete with clear status

### Dependencies
- Sprint 7 complete

---

## Sprint 10 — Sensor Ingestion + Monitoring

### Goal
Add sensor ingestion pipeline and visibility.

### Work items
- [ ] Sensor CRUD screens and API — **FE/BE**
- [ ] `/api/sensors/ingest` validation and persistence — **BE**
- [ ] Admin sensor views for latest + history — **FE/BE**

### Acceptance criteria
- Devices can post sensor payloads reliably
- Invalid payloads rejected with clear errors
- Admin can view sensor latest and trend history

### Dependencies
- Sprint 6 complete

---

## Sprint 11 — Actuators + Automation Rules

### Goal
Enable manual control and rule-driven automation.

### Work items
- [ ] Actuator CRUD and manual commands — **FE/BE**
- [ ] Rule management UI for time/sensor thresholds — **FE/BE**
- [ ] Rule engine execution with cooldown + duplicate prevention — **BE**
- [ ] Command/rule execution auditing — **BE**

### Acceptance criteria
- Manual commands are traceable and restricted
- Time-based and threshold-based rules execute predictably
- Duplicate command protection is verified

### Dependencies
- Sprint 8 and Sprint 10 complete

---

## Sprint 12 — Showcase / Demo Layer

### Goal
Ship external-facing demo pages with strict data isolation.

### Work items
- [ ] Build public showcase pages and bilingual content — **FE**
- [ ] Build demo dashboard/reports/control-preview pages — **FE/BE**
- [ ] Implement demo-only query layer and masking rules — **BE**

### Acceptance criteria
- Public pages expose demo data only
- No route leaks real operational data
- Thai/English content switching works consistently

### Dependencies
- Sprint 7 complete

---

## Sprint 13 — Hardening + Production Readiness

### Goal
Stabilize permission boundaries, reliability, and release confidence.

### Work items
- [ ] Permission penetration tests — **QA/BE**
- [ ] Timezone and expiry consistency tests — **QA/BE**
- [ ] Scheduler resilience and failure recovery checks — **QA/BE/OPS**
- [ ] Monitoring + alerts baseline — **OPS**
- [ ] Release checklist and go-live review — **TL/QA/OPS**

### Acceptance criteria
- No critical permission or data-mode leaks
- No unresolved scheduler duplication issue
- Known failure modes documented and alertable

### Dependencies
- Prior sprints complete

## 7. Cross-Sprint Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|---|---|---:|---|---|
| REAL/DEMO leakage | High | Medium | Enforce mode filter in shared query layer + tests | BE/QA |
| Worker expiry bypass | High | Medium | Server-side window checks for all writes | BE |
| Scheduler duplicate sends | High | Medium | Idempotency keys + lock strategy + monitoring | BE/OPS |
| Telegram delivery instability | Medium | Medium | Retry + dead-letter logging + dashboards | BE |
| Formula regression after config changes | Medium | Medium | Versioned settings and backward-safe calculations | BE/QA |

## 8. Weekly Planning Template

Use this template for each weekly sprint planning meeting.

- **Sprint name:**
- **Goal:**
- **Committed scope:**
- **Non-goals:**
- **Dependencies checked:**
- **Risks identified:**
- **Owners assigned:**
- **Review date:**
- **Release gate:**
