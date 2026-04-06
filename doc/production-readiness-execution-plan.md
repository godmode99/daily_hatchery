# Production Readiness Execution Plan

## 1. Purpose

This document consolidates all existing documentation into an **execution-grade plan** that can be used immediately by engineering, QA, and operations to deliver the hatchery platform safely to production.

It turns strategy into concrete delivery controls:
- decision freeze checklist
- environment and secrets readiness
- CI/CD and release gates
- observability and incident response
- security and compliance baseline
- cutover and post-go-live stabilization

## 2. Source Documents Mapped

This plan is derived from and must stay consistent with:
- business scope and feature behavior (`hatchery_business_feature_spec.md`)
- architecture direction (`technical-design-overview.md`)
- route and interaction behavior (`page-flow.md`)
- data model and ORM (`database-schema.md`, `prisma-orm-model-draft.md`, `schema.prisma`)
- API boundaries (`api-server-action-spec.md`)
- permissions (`permission-matrix.md`)
- scheduler and automation rules (`scheduler-automation-spec.md`)
- reporting and exports (`export-reporting-spec.md`)
- build order and sprint planning (`implementation-plan-build-order.md`, `task-breakdown-sprint-backlog.md`)
- quality gates (`testing-strategy.md`)

## 3. Pre-Implementation Decision Freeze (Must Close Before Sprint Execution)

The following decisions must be frozen in writing before Sprint 1 implementation starts:

### 3.1 Product and Scope
- [ ] Confirm MVP scope for first production release (what is in / out)
- [ ] Confirm languages for release (Thai-only or bilingual)
- [ ] Confirm whether customer showcase ships in release 1 or release 2

### 3.2 Security and Identity
- [ ] Confirm Google OAuth project(s): dev/stage/prod
- [ ] Confirm owner bootstrap account and recovery procedure
- [ ] Confirm session timeout policy for admin users
- [ ] Confirm IP allowlist policy (if any) for admin routes

### 3.3 Data Governance
- [ ] Confirm data retention for operational and audit logs
- [ ] Confirm soft-delete retention and restore procedure
- [ ] Confirm backup retention (daily/weekly/monthly)

### 3.4 Integrations
- [ ] Confirm Telegram bot/token lifecycle and secret rotation owner
- [ ] Confirm sensor ingestion trust model (shared secret, HMAC, mTLS)
- [ ] Confirm actuator command safety policy and manual override ownership

## 4. Environment Strategy

## 4.1 Required Environments
| Environment | Purpose | Data | Deploy Rule |
|---|---|---|---|
| Local | feature development | synthetic | engineer-triggered |
| CI ephemeral | PR validation | seeded fixtures | every PR |
| Staging | pre-production validation | masked/synthetic production-like | every merge to main |
| Production | live hatchery operation | real | controlled release only |

