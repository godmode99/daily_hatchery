# Scheduler / Automation Specification

## 1. Document Purpose

This document defines the scheduler behavior, automation behavior, and time-based system execution rules for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**
- the **Permission Matrix**
- the **API / Server Action Specification**

This document defines:
- scheduled system events
- daily worker link lifecycle
- Telegram scheduling behavior
- forward-task reminder scheduling
- sensor-triggered automation behavior
- actuator automation behavior
- retry and failure handling direction
- audit and logging behavior for scheduled/system actions

This document does **not** yet define:
- infrastructure-specific cron configuration syntax
- final queue implementation
- external worker implementation details
- low-level device protocol logic

## 2. Scheduler Goals

The scheduler/automation layer must support the following system behaviors:

1. Generate a new daily worker link at 09:00 Asia/Bangkok
2. Expire the previous worker link at the same time
3. Send the daily worker link to Telegram room 1
4. Send the daily summary to Telegram room 3 at 18:00 Asia/Bangkok
5. Evaluate forward-planning tasks and send reminders when due
6. Evaluate automation rules for:
   - time-based triggers
   - sensor-threshold triggers
7. Issue actuator commands when automation rules match
8. Maintain enough auditability to explain what the system did and why

## 3. Scheduling Principles

### 3.1 Timezone Principle
All scheduler behavior must use:

- `Asia/Bangkok`

This timezone must drive:
- daily link expiration/generation
- daily summary send time
- task reminder logic
- time-based automation rules
- human-readable timestamps in Telegram messages

### 3.2 Deterministic Daily Windows
Worker operations must be controlled by a deterministic daily window.

The worker flow is based on:
- one active shared worker URL at a time
- personal worker key verification
- write permissions only while the active worker link is valid

### 3.3 Server-Side Scheduling Authority
Scheduler decisions must be trusted only on the server side.

The client/browser must never be the source of truth for:
- whether a worker link is active
- whether a rule should execute
- whether a summary should be sent
- whether a task is due
- whether an actuator should be triggered

### 3.4 Idempotent System Design
Scheduled actions must be designed to avoid duplicate effects where possible.

Examples:
- avoid generating two daily links for the same cycle
- avoid sending duplicate daily summaries for the same day
- avoid sending the same task reminder multiple times for the same target date
- avoid issuing duplicate actuator commands from the same rule event unless explicitly intended

### 3.5 Audit Visibility
Every scheduled or automated action should leave a trace through:
- execution logs
- Telegram logs
- command logs
- task reminder logs
- rule execution logs

## 4. Main Scheduler Domains

The scheduler/automation layer is divided into these major domains:

1. Daily worker link lifecycle
2. Daily summary lifecycle
3. Forward task reminder lifecycle
4. Sensor-triggered automation lifecycle
5. Time-based actuator automation lifecycle
6. Failure/retry lifecycle

---

# 5. Daily Worker Link Lifecycle

## 5.1 Business Rule Summary

The system must:
- use one shared daily worker link
- replace it every day
- expire the old link at 09:00 Asia/Bangkok
- send the new link to Telegram room 1

Workers may:
- create, edit, delete operational records only during the active link window

Heads may:
- correct data later through admin flows

## 5.2 Schedule Trigger

### Trigger time
- every day at **09:00 Asia/Bangkok**

### Trigger type
- scheduled system job

## 5.3 Daily Link Generation Workflow

### Workflow steps
1. load current active daily link(s)
2. mark old active link(s) as expired
3. generate a new token
4. create a new `daily_links` record
5. send the new URL to Telegram room 1
6. log the Telegram result
7. record successful scheduler execution

## 5.4 Required Guard Rules

The scheduler must guard against:
- duplicate active links
- duplicate sends for the same day
- partial success where a new link exists but Telegram send is not logged
- race conditions where multiple scheduler executions start at the same time

## 5.5 Suggested Idempotency Rule

Recommended rule:
- only one `daily_links` row may be considered active for the current cycle
- if a row already exists with the intended cycle date and `ACTIVE` status, do not create a second one
- if the link exists but Telegram was not sent successfully, allow re-send without creating another row

## 5.6 Worker Behavior After Expiry

After 09:00 Asia/Bangkok:
- old worker link is no longer valid for create/update/delete
- verification on old token must fail with expired status
- worker dashboard create/update/delete must be blocked
- expired page may still explain that the worker should wait for the next link
- heads may still access/admin-correct through the admin side

## 5.7 Telegram Message for Daily Link

