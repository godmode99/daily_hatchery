# Page Flow

## 1. Document Purpose

This document defines the page-by-page and flow-by-flow behavior of the hatchery web system.

It is written as the next technical design document after:

- the **Business & Feature Specification**
- the **Technical Design Overview**

This document focuses on:

- user entry points
- navigation flow
- route-level responsibilities
- state transitions between pages
- key behavior across worker, head/admin, customer, and system-triggered flows

This document does **not** yet define:
- database fields
- API request/response contracts
- exact UI component layouts
- low-level implementation details

## 2. Page Flow Scope

The system page flow is divided into four major access areas:

1. **Public / Showcase**
2. **Worker Entry**
3. **Head / Admin**
4. **System / Background Flows**

## 3. Public / Showcase Flow

The public/showcase area is designed for customer-facing presentation.

It must:
- look like the real system
- use demo/mock data only
- support both Thai and English
- never expose real hatchery raw data

### 3.1 Public Entry Points

Main public entry points:

- `/`
- `/showcase`
- `/showcase/dashboard`
- `/showcase/reports`
- `/showcase/control-preview`

### 3.2 Home Page Flow

**Route:** `/`

Purpose:
- introduce the product
- present the hatchery web system at a high level
- direct users to the showcase section

Main actions:
- View showcase
- View workflow/process
- View dashboard preview
- Switch language
- Contact / inquiry action if added later

Possible next pages:
- `/showcase`
- other public informational pages if added later

### 3.3 Showcase Landing Flow

**Route:** `/showcase`

Purpose:
- act as the main customer-facing landing page
- present the product as a demo/showcase experience

Main sections:
- hero section
- system overview
- hatchery workflow explanation
- demo feature overview
- images/screenshots/gallery
- language switcher

Main actions:
- View demo dashboard
- View demo reports
- View demo control preview

Possible next pages:
- `/showcase/dashboard`
- `/showcase/reports`
- `/showcase/control-preview`

### 3.4 Demo Dashboard Flow

**Route:** `/showcase/dashboard`

Purpose:
- show a realistic dashboard experience using demo data

Main content:
- demo summary cards
- demo charts
- demo tables
- demo operational widgets

Rules:
- data must be demo-only
- no real operational entries
- no real worker names
- no real system keys
- no real control capabilities

Possible next pages:
- `/showcase/reports`
- `/showcase/control-preview`
- `/showcase`

### 3.5 Demo Reports Flow

**Route:** `/showcase/reports`

Purpose:
- show the style of reports and summaries available in the system

Main content:
- demo daily report preview
- demo trend reports
- example export style previews
- PDF-like report preview if desired

Rules:
- demo data only
- no raw real records

Possible next pages:
- `/showcase/dashboard`
- `/showcase/control-preview`
- `/showcase`

### 3.6 Demo Control Preview Flow

**Route:** `/showcase/control-preview`

Purpose:
- demonstrate that the real system supports sensor visibility and actuator control

Main content:
- demo sensor cards
- demo control widgets
- demo automation examples

Rules:
- no live real values
- no real command execution
- all buttons and indicators operate in demo/mock mode only

Possible next pages:
- `/showcase/dashboard`
- `/showcase/reports`
- `/showcase`

## 4. Worker Entry Flow

The worker flow is the main operational data-entry flow used daily inside the hatchery.

Workers do not use normal account login.  
They enter through a daily URL and must verify with a personal key.

### 4.1 Worker Entry Points

Main worker entry points:

- `/entry/[dailyToken]`
- `/entry/[dailyToken]/verify`
- `/entry/[dailyToken]/today`
- `/entry/[dailyToken]/food`
- `/entry/[dailyToken]/growout`
- `/entry/[dailyToken]/nursery`
- `/entry/[dailyToken]/water-prep`
- `/entry/[dailyToken]/expired`

### 4.2 Daily URL Landing Flow

**Route:** `/entry/[dailyToken]`

Purpose:
- first worker landing page after clicking the daily Telegram URL

System checks:
- does the token exist
- is the token active
- is the token expired
- is the token valid for the current operational daily window

If valid:
- redirect or continue to verification flow

If invalid or expired:
- route to expired screen

Possible transitions:
- valid → `/entry/[dailyToken]/verify`
- invalid/expired → `/entry/[dailyToken]/expired`

### 4.3 Key Verification Flow

**Route:** `/entry/[dailyToken]/verify`

Purpose:
- verify that the worker holds a valid personal key before allowing operational actions

Worker input:
- personal key
- owner identity reference if required by final UI design

Server checks:
- key exists
- key is active
- key is linked to a valid person
- daily token is still active
- person is allowed to act as worker/head within this flow

