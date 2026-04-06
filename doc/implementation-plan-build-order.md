# Implementation Plan / Build Order

## 1. Document Purpose

This document defines the recommended implementation plan, build order, milestone structure, and delivery sequence for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**
- the **Permission Matrix**
- the **API / Server Action Specification**
- the **Scheduler / Automation Specification**
- the **Export / Reporting Specification**

This document defines:
- implementation phases
- dependency order between modules
- production-oriented build sequence
- critical path items
- testing priorities
- rollout strategy
- practical engineering checkpoints

This document does **not** yet define:
- sprint calendars
- team staffing plans
- exact story-point estimation
- exact CI/CD workflow implementation
- source control branching policy

## 2. Build Strategy Goals

The system should be implemented in a sequence that:

1. reduces architectural rework
2. protects the highest-risk foundations first
3. makes core data-entry reliable before advanced features
4. keeps public/demo separation safe from the beginning
5. enables production readiness rather than prototype-only delivery
6. supports gradual internal rollout and validation

## 3. Core Build Principles

### 3.1 Build Foundations Before Features
Do not start with UI-first development only.

Build order should prioritize:
- data model
- auth/access model
- worker access validation
- core operational write flows
- reporting consistency
- scheduler reliability
- automation and sensor expansion later

### 3.2 One Source of Truth Per Layer
Implementation should maintain:
- database as source of truth for records
- server as source of truth for validation and permissions
- shared reporting logic for dashboard/export/Telegram summary

### 3.3 Protect Critical Boundaries Early
The most important boundaries must exist early in implementation:
- `REAL` vs `DEMO`
- worker vs admin
- owner approval vs approved head
- active worker link vs expired worker link
- manual control vs automation

### 3.4 Production-Oriented Increment Order
Even though the target is production-level, the engineering work should still be staged.

This means:
- build the safest critical path first
- then add admin tools
- then reporting/export
- then scheduler
- then sensor/control depth
- then polish and hardening

## 4. Critical Path Overview

The critical path for this system is:

1. project foundation
2. database schema and migrations
3. Google login + owner approval flow
4. worker daily link + key verification flow
5. core operational CRUD flows
6. Telegram room 1 and room 2 integration
7. admin configuration screens
8. dashboard/reporting queries
9. scheduler jobs for 09:00 and 18:00
10. sensor ingestion and automation
11. export generation
12. showcase and bilingual polish
13. production hardening

If any of the early items are weak, later modules will become a pain in the ass to refactor.

## 5. Recommended Build Phases

---

# Phase 0 — Project Setup & Foundations

## 5.0 Objective
Create the project skeleton and lock the base engineering structure.

## 5.0 Deliverables
- Next.js project scaffold
- environment variable layout
- database connection setup
- ORM setup
- base route groups
- shared library folders
- base type definitions
- basic coding conventions
- initial deployment target configuration

## 5.0 Main tasks
- initialize Next.js app
- set up Neon Postgres
- set up ORM and migration tooling
- define `.env` structure
- define route groups:
  - public/showcase
  - worker
  - admin
  - api/system
- create shared service folders:
  - auth
  - db
  - calculations
  - telegram
  - permissions
  - reports
  - scheduler
  - automation

## 5.0 Exit criteria
- app boots locally
- DB connection works
- migration flow works
- folder structure is locked
- deployment target is proven at least once

---

# Phase 1 — Database Schema & Seeds

## 5.1 Objective
Implement the first production schema and seed the minimum required records.

## 5.1 Deliverables
- initial migrations
- seed data
- owner seed account
- core lookup data
- schema test verification

## 5.1 Main tasks
- implement core tables from schema draft
- seed initial owner account:
  - `bestpratice168@gmail.com`
- seed initial lookup tables:
  - plankton types
  - grow-out locations
  - water preparation points
- seed initial Telegram destinations
- seed initial calculation defaults if known

## 5.1 Exit criteria
- migrations run cleanly
- seed script works repeatedly and safely
- owner record exists
- lookup tables are queryable
- basic CRUD sanity checks pass

## 5.1 Dependencies
- Phase 0 complete

---

# Phase 2 — Authentication, Access Control, and Permission Foundation

## 5.2 Objective
Implement the role/access foundation before feature pages start multiplying.

## 5.2 Deliverables
- Google login for heads/admins
- owner approval flow
- pending head flow
- permission helper layer
- route guards
- worker key verification foundation

