# Technical Design Overview

## 1. Document Purpose

This document defines the **high-level technical design direction** for the hatchery web system.  
It is the bridge between the approved business/feature specification and the detailed implementation documents.

This overview does **not** define every table, endpoint, or UI component in full detail.  
Instead, it defines the technical structure, boundaries, responsibilities, and design principles that will guide implementation.

## 2. Relationship to the Business Specification

This document is written as the technical continuation of the business and feature specification.

The business specification already defines:

- product purpose
- user roles
- operational data-entry categories
- customer showcase boundaries
- daily URL and key behavior
- Telegram flows
- sensor and actuator scope

This document translates those business decisions into a technical system structure.

## 3. System Goals

The system must support two major modes within one product:

1. **Real hatchery operations**
2. **Customer-facing showcase/demo mode**

The technical design must therefore support:

- real operational data handling
- strict separation between real and demo data
- role-based access
- daily operational workflows
- administrative configuration
- reporting and exports
- sensor ingestion and actuator control
- bilingual showcase presentation

## 4. Core Technical Principles

The system should follow these principles:

### 4.1 Single Product, Multiple Access Modes
The application should remain a single product, but clearly separate:

- public/showcase access
- worker operational access
- head/admin access

### 4.2 Database as Source of Truth
The production database must be the primary source of truth.

Rules:
- real operational data is stored in the database
- demo/mock data is also stored in the database
- export files are generated from database queries
- Excel/CSV/PDF are output formats, not the primary data source

### 4.3 Explicit Real vs Demo Separation
Demo content and real content must never be mixed by accident.

The recommended design is:
- one database
- separate records through a clear mode flag, such as `REAL` and `DEMO`

This separation must exist in:
- data tables
- queries
- dashboards
- exports
- showcase pages

### 4.4 Role-Centered Security
Security must be designed around the agreed role model:

- Worker
- Head
- Owner
- Customer/Public

Each route, action, and data query must enforce the correct role and mode restrictions.

### 4.5 Server-Side Trust
Sensitive actions must be trusted only on the server side.

Examples:
- worker key verification
- daily URL validation
- head approval checks
- Telegram sending
- sensor rule evaluation
- actuator command execution
- export generation

### 4.6 Operational Simplicity
The system should remain practical for real hatchery use.

This means:
- worker flow must be fast
- admin flow must be configurable
- formulas must be editable by authorized users
- daily operational tasks must be easy to review
- technical complexity must not make daily work harder

## 5. High-Level System Modules

The product should be organized into the following major technical modules.

### 5.1 Public / Showcase Module
Responsibilities:
- public pages
- bilingual content
- demo dashboards
- demo reports
- demo control preview
- process explanations and gallery content

Data rules:
- uses demo-mode data only
- must never expose raw real operational data

### 5.2 Worker Entry Module
Responsibilities:
- accept access through a daily URL
- validate worker key
- show the current operational dashboard
- handle daily data-entry forms
- support editing and soft deletion during the valid daily window
- block operational actions once the daily URL expires

### 5.3 Head/Admin Module
Responsibilities:
- Google-based administrative access
- approval-controlled head accounts
- management of people, keys, dropdowns, formulas, and tasks
- real operational dashboards
- reporting and export
- access to sensor and actuator areas
- automation rule management

### 5.4 Reporting & Export Module
Responsibilities:
- provide filtered reports
- generate Excel, CSV, and PDF output
- support daily, weekly, monthly, and custom date-range reporting
- support Telegram summary generation

### 5.5 Sensor & Actuator Module
Responsibilities:
- ingest sensor values
- display latest values and history
- support CRUD for sensor definitions
- support CRUD for actuator definitions
- support manual commands
- support rule-based automation

### 5.6 Scheduler & Automation Module
Responsibilities:
- expire and create daily URLs at 09:00 Asia/Bangkok
- send daily URL Telegram notifications
- send daily summary Telegram notifications at 18:00 Asia/Bangkok
- send forward-task reminders
- evaluate automation rules when required