### Target
- Telegram room 1

### Minimum payload content
- date
- link URL
- validity description
- optional reminder text

### Example message
```text
[Daily Worker Link]
Date: 2026-04-06
Link: https://example.com/entry/abc123
Valid until: 09:00 AM Thailand time next cycle
```

---

# 6. Daily Summary Lifecycle

## 6.1 Business Rule Summary

The system must send an automatic daily summary to Telegram room 3.

The summary time is:
- **18:00 Asia/Bangkok**

The summary should describe today's real operational activity.

## 6.2 Schedule Trigger

### Trigger time
- every day at **18:00 Asia/Bangkok**

### Trigger type
- scheduled system job

## 6.3 Daily Summary Workflow

### Workflow steps
1. collect today's `REAL` operational records
2. summarize food activity
3. summarize mortality
4. summarize nursery activity
5. summarize water preparation activity
6. collect due forward tasks if needed for message context
7. format Telegram summary payload
8. send Telegram room 3 message
9. log Telegram result
10. log scheduler execution result

## 6.4 Suggested Summary Data Scope

Recommended scope:
- only records from today's operational date
- exclude soft-deleted records by default unless the business later explicitly wants them counted
- use real data only
- do not include demo data

## 6.5 Suggested Summary Sections

Possible sections:
- who submitted data today
- count of records by category
- total dead shellfish by grow-out location
- food entry count and latest dosage summary
- nursery summary values
- latest water preparation quality snapshot
- due or upcoming tasks

## 6.6 Idempotency Rule

Recommended:
- only one official daily summary send per operational date and destination
- if send fails, allow retry on the same summary unit
- do not send multiple summary messages as separate “successes” for the same date unless explicitly forced by admin

### Suggested logical uniqueness
- `(message_type = DAILY_SUMMARY, summary_date, telegram_destination_id)`

---

# 7. Forward Task Reminder Lifecycle

## 7.1 Business Rule Summary

Heads can define forward-planning tasks with:
- start date
- repeat interval in days
- Telegram reminder on/off
- worker visibility on/off

The system must evaluate whether a task is due and whether a reminder should be sent.

## 7.2 Reminder Evaluation Strategy

Recommended strategy:
- task definitions are stored once in `forward_tasks`
- due task dates are computed dynamically
- reminder sends are tracked in `forward_task_notifications`

This avoids storing endless pre-generated task rows unless needed later.

## 7.3 Schedule Trigger

### Recommended trigger
- periodic system evaluation job

Possible timing options:
- once per day in the morning
- more than once per day if reminders need better timing
- initial version can evaluate together with a dedicated morning schedule job

## 7.4 Due Logic

A task is due when:
- `is_active = true`
- current date is on or after `start_date`
- the day offset from start date matches `repeat_every_n_days`
- Telegram reminders are enabled for that task

### Suggested formula concept
```text
days_since_start = current_date - start_date
task_is_due = days_since_start >= 0 AND days_since_start % repeat_every_n_days = 0
```

## 7.5 Reminder Workflow

### Workflow steps
1. load active forward tasks with Telegram reminders enabled
2. compute whether each task is due for the target date
3. check `forward_task_notifications` to avoid duplicate sends
4. send Telegram reminder if not yet sent
5. write notification log row
6. write Telegram message log row

## 7.6 Worker Visibility Rule

Task visibility for workers is separate from Telegram reminders.

This means:
- a task may be visible to workers on the dashboard
- a task may also send Telegram reminders
- one of those behaviors may be enabled while the other is disabled if the product later supports more flexibility

---

# 8. Time-Based Automation Lifecycle

## 8.1 Business Rule Summary

Heads may define time-based automation rules for actuators.

Example:
- Friday/Saturday 16:00 → ON for 30 minutes

## 8.2 Trigger Type
- scheduled/system evaluation

## 8.3 Evaluation Timing

Recommended:
- periodic job runs frequently enough to catch the intended trigger window
- system compares current Bangkok time against active time-based rules

The implementation may choose:
- minutely evaluation
- frequent short-interval evaluation
- exact external scheduler hooks

## 8.4 Time-Based Rule Workflow

### Workflow steps
1. load active `TIME_BASED` rules
2. load matching weekday conditions for the current Bangkok weekday
3. compare current time against `trigger_time`
4. if matched and not already executed for the relevant trigger unit:
   - create actuator command(s)
   - write rule execution log(s)
   - optionally schedule or create the later OFF action if rule duration requires it
   - optionally notify Telegram if enabled later