## 4.2 Mandatory Environment Variables (Minimum Set)
- `DATABASE_URL`
- `DIRECT_URL` (if ORM migration tooling requires)
- `NEXTAUTH_URL` / auth base URL
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ROOM_1_CHAT_ID`
- `TELEGRAM_ROOM_2_CHAT_ID`
- `TELEGRAM_ROOM_3_CHAT_ID`
- `APP_BASE_URL`
- `SCHEDULER_SIGNING_SECRET`
- `SENSOR_INGEST_SHARED_SECRET`
- `EXPORT_STORAGE_BUCKET` (if file storage is external)
- `EXPORT_STORAGE_REGION`
- `LOG_LEVEL`
- `SENTRY_DSN` (or chosen APM/monitoring DSN)

## 4.3 Secret Management Rules
- No plaintext secrets in repository.
- All production secrets must be managed through platform secret manager.
- Secret rotation runbook must exist for OAuth and Telegram.
- Rotation drill must be executed at least once before go-live.

## 5. CI/CD Definition (Required Before Production)

## 5.1 Pull Request Pipeline
1. lint
2. type check
3. unit tests
4. integration tests (DB-backed)
5. migration diff validation
6. Prisma schema validation
7. build (production profile)
8. e2e smoke (critical routes)

PR merge blocked unless all required checks pass.

## 5.2 Main Branch Deployment Pipeline
1. deploy staging
2. run staging smoke suite
3. run scheduler dry-run checks
4. approval gate (TL + QA + OPS)
5. deploy production
6. run production smoke + rollback decision checkpoint

## 5.3 Migration Safety
- Forward-only migration policy in production.
- Every destructive migration requires explicit sign-off and rollback narrative.
- Backfill scripts must be idempotent.

## 6. Operational Readiness Baseline

## 6.1 Observability
Minimum telemetry coverage:
- structured logs (JSON)
- request ID / trace ID propagation
- audit logs for privileged actions
- error tracking for API/server actions
- scheduler execution logs with run ID
- Telegram delivery logs with message type and result

### Required Dashboards
- API error rate and latency
- DB query latency and connection pool health
- scheduler success/failure counts
- Telegram success/failure by room
- export generation queue status

## 6.2 Alerting (Minimum)
- P1: production unavailable or auth broken
- P1: daily link generation fails at 09:00 Asia/Bangkok
- P1: data-write endpoint sustained 5xx errors
- P2: daily summary send failure at 18:00 Asia/Bangkok
- P2: export generation error spike
- P2: sensor ingestion rejection spike

## 6.3 Backup and Recovery
- Automated daily backup with restore verification schedule.
- Restore drill in staging at least once before go-live.
- RPO/RTO targets documented and approved by owner.

## 7. Security Hardening Checklist

- [ ] HTTPS enforced in all environments except localhost
- [ ] Strict transport security configured
- [ ] CSRF protection on sensitive form actions
- [ ] Rate limiting on public verification and ingestion endpoints
- [ ] Input validation with explicit error contracts
- [ ] Authorization middleware on all admin endpoints
- [ ] SQL injection protections verified via ORM usage + tests
- [ ] Output escaping/XSS protections verified in UI
- [ ] Security headers baseline (CSP, X-Frame-Options, etc.)

## 8. Release Readiness Gates (Go/No-Go)

A release is **Go** only when all gates pass:

### Gate A — Functional Core
- worker token flow works end-to-end
- key verification and expiry lock enforced
- CRUD and soft-delete working for all 4 operational categories

### Gate B — Permission and Isolation
- permission matrix verified by automated tests
- REAL/DEMO separation verified in all dashboards/reports/exports/public routes

### Gate C — Scheduler and Notification Reliability
- daily 09:00 job idempotent
- daily 18:00 summary job idempotent
- Telegram failure handling logged and observable

### Gate D — Reporting Integrity
- dashboard = report = export totals for identical filters
- includeDeleted logic verified for admin-only contexts

### Gate E — Operability
- dashboards and alerts configured
- on-call rota defined
- incident runbooks available
- backup restore drill passed

## 9. Runbooks Required Before Production

1. **Daily Link Failure Runbook**
   - detect failure
   - regenerate safely
   - notify operations and workers
2. **Telegram Degradation Runbook**
   - queue/retry strategy
   - fallback communication process
3. **Database Incident Runbook**
   - connection exhaustion mitigation
   - failover/restore flow
4. **Auth/OAuth Incident Runbook**
   - invalid callback / consent issues
   - emergency admin access path
5. **Rollback Runbook**
   - app rollback
   - migration contingency
   - post-rollback verification

## 10. 6-Week Production Execution Calendar (Suggested)

### Week 1
- lock architecture, schema v1, environment/secrets baseline
- complete sprint 0/1 items

### Week 2
- complete auth/approval and permission foundations
- establish CI pipeline required checks

### Week 3
- complete worker entry gate + core CRUD
- add Telegram room 2 notification flows

### Week 4
- complete admin configuration modules and reports query layer
- stabilize reporting correctness tests

### Week 5
- complete scheduler jobs, idempotency, retry, and logs
- complete export generation and artifact validation

### Week 6
- hardening, load and recovery tests, staging rehearsal, go-live review

## 11. Ownership Model

- **Tech Lead**: architecture integrity, release decision package
- **Backend**: API contracts, scheduler, data integrity, migrations
- **Frontend**: route flows, guard behavior, UX reliability
- **QA**: gate evidence, regression suites, traceability matrix
- **Ops**: CI/CD, secrets, observability, backup/restore, incident ops
- **Product/Owner**: scope freeze, acceptance, go-live sign-off

## 12. Documentation Completion Definition

Documentation is considered production-ready only when:
- each major module has explicit acceptance criteria
- each critical workflow has an owner
- each external integration has credential and failure policy
- each release gate has evidence source (test suite/report/dashboard)
- runbooks exist and have been test-executed at least once

## 13. Immediate Next Actions (This Week)

1. Freeze outstanding decisions in Section 3.
2. Create `.env.example` from Section 4.2 and verify with boot script.
3. Implement mandatory CI checks in Section 5.1.
4. Add observability baseline in Section 6.1 with at least one dashboard.
5. Execute first restore drill in staging and record outcome.
6. Start Sprint 0/1 tasks only after steps 1–4 are complete.
