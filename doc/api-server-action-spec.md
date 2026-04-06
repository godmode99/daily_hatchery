# API / Server Action Specification

## 1. Document Purpose

This document defines the first API and server action specification for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**
- the **Permission Matrix**

This document defines:
- major server-side actions
- API endpoint responsibilities
- expected request patterns
- expected response patterns
- permission expectations
- validation expectations
- side effects such as Telegram notifications, exports, and automation triggers

This document does **not** yet define:
- final code implementation
- exact TypeScript types for every field
- full OpenAPI schema
- exact middleware code
- queue worker code
- retry implementation details

## 2. Design Principles

### 2.1 Server-Side Trust
All sensitive actions must be trusted only on the server side.

Examples:
- worker key verification
- daily link validation
- operational record creation
- operational edit/delete
- admin approval logic
- export generation
- Telegram sending
- actuator commands
- automation rule execution

### 2.2 Clear Separation Between UI Actions and System Actions
This document distinguishes between:
- **user-triggered server actions**
- **API endpoints for devices/system integrations**
- **scheduled/system-triggered actions**

### 2.3 Real vs Demo Safety
Any action that reads or writes operational data must clearly define:
- whether it works with `REAL`
- whether it works with `DEMO`
- whether both are allowed only for admin use

### 2.4 Soft Delete Only for Operational Delete Actions
Delete actions for operational records should:
- mark records as deleted
- record delete metadata
- trigger Telegram notifications
- avoid physical removal in standard application flows

## 3. Action Groups

The system server actions / APIs are divided into these groups:

1. Worker access actions
2. Worker operational entry actions
3. Admin authentication and approval actions
4. Admin configuration actions
5. Reporting and export actions
6. Telegram/system notification actions
7. Sensor ingestion actions
8. Actuator and automation actions
9. Scheduled/system actions

---

# 4. Worker Access Actions

## 4.1 Validate Daily Link

### Purpose
Validate whether a daily token exists and is still usable.

### Recommended interface
- **Route Handler API**
- `GET /api/worker/daily-link/[token]/validate`

### Request
Path params:
- `token`

### Server checks
- token exists
- token status is active
- current time is before `expires_at`

### Success response
```json
{
  "ok": true,
  "status": "ACTIVE",
  "dailyLink": {
    "token": "example-token",
    "startsAt": "2026-04-06T02:00:00.000Z",
    "expiresAt": "2026-04-07T02:00:00.000Z"
  }
}
```

### Expired response
```json
{
  "ok": false,
  "status": "EXPIRED"
}
```

### Permission
- public access allowed
- no record write

---

## 4.2 Verify Worker Key

### Purpose
Verify worker key before allowing operational actions.

### Recommended interface
- **Route Handler API**
- `POST /api/worker/verify-key`

### Request
```json
{
  "token": "daily-token",
  "key": "worker-key-value"
}
```

### Server checks
- daily link exists and is active
- worker key exists
- worker key is active
- worker key is linked to an active person
- current time is still inside the valid worker window

### Success response
```json
{
  "ok": true,
  "person": {
    "id": "uuid",
    "displayName": "Aoy"
  },
  "workerKeyId": "uuid",
  "dailyLinkId": "uuid"
}
```

### Failure response
```json
{
  "ok": false,
  "error": "INVALID_KEY"
}
```

### Side effects
- write `worker_access_logs`
- optionally return a short-lived signed verification state/token for the current browser flow

### Permission
- public access allowed
- server-side validation required

---

## 4.3 Get Worker Today Dashboard Data

### Purpose
Return worker-visible entries and tasks for the active daily window.

### Recommended interface
- **Route Handler API**
- `GET /api/worker/dashboard?token=...&key=...`

### Server checks
- valid daily token
- valid worker key
- active worker window

### Returns
- current daily link info
- worker-visible forward tasks
- today's food entries summary
- today's grow-out entries summary
- today's nursery entries summary
- today's water preparation entries summary
- current entry list for the active daily window

### Permission
- worker only with valid token + key
- heads may also use equivalent admin queries separately

---

# 5. Worker Operational Entry Actions

All worker entry actions must:
- validate daily link
- validate worker key
- validate active worker window
- write `REAL` mode records
- send Telegram room 2 after success
- log create/update/delete metadata