If verification succeeds:
- allow access to worker dashboard

If verification fails:
- remain on the same page with error state

Possible transitions:
- success → `/entry/[dailyToken]/today`
- failure → stay on `/entry/[dailyToken]/verify`
- token expired during verification → `/entry/[dailyToken]/expired`

### 4.4 Worker Today Dashboard Flow

**Route:** `/entry/[dailyToken]/today`

Purpose:
- serve as the operational hub for the current active daily cycle

Main content:
- current operational date/window
- visible reminder that the link expires at 09:00 Asia/Bangkok
- entry category shortcuts
- today's entries
- entry list for all workers during the active window
- forward tasks made visible by the head
- edit/delete actions while the link remains valid

Main actions:
- Create Food entry
- Create Grow-out entry
- Create Nursery entry
- Create Water Preparation entry
- Edit entry
- Delete entry
- Refresh current list
- Filter today records by category

Possible next pages:
- `/entry/[dailyToken]/food`
- `/entry/[dailyToken]/growout`
- `/entry/[dailyToken]/nursery`
- `/entry/[dailyToken]/water-prep`

Special rule:
- once the daily URL expires, workers must lose edit/delete/create capability

### 4.5 Food Entry Flow

**Route:** `/entry/[dailyToken]/food`

Purpose:
- enter food/plankton feeding information and calculate dosing requirements

Form content:
- plankton type
- measured concentration (`cells/ml`)
- one or more destination selections

Destinations:
- Condo 1
- Condo 2
- Upwelling

System behavior:
- load configured water volume per destination
- load configured target concentration per destination
- calculate required dosing volume on the server

Main actions:
- Submit
- Cancel
- Return to today dashboard

If submit succeeds:
- save record(s)
- send Telegram room 2 notification
- return to today dashboard
- optionally highlight the newly created item

If submit fails:
- remain on page
- show validation or calculation error

Possible transitions:
- success → `/entry/[dailyToken]/today`
- cancel → `/entry/[dailyToken]/today`
- token expired during action → `/entry/[dailyToken]/expired`

### 4.6 Grow-out Entry Flow

**Route:** `/entry/[dailyToken]/growout`

Purpose:
- record mortality and water quality for grow-out locations

Form content:
- one or more location rows
- dead count per row
- water quality values:
  - pH
  - Ammonia
  - Nitrite
  - Alkaline
  - Salinity

Behavior:
- UI may allow multiple location rows in one submission flow
- backend should treat saved records as separate location-based records

Main actions:
- Add location row
- Remove location row
- Submit
- Cancel

If submit succeeds:
- save record set
- send Telegram room 2 notification
- return to today dashboard

Possible transitions:
- success → `/entry/[dailyToken]/today`
- cancel → `/entry/[dailyToken]/today`
- expired → `/entry/[dailyToken]/expired`

### 4.7 Nursery Entry Flow

**Route:** `/entry/[dailyToken]/nursery`

Purpose:
- record repeated nursery counts and calculate average, total, and density

Form content:
- dilution/distribution water volume
- repeated count rows
- water quality values:
  - pH
  - Ammonia
  - Nitrite
  - Alkaline
  - Salinity

System calculations:
- average count
- total cells
- density (`cells/ml`)

Main actions:
- Add count row
- Remove count row
- Submit
- Cancel

If submit succeeds:
- save main entry
- save repeated count rows
- send Telegram room 2 notification
- return to today dashboard

Possible transitions:
- success → `/entry/[dailyToken]/today`
- cancel → `/entry/[dailyToken]/today`
- expired → `/entry/[dailyToken]/expired`

### 4.8 Water Preparation Entry Flow

**Route:** `/entry/[dailyToken]/water-prep`

Purpose:
- record prepared water quantity and water quality by preparation point

Form content:
- preparation point
- prepared volume (tons)
- salinity
- pH
- Ammonia
- Nitrite
- Alkaline

Preparation point options are managed by the head.

Main actions:
- Submit
- Cancel

If submit succeeds:
- save record
- send Telegram room 2 notification
- return to today dashboard

Possible transitions:
- success → `/entry/[dailyToken]/today`
- cancel → `/entry/[dailyToken]/today`
- expired → `/entry/[dailyToken]/expired`

### 4.9 Edit Entry Flow

Purpose:
- allow workers to modify entries during the active daily window
- allow heads to modify records from the admin side later

Worker edit behavior:
- worker selects an entry from the today dashboard
- system loads the relevant edit form
- form type depends on entry category
- submit updates the record
- Telegram room 2 receives an edit notification