## 5.2 Main tasks
- integrate Google auth
- implement `admin_accounts` flow
- create owner approval UI/action
- implement pending/approved/disabled logic
- build permission helpers for:
  - public
  - worker active window
  - approved head
  - owner
- create server-side worker key validation utilities

## 5.2 Exit criteria
- owner can sign in
- new head can sign in and remain pending
- owner can approve a head
- approved head can access admin routes
- public cannot access admin
- permission helpers usable by later modules

## 5.2 Dependencies
- Phase 1 complete

---

# Phase 3 — Worker Daily Link Flow

## 5.3 Objective
Implement the worker entry gate before operational CRUD pages.

## 5.3 Deliverables
- daily link landing
- daily token validation
- key verification API
- expired link screen
- worker today dashboard shell

## 5.3 Main tasks
- implement `/entry/[dailyToken]`
- implement `/entry/[dailyToken]/verify`
- implement expired handling
- create worker verification endpoint
- create worker dashboard shell page
- log verification attempts
- enforce active daily window checks

## 5.3 Exit criteria
- valid daily link reaches verification
- invalid/expired link goes to expired state
- valid worker key opens worker dashboard
- invalid key fails safely
- worker access logs are written

## 5.3 Dependencies
- Phase 2 complete

---

# Phase 4 — Core Operational Entry Flows

## 5.4 Objective
Deliver the real operational heart of the product.

## 5.4 Deliverables
- food create/update/delete
- grow-out create/update/delete
- nursery create/update/delete
- water-prep create/update/delete
- worker today dashboard list view
- soft delete behavior

## 5.4 Main tasks
- build food form and calculations
- build grow-out form with multi-location request handling
- build nursery form with repeated counts and calculations
- build water-prep form
- implement update flows
- implement soft delete flows
- implement today dashboard query layer
- ensure worker update/delete are blocked after expiry
- implement admin-side correction path later using the same record model

## 5.4 Exit criteria
- workers can create all 4 categories
- workers can edit/delete inside active window
- expired window blocks create/update/delete
- soft delete works
- all writes store actor metadata correctly

## 5.4 Dependencies
- Phase 3 complete

---

# Phase 5 — Telegram Room 1 and Room 2 Integration

## 5.5 Objective
Make operational activity visible and auditable in Telegram.

## 5.5 Deliverables
- daily link room 1 send
- create/edit/delete room 2 sends
- Telegram message log persistence
- formatting service layer

## 5.5 Main tasks
- implement Telegram service
- implement message formatter for:
  - daily worker link
  - create activity
  - edit activity
  - delete activity
- write Telegram message logs
- connect activity sends to operational DB success flows

## 5.5 Exit criteria
- create/edit/delete send room 2 messages
- daily link send service is callable
- failures are logged
- no DB write depends on Telegram success to remain committed

## 5.5 Dependencies
- Phase 4 complete for room 2
- daily-link scheduler can come later for room 1 automation, but send service should already exist here

---

# Phase 6 — Admin Management Modules

## 5.6 Objective
Give heads the ability to manage the system without database hand-editing bullshit.

## 5.6 Deliverables
- people management
- key management
- dropdown management
- calculation settings management
- forward task management

## 5.6 Main tasks
- build `/admin/people`
- build `/admin/keys`
- build `/admin/dropdowns`
- build `/admin/calculations`
- build `/admin/tasks`
- add validation and save flows
- surface update metadata
- ensure head-only / owner-only rules are enforced where needed

## 5.6 Exit criteria
- approved heads can fully manage operational config
- owner-only actions remain restricted
- settings changes do not break old historical records
- tasks can be created with reminder and worker visibility options

## 5.6 Dependencies
- Phase 2 complete
- Phase 1 seed/lookups useful
- Phase 4 done helps validate forms against real config

---

# Phase 7 — Admin Dashboards and Report Queries

## 5.7 Objective
Make the stored operational data truly usable for review and decision making.

## 5.7 Deliverables
- admin dashboard
- summary cards
- report preview queries
- date range filtering
- data mode filtering
- deleted filter support

## 5.7 Main tasks
- build `/admin/dashboard`
- build `/admin/reports`
- implement summary aggregations
- implement category-specific detail queries
- implement shared reporting query layer
- ensure `REAL` and `DEMO` separation is explicit

## 5.7 Exit criteria
- admin sees accurate summaries
- dashboard and report preview use shared reporting logic
- deleted records are handled according to filter rules
- demo and real data do not mix

## 5.7 Dependencies
- Phase 4 complete
- Phase 6 useful but not strictly blocked if dashboard comes slightly earlier