## 5.1 Create Food Entry

### Purpose
Create food entry record and destination calculation rows.

### Recommended interface
- **Server Action or Route Handler**
- `POST /api/worker/food`

### Request
```json
{
  "token": "daily-token",
  "key": "worker-key-value",
  "planktonTypeId": "uuid",
  "measuredConcentrationCellsPerMl": 650000,
  "destinationIds": ["uuid-1", "uuid-2"],
  "notes": "optional"
}
```

### Server logic
1. validate token/key/window
2. load active `food_destination_settings` for each destination
3. calculate `required_dosing_volume_liters`
4. create `food_entries`
5. create `food_entry_destinations`
6. send Telegram room 2 notification
7. return created record summary

### Success response
```json
{
  "ok": true,
  "foodEntryId": "uuid",
  "destinations": [
    {
      "growoutLocationId": "uuid-1",
      "requiredDosingVolumeLiters": 12.5
    }
  ]
}
```

### Permission
- worker with active link and valid key
- approved head or owner may create equivalent records through admin flow if needed

---

## 5.2 Update Food Entry

### Purpose
Edit an existing food entry during active worker window, or through admin correction flow.

### Recommended interface
- `PATCH /api/worker/food/[id]`
- admin equivalent may reuse separate admin action

### Request
Same logical fields as create.

### Server logic
- validate actor
- ensure worker update is still within valid active daily window
- ensure record is not deleted
- replace or update related `food_entry_destinations`
- send Telegram edit notification

### Permission
- worker only while daily link is active
- head/owner from admin flow at any time

---

## 5.3 Delete Food Entry

### Purpose
Soft delete food entry and related destination rows logically.

### Recommended interface
- `DELETE /api/worker/food/[id]`

### Server logic
- validate actor
- mark `food_entries.is_deleted = true`
- set delete metadata
- related destination rows may remain but be excluded by parent state
- send Telegram delete notification

### Permission
- worker only while daily link is active
- head/owner through admin flow

---

## 5.4 Create Grow-out Entry

### Purpose
Create one or more grow-out rows from a single worker form submission.

### Recommended interface
- `POST /api/worker/growout`

### Request
```json
{
  "token": "daily-token",
  "key": "worker-key-value",
  "rows": [
    {
      "growoutLocationId": "uuid-1",
      "deadCount": 5
    },
    {
      "growoutLocationId": "uuid-2",
      "deadCount": 2
    }
  ],
  "ph": 8.1,
  "ammonia": 0.02,
  "nitrite": 0.01,
  "alkaline": 120,
  "salinity": 28,
  "notes": "optional"
}
```

### Server logic
- validate token/key/window
- create one `growout_entries` row per location
- send Telegram room 2 notification summarizing created rows

### Permission
- worker with active link and valid key

---

## 5.5 Update Grow-out Entry
### Recommended interface
- `PATCH /api/worker/growout/[id]`

### Behavior
- update one existing row
- worker only while link is active
- head/owner through admin flow later

---

## 5.6 Delete Grow-out Entry
### Recommended interface
- `DELETE /api/worker/growout/[id]`

### Behavior
- soft delete only
- Telegram delete notification required

---

## 5.7 Create Nursery Entry

### Purpose
Create nursery main record and repeated count rows, and store calculation outputs.

### Recommended interface
- `POST /api/worker/nursery`

### Request
```json
{
  "token": "daily-token",
  "key": "worker-key-value",
  "dilutionWaterVolumeLiters": 10,
  "counts": [45, 50, 47],
  "ph": 8.0,
  "ammonia": 0.01,
  "nitrite": 0.01,
  "alkaline": 118,
  "salinity": 29,
  "notes": "optional"
}
```

### Server logic
1. validate token/key/window
2. calculate average count
3. calculate total cells
4. calculate density
5. create `nursery_entries`
6. create `nursery_entry_counts`
7. send Telegram room 2 notification

### Permission
- worker with active link and valid key

---

## 5.8 Update Nursery Entry
### Recommended interface
- `PATCH /api/worker/nursery/[id]`

### Behavior
- replace count rows if necessary
- recalculate average/total/density
- send Telegram edit notification

---