## 8.5 Duration Handling

For rules such as:
- Friday/Saturday 16:00 → ON for 30 minutes

The system must support one of these designs:

### Option A — Explicit ON then separate scheduled OFF
- create ON command at 16:00
- compute OFF event for 16:30
- create OFF command at 16:30

### Option B — Command with duration semantics
- create one ON command with metadata `duration_minutes = 30`
- downstream command handler later issues OFF

### Recommended direction
- **Option A**
because it is easier to audit and clearer in command history

## 8.6 Duplicate Protection

The rule evaluation must avoid repeated ON commands in the same trigger window.

Suggested uniqueness concept:
- one rule execution per `(automation_rule_id, Bangkok date, trigger_time, actuator_id)`

---

# 9. Sensor-Triggered Automation Lifecycle

## 9.1 Business Rule Summary

Heads may define sensor-threshold rules.

Example:
- Temperature = 30°C → OFF

## 9.2 Trigger Type
- event-driven
- starts when sensor ingestion occurs

## 9.3 Sensor Rule Evaluation Workflow

### Workflow steps
1. receive sensor reading through HTTP API
2. save sensor reading
3. load active `SENSOR_THRESHOLD` rules relevant to the sensor
4. compare reading value against rule condition
5. if matched:
   - create actuator command(s)
   - write rule execution log(s)
   - optionally send Telegram alert if enabled later

## 9.4 Supported Operators

Recommended initial operators:
- `GT`
- `GTE`
- `LT`
- `LTE`
- `EQ`

## 9.5 Suggested Equality Handling

For floating values like temperature, strict equality may be dangerous.

Recommended implementation note:
- UI may allow “equal” concept
- backend should later support tolerance or normalized comparison if needed

Example:
- treat `EQ 30` as exact configured threshold rule or recommend converting to `GTE 30` depending on operational preference

## 9.6 Duplicate Protection

Sensor-triggered rules may fire repeatedly if readings arrive often.

Recommended protections:
- cooldown window per rule
- only re-trigger when state changes across threshold boundary
- or store latest matched execution and suppress identical repeated actions for a configured interval

### First-version recommendation
Use a simple cooldown strategy such as:
- do not fire the same rule more than once within a short configured interval unless value returns to a non-matching state first

---

# 10. Actuator Command Scheduling and Execution

## 10.1 Command Sources

Actuator commands may be created from:
- manual admin action
- time-based rule
- sensor-threshold rule
- system-generated duration follow-up action

## 10.2 Command Lifecycle

Suggested states for `actuator_commands.execution_status`:
- `PENDING`
- `EXECUTING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`

## 10.3 Command Workflow

### Workflow steps
1. command row is created
2. downstream execution begins
3. result is recorded
4. failure details are stored if needed
5. optional Telegram alert may be sent if critical

## 10.4 Safety Principle

Actuator command creation and execution must be auditable.

At minimum, the system should preserve:
- who or what created the command
- whether it came from a rule or manual action
- when it was issued
- whether it succeeded

---

# 11. Failure and Retry Strategy

## 11.1 Failure Categories

Main failure types:
- scheduler execution failure
- Telegram send failure
- export generation failure
- actuator command failure
- rule evaluation failure
- sensor ingestion validation failure

## 11.2 Retry Philosophy

Not all failures should retry in the same way.

### Safe retry candidates
- Telegram send failure
- daily summary send failure
- task reminder send failure
- export generation

### More careful retry candidates
- actuator command execution
- time-based automation command issue
- sensor-triggered automation command issue

Reason:
- repeated actuator commands may cause real-world side effects

## 11.3 Telegram Retry Direction

Recommended:
- mark message log as `FAILED`
- allow a retry mechanism to resend pending/failed Telegram messages
- retry must not create a new logical business event, only re-attempt delivery of the same message unit

## 11.4 Daily Link Failure Handling

If new daily link creation succeeds but Telegram room 1 send fails:
- keep the created link
- log Telegram failure
- allow admin/system retry of the same notification without generating a new link

## 11.5 Daily Summary Failure Handling

If summary generation succeeds but Telegram send fails:
- log as failed
- allow retry for the same summary date and destination
- avoid generating a second logical summary unit for the same date

## 11.6 Actuator Failure Handling

If actuator command execution fails:
- record failure details
- do not blindly retry if the side effect is uncertain
- require rule- or operator-aware retry policy later
- optionally notify admin/Telegram for critical failures

---

# 12. Scheduler Execution Logging