Possible transitions:
- edit entry → category form in edit mode
- submit success → `/entry/[dailyToken]/today`
- expired → `/entry/[dailyToken]/expired`

### 4.10 Delete Entry Flow

Purpose:
- allow workers to remove operational records during the valid window
- use soft delete rather than physical deletion

Worker delete behavior:
- worker selects delete from the today dashboard
- system shows confirmation prompt
- confirmed delete marks the record as deleted
- Telegram room 2 receives a delete notification

Possible transitions:
- confirm delete → return to `/entry/[dailyToken]/today`
- cancel delete → stay on `/entry/[dailyToken]/today`
- expired → `/entry/[dailyToken]/expired`

### 4.11 Expired Link Flow

**Route:** `/entry/[dailyToken]/expired`

Purpose:
- clearly tell the worker that the daily operational URL is no longer valid

Main content:
- expired message
- explanation that operational actions are closed for this daily URL
- optionally show forward tasks that are still safe to view
- no create/edit/delete actions

Main actions:
- return to public area
- wait for next daily link
- contact the head if correction is required

## 5. Head / Admin Flow

The head/admin flow is the privileged management flow of the system.

### 5.1 Admin Entry Points

Main admin routes:

- `/admin/login`
- `/admin/pending`
- `/admin`
- `/admin/people`
- `/admin/keys`
- `/admin/dropdowns`
- `/admin/calculations`
- `/admin/tasks`
- `/admin/dashboard`
- `/admin/reports`
- `/admin/export`
- `/admin/sensors`
- `/admin/actuators`
- `/admin/rules`

### 5.2 Admin Login Flow

**Route:** `/admin/login`

Purpose:
- allow head/admin users to sign in with Google

Flow:
1. user starts Google sign-in
2. server checks whether the user is:
   - owner
   - approved head
   - pending
   - disabled/rejected
3. route based on approval state

Possible transitions:
- owner/approved → `/admin`
- pending → `/admin/pending`
- disabled/rejected → access denied state

### 5.3 Approval Pending Flow

**Route:** `/admin/pending`

Purpose:
- inform a signed-in head candidate that owner approval is still required

Main content:
- pending approval message
- signed-in account information
- sign out option

Main actions:
- sign out
- wait for approval

### 5.4 Head Dashboard Flow

**Route:** `/admin`

Purpose:
- provide the main control center for heads/admins

Main content:
- today's entries summary
- recent entries
- food summary
- mortality summary
- nursery summary
- water quality summary
- due tasks
- alert indicators
- shortcut links to all admin modules

Main actions:
- open each management module
- open reports
- open exports
- open sensor/control sections

Possible next pages:
- `/admin/people`
- `/admin/keys`
- `/admin/dropdowns`
- `/admin/calculations`
- `/admin/tasks`
- `/admin/dashboard`
- `/admin/reports`
- `/admin/export`
- `/admin/sensors`
- `/admin/actuators`
- `/admin/rules`

### 5.5 People Management Flow

**Route:** `/admin/people`

Purpose:
- manage worker/head person records

Main actions:
- create person
- edit person
- enable/disable person
- assign role
- link person to a worker key where relevant

Possible transitions:
- save → stay on `/admin/people`
- cancel → `/admin`

### 5.6 Key Management Flow

**Route:** `/admin/keys`

Purpose:
- manage worker keys

Main actions:
- create key
- edit key text
- disable key
- change owner link
- filter/search keys

Rules:
- key must not be empty
- key must be unique
- spaces are trimmed
- key is linked to an owner record

Possible transitions:
- save → stay on `/admin/keys`
- cancel → `/admin`

### 5.7 Dropdown Management Flow

**Route:** `/admin/dropdowns`

Purpose:
- manage editable list values used across forms and dashboards

Managed groups may include:
- plankton types
- grow-out locations
- water preparation points
- task categories or labels
- future configurable lists

Main actions:
- create item
- edit item
- activate/deactivate item
- reorder if needed

### 5.8 Calculation Settings Flow

**Route:** `/admin/calculations`

Purpose:
- manage formula-related configuration values

Main settings:
- water volume per destination
- target concentration per destination
- default nursery dilution volume

Main actions:
- edit value
- save value
- review latest update metadata

### 5.9 Forward Task Management Flow

**Route:** `/admin/tasks`

Purpose:
- manage forward-planning operational tasks

Task settings:
- task name
- start date
- repeat interval in days
- Telegram reminder enabled/disabled
- visible to workers or hidden
- active/inactive

Main actions:
- create task
- edit task
- disable task
- change visibility
- change reminder setting

### 5.10 Real Dashboard Flow