## 5.9 Delete Nursery Entry
### Recommended interface
- `DELETE /api/worker/nursery/[id]`

### Behavior
- soft delete only
- send Telegram delete notification

---

## 5.10 Create Water Preparation Entry

### Purpose
Create water preparation record.

### Recommended interface
- `POST /api/worker/water-prep`

### Request
```json
{
  "token": "daily-token",
  "key": "worker-key-value",
  "waterPrepPointId": "uuid",
  "preparedVolumeTons": 5,
  "salinity": 30,
  "ph": 8.2,
  "ammonia": 0.01,
  "nitrite": 0.01,
  "alkaline": 125,
  "notes": "optional"
}
```

### Server logic
- validate token/key/window
- create `water_prep_entries`
- send Telegram room 2 notification

---

## 5.11 Update Water Preparation Entry
### Recommended interface
- `PATCH /api/worker/water-prep/[id]`

## 5.12 Delete Water Preparation Entry
### Recommended interface
- `DELETE /api/worker/water-prep/[id]`

### Behavior
- soft delete only
- Telegram notification required

---

# 6. Admin Authentication and Approval Actions

## 6.1 Start Google Login

### Purpose
Start head/admin sign-in flow.

### Recommended interface
- handled by authentication library integration
- not a custom business endpoint in most cases

### Permission
- public

---

## 6.2 Resolve Admin Access State

### Purpose
Determine whether signed-in Google user is owner, approved head, pending, rejected, or disabled.

### Recommended interface
- server-side auth callback or protected admin loader
- optional endpoint:
  - `GET /api/admin/me`

### Response
```json
{
  "ok": true,
  "adminAccount": {
    "id": "uuid",
    "googleEmail": "example@gmail.com",
    "adminRole": "HEAD",
    "approvalStatus": "APPROVED"
  }
}
```

### Permission
- signed-in Google user

---

## 6.3 Approve Pending Head

### Purpose
Allow owner to approve a pending head account.

### Recommended interface
- **Server Action**
- or `POST /api/admin/accounts/[id]/approve`

### Permission
- owner only

### Server logic
- verify owner
- set `approval_status = APPROVED`
- set `approved_by_admin_account_id`
- set `approved_at`

---

## 6.4 Reject Pending Head
### Recommended interface
- `POST /api/admin/accounts/[id]/reject`

### Permission
- owner only

---

## 6.5 Disable Head Account
### Recommended interface
- `POST /api/admin/accounts/[id]/disable`

### Permission
- owner only

---

# 7. Admin Configuration Actions

All admin configuration actions require:
- signed-in Google account
- approved head or owner
- owner-only checks for privileged actions where specified

## 7.1 People CRUD

### Recommended interface
- `GET /api/admin/people`
- `POST /api/admin/people`
- `PATCH /api/admin/people/[id]`
- `POST /api/admin/people/[id]/disable`

### Permission
- approved head or owner

---

## 7.2 Worker Key CRUD

### Recommended interface
- `GET /api/admin/keys`
- `POST /api/admin/keys`
- `PATCH /api/admin/keys/[id]`
- `POST /api/admin/keys/[id]/disable`

### Permission
- approved head or owner

### Validation
- key not empty
- key unique
- owner exists and is active

---

## 7.3 Dropdown CRUD

Applies to:
- plankton types
- grow-out locations
- water preparation points

### Recommended interface examples
- `GET /api/admin/plankton-types`
- `POST /api/admin/plankton-types`
- `PATCH /api/admin/plankton-types/[id]`
- `POST /api/admin/plankton-types/[id]/disable`

Equivalent routes for locations and water prep points.

### Permission
- approved head or owner

---

## 7.4 Calculation Settings Update

### Recommended interface
- `GET /api/admin/calculations`
- `PATCH /api/admin/calculations/food-destinations/[id]`
- `PATCH /api/admin/calculations/nursery-default`

### Permission
- approved head or owner

### Behavior
- save updated settings
- persist update metadata
- do not retroactively change stored calculation results in old records

---

## 7.5 Forward Task CRUD

### Recommended interface
- `GET /api/admin/tasks`
- `POST /api/admin/tasks`
- `PATCH /api/admin/tasks/[id]`
- `POST /api/admin/tasks/[id]/disable`