---

# Phase 8 — Scheduler Core Jobs

## 5.8 Objective
Automate the time-based parts that the business already depends on.

## 5.8 Deliverables
- daily link generation at 09:00
- previous link expiration
- room 1 send automation
- daily summary send at 18:00
- scheduler execution traceability

## 5.8 Main tasks
- implement `daily-link-generate`
- implement `daily-summary-send`
- implement idempotency guards
- implement logging and failure visibility
- ensure Bangkok timezone consistency
- validate deployment scheduler capability in production

## 5.8 Exit criteria
- only one active worker link exists per cycle
- old link expires correctly
- room 1 message is sent
- room 3 daily summary is sent
- duplicate sends are suppressed
- scheduler failures are visible

## 5.8 Dependencies
- Phase 5 Telegram service complete
- Phase 7 reporting logic complete enough for summary generation

---

# Phase 9 — Export Generation

## 5.9 Objective
Deliver Excel / CSV / PDF outputs for admin use.

## 5.9 Deliverables
- export request flow
- export job persistence
- Excel export
- CSV export
- PDF export
- download handling

## 5.9 Main tasks
- build `/admin/export`
- implement export filters
- build summary sheet + category sheets for Excel
- implement flat CSV exports
- implement clean table-based PDF
- persist export job status
- test large-range export handling

## 5.9 Exit criteria
- admin can export real data by date range
- includeDeleted works as specified
- demo export requires explicit selection
- exported numbers match dashboard/report logic

## 5.9 Dependencies
- Phase 7 complete

---

# Phase 10 — Sensor Ingestion and Monitoring

## 5.10 Objective
Introduce sensor data into the system using the initial HTTP ingestion model.

## 5.10 Deliverables
- sensor CRUD
- sensor ingest endpoint
- sensor reading persistence
- admin sensor dashboard

## 5.10 Main tasks
- build sensor definitions UI
- implement `/api/sensors/ingest`
- validate incoming payloads
- save readings
- build `/admin/sensors`
- show latest values and history view basics

## 5.10 Exit criteria
- sensor definitions are manageable by heads
- devices can post readings successfully
- readings are queryable and visible in admin UI

## 5.10 Dependencies
- Phase 6 admin config foundation
- Phase 2 permissions

---

# Phase 11 — Actuators and Automation Rules

## 5.11 Objective
Add real control and automation behavior on top of sensor data and schedules.

## 5.11 Deliverables
- actuator CRUD
- manual ON/OFF commands
- automation rules UI
- time-based rule execution
- sensor-threshold rule execution
- rule execution logs
- actuator command logs

## 5.11 Main tasks
- build `/admin/actuators`
- build `/admin/rules`
- implement manual command actions
- implement time-rule evaluation job
- implement sensor-threshold evaluation on ingestion
- implement cooldown/duplicate protection
- log command execution and rule execution

## 5.11 Exit criteria
- head can manually issue safe commands
- time-based rule can fire and be traced
- sensor-threshold rule can fire and be traced
- command history is auditable

## 5.11 Dependencies
- Phase 8 scheduler foundation
- Phase 10 sensor ingestion
- downstream actuator integration path at least stubbed

---

# Phase 12 — Showcase / Demo Layer

## 5.12 Objective
Build the customer-facing presentation layer safely on top of the operational product.

## 5.12 Deliverables
- bilingual showcase pages
- demo dashboard
- demo reports
- demo control preview
- demo data-only query layer

## 5.12 Main tasks
- build public routes
- implement Thai/English content layer
- create demo-mode data queries
- ensure no raw real data leakage
- polish visuals for showcase use

## 5.12 Exit criteria
- customer sees realistic system experience
- only demo data is exposed
- showcase and admin reporting remain clearly separated

## 5.12 Dependencies
- Phase 7 reporting logic helps a lot
- Phase 10/11 helpful for realistic control demo patterns

---

# Phase 13 — Hardening, QA, and Production Readiness

## 5.13 Objective
Stabilize the product for real operational use.

## 5.13 Deliverables
- validation hardening
- error handling polish
- audit trail checks
- permission penetration checks
- timezone correctness checks
- reporting consistency checks
- scheduler resilience checks
- production deployment checklist

## 5.13 Main tasks
- validate all permission boundaries
- verify worker expiry behavior
- verify head approval flow
- verify export correctness
- verify Telegram failure behavior
- verify duplicate suppression in scheduler jobs
- verify demo/real isolation
- add monitoring and operational alerts if available