### 5.7 Notification Module
Responsibilities:
- send Telegram room 1 messages
- send Telegram room 2 messages
- send Telegram room 3 messages
- log delivery results
- provide retry/error visibility for administrators

## 6. User Access Model

## 6.1 Worker Access
Workers do not use standard account-based login.

Instead, worker access is based on:
- a shared daily URL
- a personal key

Worker access characteristics:
- URL can be opened by anyone who receives it
- operational action requires key verification
- worker access is temporary and tied to the current daily window
- worker access is intentionally simple and low-friction

### 6.2 Head Access
Head users access the system through:
- Google sign-in
- approval by the owner before full access is granted

Recommended account states:
- pending
- approved
- disabled
- rejected

### 6.3 Owner Access
The owner is a privileged head account with authority to approve other head users.

Initial owner account:
- `bestpratice168@gmail.com`

Owner capabilities:
- approve head accounts
- disable head accounts
- manage the highest-level administration

### 6.4 Customer/Public Access
Customers and public visitors access:
- the showcase layer only

They must not access:
- worker routes
- admin routes
- real data
- control operations

## 7. Data Domains

The system data should be separated into logical domains.

### 7.1 Identity & Access Data
Examples:
- people
- worker keys
- head accounts
- approvals
- daily links
- access attempts

### 7.2 Operational Data
Examples:
- food entries
- grow-out entries
- nursery entries
- water preparation entries

### 7.3 Configuration Data
Examples:
- plankton types
- grow-out locations
- water preparation points
- calculation settings
- visibility settings
- forward-planning settings

### 7.4 Task & Planning Data
Examples:
- task templates
- repeating schedules
- worker-visible task instances
- reminder state

### 7.5 Reporting Data
Examples:
- generated summaries
- export job metadata
- report filters
- cached aggregates if needed later

### 7.6 Sensor & Control Data
Examples:
- sensor definitions
- sensor readings
- actuator definitions
- command history
- automation rules
- rule execution logs

### 7.7 Notification Data
Examples:
- Telegram send logs
- message payload history
- delivery success/failure state

## 8. Data Lifecycle Rules

### 8.1 Operational Records
Operational records are never the same as export files.

Flow:
1. user submits data
2. server validates and writes to database
3. server sends Telegram notifications
4. dashboards and reports read from database
5. exports are generated from the stored records

### 8.2 Soft Delete Policy
Worker and admin deletion actions should use soft delete.

This means:
- records remain in the database
- they are marked as deleted
- reports may choose whether to include/exclude deleted items
- Telegram must still notify on deletion events

### 8.3 Demo Data Policy
Demo records should remain queryable but safely isolated.

Rules:
- demo records must be tagged clearly
- real dashboards default to real mode
- showcase dashboards must use demo mode only
- exports should default to real mode unless explicitly changed by an admin

## 9. Time and Scheduling Model

The system uses a fixed operational timezone:

- `Asia/Bangkok`

All timestamps must follow this timezone for:
- UI display
- reports
- exports
- Telegram messages
- scheduling rules

### 9.1 Daily URL Schedule
At 09:00 every day:
- old worker link expires
- new worker link is generated
- Telegram room 1 receives the new URL

### 9.2 Daily Summary Schedule
At 18:00 every day:
- system collects current-day summary
- Telegram room 3 receives the summary

### 9.3 Task Reminder Schedule
Forward tasks may generate reminders according to their schedule settings.

### 9.4 Automation Schedule
Automation rules may be:
- time-based
- sensor-threshold-based
- combined in later phases if needed

## 10. Calculation Strategy

Formulas must not be hard-coded only in UI logic.

The recommended strategy is:

- input validation on both client and server
- official calculation execution on the server
- configurable calculation parameters stored in the database
- formula output stored together with the submitted record when appropriate

This is especially important for:
- food dosing calculation
- nursery average, total count, and density calculation

## 11. Routing Strategy