### Permission
- approved head or owner

---

# 8. Reporting and Export Actions

## 8.1 Get Admin Dashboard Data

### Recommended interface
- `GET /api/admin/dashboard`

### Query params may include
- `dateFrom`
- `dateTo`
- `dataMode`
- `includeDeleted`

### Permission
- approved head or owner

### Returns
- summary cards
- chart-ready aggregates
- recent records
- task summaries
- sensor alert indicators if included

---

## 8.2 Get Reports Preview

### Recommended interface
- `GET /api/admin/reports`

### Query params
- `reportType`
- `category`
- `dateFrom`
- `dateTo`
- `dataMode`
- `includeDeleted`

### Permission
- approved head or owner

---

## 8.3 Create Export Job

### Purpose
Generate export request and file output.

### Recommended interface
- `POST /api/admin/export`

### Request
```json
{
  "exportType": "PDF",
  "reportType": "DAILY",
  "dateFrom": "2026-04-06",
  "dateTo": "2026-04-06",
  "dataMode": "REAL",
  "includeDeleted": false
}
```

### Permission
- approved head or owner

### Server logic
- validate requester
- create `export_jobs`
- generate file immediately or enqueue
- update job status
- return file reference or job reference

---

## 8.4 Get Export Job Status
### Recommended interface
- `GET /api/admin/export/[id]`

### Permission
- approved head or owner

---

# 9. Telegram and Notification Actions

These actions are mainly internal/system-side, but the business logic must still be defined.

## 9.1 Send Daily URL Telegram Message

### Purpose
Send the newly generated daily worker URL to room 1.

### Recommended trigger
- scheduled/system action at 09:00 Asia/Bangkok

### Internal interface
- service function or internal endpoint
- e.g. `POST /api/system/telegram/send-daily-url`

### Side effects
- insert `telegram_message_logs`
- update `daily_links.telegram_sent_at`

---

## 9.2 Send Entry Activity Telegram Message

### Purpose
Send create/edit/delete notifications to room 2.

### Trigger sources
- food entry actions
- grow-out entry actions
- nursery entry actions
- water preparation entry actions

### Recommended implementation
- service call after successful DB transaction

---

## 9.3 Send Daily Summary Telegram Message

### Purpose
Send room 3 daily summary at 18:00 Asia/Bangkok.

### Recommended trigger
- scheduled/system action

### Summary content may include
- today's entry totals
- mortality summary
- food summary
- latest water quality
- due forward tasks

---

## 9.4 Send Forward Task Reminder

### Purpose
Send Telegram reminder for due tasks when enabled.

### Trigger
- scheduled/system action
- or a task evaluation action

---

# 10. Sensor Ingestion Actions

Sensor ingestion starts with HTTP API.

## 10.1 Ingest Sensor Reading

### Purpose
Receive sensor readings from devices or device gateways.

### Recommended interface
- `POST /api/sensors/ingest`

### Request
```json
{
  "sensorCode": "TEMP_MAIN",
  "value": 30.0,
  "readingTime": "2026-04-06T09:30:00+07:00",
  "sourceDeviceId": "esp32-01",
  "rawPayload": {
    "temperature": 30.0
  }
}
```

### Server checks
- sensor exists and is active
- payload is valid
- source may be checked against allowed device rules later

### Server logic
1. store `sensor_readings`
2. evaluate automation rules related to this sensor
3. trigger actuator command or Telegram alert if matched

### Success response
```json
{
  "ok": true,
  "sensorReadingId": "uuid"
}
```

### Permission
- device/API access only
- not for public browser use

---

## 10.2 Get Sensor Dashboard Data

### Recommended interface
- `GET /api/admin/sensors`

### Permission
- approved head or owner

### Returns
- sensor definitions
- latest readings
- optionally recent trend slices

---

# 11. Actuator and Automation Actions

## 11.1 Manual Actuator ON Command

### Recommended interface
- `POST /api/admin/actuators/[id]/on`

### Permission
- approved head or owner

### Server logic
- verify requester
- verify actuator is active
- create `actuator_commands`
- execute downstream integration if wired
- log result

---

## 11.2 Manual Actuator OFF Command