## 5.13 Exit criteria
- no known critical permission leak
- no known real/demo leak
- no known scheduler duplicate issue
- operational flows are stable under realistic usage
- owner/admin flows are stable in production

## 5.13 Dependencies
- all major earlier phases

---

## 6. Recommended Milestone View

### Milestone A — Secure Foundation
Includes:
- Phase 0
- Phase 1
- Phase 2

Outcome:
- app foundation exists
- auth and access boundaries exist
- DB is ready

### Milestone B — Real Worker Operations
Includes:
- Phase 3
- Phase 4
- Phase 5

Outcome:
- workers can really use the system
- Telegram activity works
- operational data starts flowing

### Milestone C — Admin Control and Reporting
Includes:
- Phase 6
- Phase 7
- Phase 9

Outcome:
- heads can manage the system
- reports and exports work

### Milestone D — Scheduled Intelligence
Includes:
- Phase 8
- Phase 10
- Phase 11

Outcome:
- daily automation works
- sensor ingestion works
- actuator logic works

### Milestone E — Showcase and Production Hardening
Includes:
- Phase 12
- Phase 13

Outcome:
- product is presentable externally
- system is hardened for ongoing use

## 7. Dependency Summary

### Hard dependencies
- Auth before admin
- Daily link verification before worker CRUD
- Worker CRUD before accurate dashboards
- Reporting query layer before reliable exports and daily summary
- Telegram service before scheduled notifications
- Sensor ingestion before sensor-threshold automation
- Actuator command model before automation execution
- Demo data separation before showcase release

### Soft dependencies
- showcase can start visually earlier, but should not ship before demo/real safety is proven
- exports can start basic and improve later if reporting queries are already stable

## 8. Testing Priorities by Phase

## 8.1 Highest-Risk Areas
These areas deserve the earliest and strongest testing:

1. worker link expiry behavior
2. key verification correctness
3. owner approval flow
4. real vs demo separation
5. soft delete behavior
6. Telegram side effects after DB writes
7. daily summary accuracy
8. rule duplicate suppression
9. actuator command auditability

## 8.2 Suggested Test Types

### Unit tests
Best for:
- calculations
- due-task logic
- rule matching
- date/time window logic
- reporting aggregations

### Integration tests
Best for:
- auth + permission flows
- worker create/update/delete
- admin CRUD
- Telegram log side effects
- export generation
- scheduler idempotency

### End-to-end tests
Best for:
- worker daily entry journey
- head approval journey
- admin report/export journey
- sensor ingestion to automation chain
- showcase demo-only safety

## 9. Recommended Engineering Order Inside Each Module

For each module, follow this internal order:

1. DB model ready
2. server-side validation/service layer
3. API/server actions
4. permission enforcement
5. UI screen
6. QA of success cases
7. QA of failure cases
8. audit/log checks

This order prevents “pretty UI over broken backend” bullshit.

## 10. Rollout Strategy

## 10.1 Internal Rollout First
Recommended rollout order:
1. owner only
2. approved heads
3. small worker group
4. full worker usage
5. sensor/control internal only
6. public showcase release

## 10.2 Feature Flags Where Helpful
Consider feature flags or release toggles for:
- actuator control
- automation rules
- showcase demo pages
- export generation
- sensor ingestion

## 10.3 Production Freeze Before External Demo
Before public/showcase release:
- verify demo data only
- verify no real raw data leakage
- verify bilingual content behavior
- verify admin routes are not linked or exposed publicly

## 11. Suggested Deliverables Checklist

By the end of implementation, the product should have:

- operational DB schema
- owner seed and Google auth
- worker daily link verification
- worker CRUD for 4 operational categories
- Telegram room 1, 2, 3 behavior
- admin configuration modules
- admin dashboard and reports
- exports: Excel, CSV, PDF
- scheduled jobs for 09:00 and 18:00
- forward task reminders
- sensor ingestion
- actuator control
- automation rules
- demo/showcase layer
- production hardening checklist completed

## 12. Recommended Next Deliverable After This Document

After this implementation plan, the next most useful engineering artifact is one of these:

1. **Next.js Folder / Module Structure Spec**
2. **Prisma/ORM Model Draft**
3. **Task Breakdown / Sprint Backlog**
4. **Environment & Deployment Runbook**
5. **Testing Strategy Document**

## 13. Status

**Status:** Implementation Plan Ready  
**Next Step:** Create Next.js Folder / Module Structure Spec or ORM Model Draft