The route structure should reflect access mode boundaries.

Recommended logical route groups:

- public/showcase routes
- worker entry routes
- head/admin routes
- API/system routes

This separation improves:
- readability
- permission control
- middleware design
- testing

## 12. State Management Strategy

The system should prefer simple and predictable state rules.

### 12.1 Public/Showcase
Mostly read-only content and demo data views.

### 12.2 Worker Pages
Short-lived state only:
- form state
- validation state
- active verification state

Worker access should not depend on long persistent session design.

### 12.3 Head/Admin Pages
Requires stronger authenticated session handling due to:
- Google login
- approval status
- privileged actions
- configuration changes
- export generation
- control operations

## 13. Integration Overview

### 13.1 Telegram
Telegram is a core external integration.

It is used for:
- daily URL sharing
- create/edit/delete notifications
- daily summary notifications
- task reminders
- rule-triggered alerts if needed

### 13.2 Google Identity
Google login is required for head/admin access.

### 13.3 Sensor Ingestion
The first sensor ingestion mode should use:
- HTTP API ingestion

This keeps the initial design simpler than adding MQTT or a broker immediately.

### 13.4 Export Outputs
The system must produce:
- Excel
- CSV
- PDF

## 14. Environment and Deployment Direction

The intended platform direction is:

- **Frontend / Server:** Next.js
- **Hosting:** Vercel
- **Database:** Neon Postgres
- **Authentication for Heads:** Google login
- **Notifications:** Telegram
- **Sensor ingestion:** HTTP API

### 14.1 Production-Oriented Build
The target is production-level implementation, not an MVP-only prototype.

This means the technical design should be prepared for:
- clean modular structure
- role boundaries
- data protection
- future scaling
- maintainability

### 14.2 Environment Separation
The system should support at least:
- local development
- preview/staging
- production

Demo and real data separation must remain reliable across environments.

## 15. Security Overview

Security goals:

- customers must never see real raw data
- workers must only act within the current valid daily window
- only approved head users may access admin features
- only owner-approved heads may manage privileged settings
- sensor/control actions must be restricted to authorized users
- control actions and deletes must remain auditable

Recommended security practices:
- server-side verification for all sensitive actions
- approval checks in admin session flow
- soft deletion instead of destructive deletion
- command logging for actuator actions
- notification logging for Telegram actions
- mode filtering to prevent real/demo leakage

## 16. Observability and Audit Direction

The system should be designed with operational traceability in mind.

Minimum areas to log:
- daily URL generation
- worker verification attempts
- create/edit/delete actions
- Telegram sends
- head approvals
- settings changes
- actuator commands
- automation rule executions

The goal is not heavy enterprise logging for everything, but enough traceability to debug problems and explain actions.

## 17. Recommended Next Technical Documents

This overview should be followed by the next technical documents:

1. **Page Flow**
2. **Database Schema Draft**
3. **Permission Matrix**
4. **API / Server Action Specification**
5. **Scheduler / Automation Specification**
6. **Export / Reporting Specification**

## 18. Out of Scope for This Document

This document does not yet define:

- exact table structures
- exact route file structure
- exact API request/response shapes
- exact middleware implementation
- detailed UI wireframes
- exact PDF layout templates
- low-level sensor protocol details beyond initial ingestion direction

These should be defined in the next technical design documents.

## 19. Current Technical Decisions Locked

The following decisions are considered locked at the overview level:

- real and demo data use one database with explicit separation flags
- database is the system of record
- head access uses Google login with owner approval
- initial owner is `bestpratice168@gmail.com`
- worker flow uses daily URL + personal key
- worker verification is simple and not based on long-lived persistent login
- deletes are soft deletes
- timezone is Asia/Bangkok
- Telegram summary is sent daily at 18:00
- sensor ingestion starts with HTTP API
- showcase supports both Thai and English
- production-level implementation is the target

## 20. Status

**Status:** Technical Design Overview Ready  
**Next Step:** Create Page Flow document