### Recommended interface
- `POST /api/admin/actuators/[id]/off`

### Permission
- approved head or owner

---

## 11.3 Actuator CRUD

### Recommended interface
- `GET /api/admin/actuators`
- `POST /api/admin/actuators`
- `PATCH /api/admin/actuators/[id]`
- `POST /api/admin/actuators/[id]/disable`

### Permission
- approved head or owner

---

## 11.4 Sensor CRUD

### Recommended interface
- `GET /api/admin/sensors/definitions`
- `POST /api/admin/sensors/definitions`
- `PATCH /api/admin/sensors/definitions/[id]`
- `POST /api/admin/sensors/definitions/[id]/disable`

### Permission
- approved head or owner

---

## 11.5 Automation Rule CRUD

### Recommended interface
- `GET /api/admin/rules`
- `POST /api/admin/rules`
- `PATCH /api/admin/rules/[id]`
- `POST /api/admin/rules/[id]/disable`

### Permission
- approved head or owner

### Rule child actions
- add/update/remove time conditions
- add/update/remove sensor threshold conditions
- add/update/remove actions

---

## 11.6 Execute Automation Rule

### Purpose
Run automation logic from schedule or sensor trigger.

### Recommended interface
- internal service
- or internal endpoint such as `POST /api/system/rules/evaluate`

### Permission
- system only

### Logic
- load active eligible rules
- evaluate conditions
- create actuator commands when matched
- write execution logs
- send Telegram alert if configured

---

# 12. Scheduled/System Actions

These are not normal browser user actions.

## 12.1 Generate New Daily Link

### Trigger
- daily at 09:00 Asia/Bangkok

### Recommended interface
- `POST /api/system/daily-link/generate`

### Permission
- system only

### Logic
1. expire old active link
2. create new link
3. send room 1 Telegram
4. log result

---

## 12.2 Expire Old Daily Link

### Trigger
- part of daily generation flow

### Recommended interface
- internal service function
- or separate internal system endpoint if needed

---

## 12.3 Send Daily Summary

### Trigger
- daily at 18:00 Asia/Bangkok

### Recommended interface
- `POST /api/system/summary/send`

### Permission
- system only

---

## 12.4 Evaluate Forward Tasks

### Trigger
- scheduled/system timing

### Recommended interface
- `POST /api/system/tasks/evaluate`

### Permission
- system only

### Logic
- determine due tasks
- send task reminders if enabled
- write reminder send logs

---

# 13. Error Strategy

Recommended common error codes:

- `INVALID_KEY`
- `LINK_EXPIRED`
- `LINK_NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RECORD_NOT_FOUND`
- `VALIDATION_ERROR`
- `ALREADY_DELETED`
- `EXPORT_FAILED`
- `TELEGRAM_SEND_FAILED`
- `RULE_EVALUATION_FAILED`
- `ACTUATOR_COMMAND_FAILED`

Recommended response structure:
```json
{
  "ok": false,
  "error": "VALIDATION_ERROR",
  "message": "Human-readable explanation"
}
```

## 14. Transaction Guidance

The following actions should use DB transaction boundaries:

- create food entry + destination rows
- update food entry + destination rows
- create nursery entry + count rows
- update nursery entry + count rows
- create multiple grow-out rows from one request
- soft delete actions that update multiple linked records
- export job creation + initial job state write where needed

Telegram sending may happen:
- after successful commit
- or through queued post-commit side effects

## 15. Recommended Implementation Split

### Prefer Server Actions for:
- admin forms
- worker form submissions from app pages
- configuration updates

### Prefer Route Handlers for:
- worker key verification
- sensor ingestion
- export file endpoints
- scheduler/system endpoints
- integration-style machine-to-server requests

### Prefer Internal Services for:
- calculation logic
- Telegram formatting/sending
- rule evaluation
- export generation
- permission checks
- query builders

## 16. Recommended Next Technical Document

The next document should be:

**Scheduler / Automation Specification**

That document should define:
- cron timing
- system triggers
- daily link generation workflow
- daily summary workflow
- forward task reminder workflow
- automation rule timing/evaluation
- retry/failure strategy

## 17. Status

**Status:** API / Server Action Specification Ready  
**Next Step:** Create Scheduler / Automation Specification
