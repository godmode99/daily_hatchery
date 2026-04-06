# Testing Strategy

## 1. Purpose

This document defines the testing approach for the hatchery web platform.

It translates high-risk business and technical requirements into executable tests,
quality gates, and release confidence criteria.

## 2. Testing Goals

1. Prevent permission and data-leak regressions
2. Guarantee worker daily-flow correctness (token, key, expiry)
3. Keep reporting/export numbers consistent across modules
4. Ensure scheduler jobs are reliable and idempotent
5. Validate sensor/automation safety and traceability

## 3. Quality Gates

A release candidate can proceed only if all gates pass:

- **Gate A: Security/Access**
  - Admin routes protected
  - Owner-only actions enforced
  - Worker write actions blocked after expiry
- **Gate B: Data Isolation**
  - REAL and DEMO data cannot mix in public or admin reports unless intentionally selected
- **Gate C: Operational Integrity**
  - CRUD and soft-delete behavior validated for all worker categories
- **Gate D: Scheduler Integrity**
  - No duplicate daily link generation
  - No duplicate daily summary sends
- **Gate E: Reporting Consistency**
  - Dashboard totals = report totals = export totals for same filter set

## 4. Test Pyramid

## 4.1 Unit Tests

Scope:
- calculation formulas
- date window and timezone logic
- permission helper functions
- report aggregation primitives
- automation rule matching

Minimum expectation:
- deterministic outputs for representative and edge-case inputs

## 4.2 Integration Tests

Scope:
- auth + approval + role enforcement
- worker verification and CRUD flows
- Telegram side effects after successful DB writes
- scheduler jobs with idempotency and retry behavior
- export generation jobs and status transitions

Minimum expectation:
- critical flows validated against a test database

## 4.3 End-to-End Tests

Scope:
- worker daily journey from token landing to entry submission
- owner approves head and head accesses admin modules
- admin reporting and exports over date ranges
- public showcase demo-only behavior
- sensor ingestion to automation chain

Minimum expectation:
- top 10 business-critical paths automated

## 5. Test Environment Matrix

| Environment | Purpose | Data Mode | Frequency |
|---|---|---|---|
| Local Dev | feature validation | synthetic | per commit |
| CI | merge gate | synthetic + seeded fixtures | every PR |
| Staging | pre-release confidence | production-like masked data | daily/nightly |
| Production Smoke | post-deploy sanity | real | every deployment |

## 6. Critical Scenario Checklist

## 6.1 Access and Identity

- [ ] Public user denied from `/admin/*`
- [ ] Pending head denied from protected admin actions
- [ ] Owner can approve/reject head account
- [ ] Disabled head loses access immediately

## 6.2 Worker Daily Flow

- [ ] Valid daily token routes to verification
- [ ] Invalid/expired token routes to expired page
- [ ] Valid worker key unlocks operational actions
- [ ] Invalid key attempt logged
- [ ] Create/update/delete blocked after expiry window

## 6.3 Operational CRUD

- [ ] Food create/update/soft-delete works
- [ ] Growout create/update/soft-delete works
- [ ] Nursery create/update/soft-delete works
- [ ] Water-prep create/update/soft-delete works
- [ ] Actor metadata and timestamps recorded on all writes

## 6.4 Telegram and Notifications

- [ ] Room 2 messages sent for create/update/delete
- [ ] Message failures are logged and visible
- [ ] DB writes are not rolled back due to Telegram failure

## 6.5 Reporting and Export

- [ ] Dashboard and report totals match
- [ ] CSV totals match report totals
- [ ] Excel totals match report totals
- [ ] PDF totals match report totals
- [ ] includeDeleted filter behavior verified

## 6.6 Scheduler and Timezone

- [ ] 09:00 Asia/Bangkok link generation job runs once
- [ ] Previous daily link expires before new cycle
- [ ] 18:00 daily summary job runs once
- [ ] Duplicate execution attempts are suppressed

## 6.7 Sensor and Automation

- [ ] Sensor ingestion accepts valid payloads
- [ ] Invalid payloads rejected with explicit errors
- [ ] Time-based automation command trace exists
- [ ] Threshold-based automation command trace exists
- [ ] Cooldown/duplicate protection verified

## 7. Non-Functional Test Areas

- Performance baseline for dashboard/report queries
- Export generation stress tests for large date ranges
- Reliability tests for scheduler retry and recovery
- Audit-log completeness checks for sensitive actions

## 8. CI Test Stages (Suggested)

1. **Static checks**: lint, type check
2. **Unit tests**: fast deterministic suites
3. **Integration tests**: DB-backed critical flows
4. **E2E smoke**: core paths only
5. **Artifact checks**: export and report snapshot assertions

## 9. Defect Severity Policy

- **Severity 1 (Blocker):** permission leak, data leak, wrong financial/operational totals, broken scheduler idempotency
- **Severity 2 (High):** critical flow failure with workaround
- **Severity 3 (Medium):** non-critical behavior deviation
- **Severity 4 (Low):** UI/copy issues without workflow impact

Release rule:
- No open Severity 1 defects
- Severity 2 defects require explicit owner + ETA + approved exception

## 10. Ownership and Reporting

- QA owns test execution report per sprint
- BE/FE own defect fixes in their modules
- TL owns go/no-go recommendation with QA and OPS sign-off

Weekly report should include:
- pass/fail summary by gate
- top regressions
- flaky test list
- unresolved risks
- release readiness status