## 12.1 Need for Execution Logs

The system should preserve execution visibility for:
- daily link generation
- daily summary send
- task reminder evaluation
- time-based rule evaluation
- periodic automation execution

## 12.2 Suggested Future Table

A future support table may be added if needed:
- `scheduler_execution_logs`

Possible fields:
- `id`
- `job_name`
- `started_at`
- `finished_at`
- `status`
- `details`
- `trigger_context`

This table is optional in the first implementation but strongly recommended if scheduler complexity grows.

## 12.3 Minimum Audit Alternatives

If a dedicated scheduler log table is not created immediately, the system should still preserve enough traceability through:
- `daily_links`
- `telegram_message_logs`
- `forward_task_notifications`
- `actuator_commands`
- `automation_rule_execution_logs`

---

# 13. Suggested Job Definitions

The following logical jobs are recommended.

## 13.1 `daily-link-generate`
### Purpose
Generate new worker link and expire old one

### Trigger
- every day at 09:00 Asia/Bangkok

### Outputs
- updated `daily_links`
- Telegram room 1 message log

---

## 13.2 `daily-summary-send`
### Purpose
Send room 3 daily summary

### Trigger
- every day at 18:00 Asia/Bangkok

### Outputs
- Telegram room 3 message log

---

## 13.3 `forward-task-evaluate`
### Purpose
Evaluate due forward tasks and send reminders

### Trigger
- scheduled periodic job

### Outputs
- `forward_task_notifications`
- Telegram message logs

---

## 13.4 `time-rule-evaluate`
### Purpose
Evaluate time-based automation rules

### Trigger
- scheduled periodic job

### Outputs
- `automation_rule_execution_logs`
- `actuator_commands`

---

## 13.5 `telegram-retry`
### Purpose
Retry failed Telegram sends where safe

### Trigger
- scheduled periodic job

### Outputs
- updated `telegram_message_logs`

---

# 14. Rule Priority and Conflict Direction

## 14.1 Need for Conflict Awareness

If multiple rules affect the same actuator, conflicts may occur.

Examples:
- one rule turns pump ON
- another rule turns pump OFF
- a manual admin action happens during automated behavior

## 14.2 First-Version Direction

Recommended first-version behavior:
- manual commands remain authoritative at the moment they are issued
- automation still logs what it attempted
- more advanced conflict policy can be added later

## 14.3 Future Policy Options

Possible future enhancements:
- explicit rule priority numbers
- actuator lockout windows
- manual override mode
- conflict resolution policy table

These are not required for the first version.

---

# 15. Suggested Operational Sequence by Time

## 15.1 Daily Morning Sequence
At 09:00 Asia/Bangkok:
1. expire old worker link
2. create new worker link
3. send Telegram room 1

## 15.2 Daytime Operational Sequence
During the active window:
- workers verify keys
- workers create/update/delete records
- Telegram room 2 receives activity notifications
- sensor ingestion occurs continuously as needed
- sensor-triggered rules may execute

## 15.3 Daily Evening Sequence
At 18:00 Asia/Bangkok:
1. collect today's real operational data
2. build summary
3. send Telegram room 3

## 15.4 Task Reminder Sequence
On scheduled evaluation:
1. compute due forward tasks
2. send reminders where enabled
3. record notification status

## 15.5 Time-Based Automation Sequence
On scheduled evaluation:
1. evaluate current Bangkok time against active time rules
2. create actuator commands if matched
3. log results

---

# 16. Recommended Implementation Split

## 16.1 Scheduled/System Endpoints
Prefer route handlers or internal job-entry endpoints for:
- daily link generation
- daily summary send
- task evaluation
- time-rule evaluation
- Telegram retry

## 16.2 Internal Services
Prefer internal services for:
- Bangkok time calculations
- due-task calculations
- daily summary aggregation
- Telegram formatting/sending
- actuator command creation
- rule matching logic
- duplicate protection logic

## 16.3 Event-Driven Triggers
Prefer event-driven service execution for:
- sensor-threshold rule evaluation after successful sensor ingestion
- entry activity Telegram notifications after successful DB writes

---

# 17. Recommended Next Technical Document

The next document should be:

**Export / Reporting Specification**

That document should define:
- report types
- report filters
- aggregation rules
- deleted-record handling in reports
- demo vs real behavior in reports
- Excel/CSV/PDF output structure
- report field definitions

## 18. Status

**Status:** Scheduler / Automation Specification Ready  
**Next Step:** Create Export / Reporting Specification