**Route:** `/admin/dashboard`

Purpose:
- view real operational dashboards with filters and wider visibility than the worker dashboard

Main content:
- summary cards
- charts
- filtered lists
- real/demo mode filters
- deleted-record visibility option if needed later

Main actions:
- filter by date range
- filter by category
- filter by mode
- drill into reports/export

### 5.11 Reports Flow

**Route:** `/admin/reports`

Purpose:
- inspect report views before export

Report types:
- daily
- weekly
- monthly
- custom range

Main actions:
- select date range
- select category
- select mode
- preview report
- go to export page

### 5.12 Export Flow

**Route:** `/admin/export`

Purpose:
- generate export files

Supported outputs:
- Excel
- CSV
- PDF

Main actions:
- choose report type
- choose date range
- choose include/exclude deleted
- choose real/demo mode
- generate file

### 5.13 Sensors Flow

**Route:** `/admin/sensors`

Purpose:
- manage and view sensors

Main content:
- sensor definitions
- latest value
- history preview
- units
- status

Main actions:
- create sensor
- edit sensor
- disable sensor
- view history

### 5.14 Actuators Flow

**Route:** `/admin/actuators`

Purpose:
- manage and manually control actuators

Main content:
- actuator list
- current status
- manual command controls
- binding to rules if needed

Main actions:
- create actuator
- edit actuator
- enable/disable actuator
- send ON command
- send OFF command

### 5.15 Automation Rules Flow

**Route:** `/admin/rules`

Purpose:
- manage time-based and sensor-based automation conditions

Rule examples:
- Friday/Saturday 16:00 → ON for 30 minutes
- Temperature = 30°C → OFF

Main actions:
- create rule
- edit rule
- disable rule
- view execution history if provided later

## 6. System / Background Flows

These flows are not standard user-visible navigation pages but are part of the complete system behavior.

### 6.1 Daily URL Generation Flow

Trigger:
- every day at 09:00 Asia/Bangkok

Steps:
1. expire previous daily link
2. create a new daily link
3. mark old worker operational access invalid
4. send Telegram room 1 message with the new URL

### 6.2 Create/Edit/Delete Notification Flow

Trigger:
- worker or head creates/edits/deletes operational data

Steps:
1. validate request
2. write change to database
3. build Telegram notification payload
4. send Telegram room 2 notification
5. record send result

### 6.3 Daily Summary Flow

Trigger:
- every day at 18:00 Asia/Bangkok

Steps:
1. collect the day's operational records
2. calculate summaries
3. include due forward tasks if configured
4. send Telegram room 3 summary
5. record send result

### 6.4 Sensor Ingestion Flow

Trigger:
- device or external source sends sensor data to HTTP API

Steps:
1. validate source and payload
2. store sensor reading
3. evaluate related automation rules
4. create alert or command if required

### 6.5 Automation Execution Flow

Trigger:
- schedule-based event
- sensor-threshold event
- future combined condition event

Steps:
1. identify eligible active rules
2. evaluate rule conditions
3. issue actuator command if matched
4. log command and execution result
5. optionally notify Telegram if configured

## 7. Recommended Route Map

```text
/
 /showcase
 /showcase/dashboard
 /showcase/reports
 /showcase/control-preview

 /entry/[dailyToken]
 /entry/[dailyToken]/verify
 /entry/[dailyToken]/today
 /entry/[dailyToken]/food
 /entry/[dailyToken]/growout
 /entry/[dailyToken]/nursery
 /entry/[dailyToken]/water-prep
 /entry/[dailyToken]/expired

 /admin/login
 /admin/pending
 /admin
 /admin/people
 /admin/keys
 /admin/dropdowns
 /admin/calculations
 /admin/tasks
 /admin/dashboard
 /admin/reports
 /admin/export
 /admin/sensors
 /admin/actuators
 /admin/rules
```

## 8. Flow Rules Locked by This Document

This document locks the following page-flow decisions:

- workers do not use standard login
- workers always enter through a daily token flow
- key verification happens before operational actions
- workers operate inside a temporary daily window
- expired worker URLs block operational actions
- head/admin access is separated from worker access
- showcase access is demo-only
- sensor/control pages are head-only
- create/edit/delete actions trigger Telegram room 2
- daily link generation triggers Telegram room 1
- daily summary triggers Telegram room 3

## 9. Next Technical Document

The next document should be:

**Database Schema Draft**

That document should define:
- entities
- field groups
- relationships
- real/demo flag behavior
- soft delete structure
- audit/log support
- scheduler-related data structures

## 10. Status

**Status:** Page Flow Ready  
**Next Step:** Create Database Schema Draft
