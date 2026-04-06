# Database Schema Draft

## 1. Document Purpose

This document defines the first database schema draft for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**

This document defines:
- core entities
- major table groups
- important fields
- key relationships
- indexing direction
- soft delete strategy
- real/demo data separation strategy

This document does **not** yet define:
- full SQL DDL
- ORM model syntax
- migration order
- final constraints for every column
- API payload formats

## 2. Database Platform

Recommended database:
- **Neon Postgres**

Reasons:
- PostgreSQL is a good fit for relational operational records
- supports strong querying for reports and exports
- works well with Next.js and Vercel
- suitable for both transactional data and reporting queries

## 3. Core Schema Principles

### 3.1 Database as Source of Truth
The database is the primary data source for:
- operational entries
- configuration
- access control
- reporting
- exports
- Telegram logs
- sensor/control data

### 3.2 Real vs Demo Separation
The same database stores both:
- real hatchery data
- demo/showcase data

Every major data table that can appear in dashboards or reports must include a mode flag:

- `REAL`
- `DEMO`

Recommended column:
- `data_mode`

### 3.3 Soft Delete
Operational records are not physically deleted by normal application flows.

Recommended common columns:
- `deleted_at`
- `deleted_by_user_id`
- `is_deleted`

### 3.4 Audit-Friendly Design
Important actions should remain traceable.

Recommended common columns for important tables:
- `created_at`
- `created_by_user_id`
- `updated_at`
- `updated_by_user_id`

### 3.5 Timestamp Strategy
Recommended storage rule:
- store timestamps in UTC
- display timestamps in `Asia/Bangkok` in UI, reports, and Telegram content

## 4. Naming and Type Conventions

### 4.1 Primary Keys
Recommended:
- `id UUID PRIMARY KEY`

### 4.2 Foreign Keys
Recommended pattern:
- `[referenced_table]_id`

Examples:
- `person_id`
- `daily_link_id`
- `plankton_type_id`

### 4.3 Boolean Columns
Recommended names:
- `is_active`
- `is_deleted`
- `is_visible_to_workers`
- `is_telegram_enabled`

### 4.4 Enum-Like Columns
Recommended use for controlled values such as:
- `data_mode`
- `approval_status`
- `admin_role`
- `telegram_room_type`
- `actuator_command_type`
- `rule_type`

## 5. High-Level Table Groups

The schema is divided into these major groups:

1. Identity and access
2. Reference and configuration
3. Daily operational entries
4. Forward planning and scheduling
5. Telegram and export support
6. Sensor and actuator control

---

# 6. Identity and Access Tables

## 6.1 `people`

Purpose:
Store person records used by the system.

This table covers:
- workers
- heads
- owner

### Fields
- `id`
- `display_name`
- `default_role`  
  Suggested values:
  - `WORKER`
  - `HEAD`
  - `OWNER`
- `is_active`
- `notes`
- `created_at`
- `updated_at`

### Notes
- one person may have a worker key
- one person may also have a Google admin account if they are a head or owner

---

## 6.2 `admin_accounts`

Purpose:
Store Google-based admin access records.

### Fields
- `id`
- `person_id` → FK to `people.id`
- `google_email`
- `admin_role`  
  Suggested values:
  - `HEAD`
  - `OWNER`
- `approval_status`  
  Suggested values:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `DISABLED`
- `approved_by_admin_account_id` → self FK
- `approved_at`
- `last_login_at`
- `created_at`
- `updated_at`

### Constraints
- `google_email` must be unique
- initial seeded owner account:
  - `bestpratice168@gmail.com`

---

## 6.3 `worker_keys`

Purpose:
Store personal worker keys used in the daily URL flow.

### Fields
- `id`
- `person_id` → FK to `people.id`
- `key_value`
- `key_masked`
- `status`  
  Suggested values:
  - `ACTIVE`
  - `DISABLED`
- `created_by_admin_account_id`
- `created_at`
- `updated_at`
- `notes`

### Constraints
- `key_value` must be unique
- `key_value` must not be empty

### Notes
- implementation may encrypt the raw value at rest later
- `key_masked` is useful for UI display without always showing the full value

---

## 6.4 `daily_links`

Purpose:
Store the shared daily worker URL tokens.

### Fields
- `id`
- `token`
- `starts_at`
- `expires_at`
- `status`  
  Suggested values:
  - `ACTIVE`
  - `EXPIRED`
  - `CANCELLED`
- `telegram_sent_at`
- `created_by_system`
- `created_at`

### Constraints
- `token` must be unique

### Notes
- only one link should normally be active for the worker flow at a time

---

## 6.5 `worker_access_logs`

Purpose:
Store worker verification attempts and worker flow access events.

### Fields
- `id`
- `daily_link_id` → FK to `daily_links.id`
- `worker_key_id` → nullable FK to `worker_keys.id`
- `person_id` → nullable FK to `people.id`
- `action_type`  
  Suggested values:
  - `VERIFY_SUCCESS`
  - `VERIFY_FAIL`
  - `OPEN_LINK`
  - `EXPIRED_LINK_ACCESS`
- `ip_address`
- `user_agent`
- `created_at`

### Notes
- useful for troubleshooting and audit visibility

---

# 7. Reference and Configuration Tables

## 7.1 `plankton_types`

Purpose:
Store editable plankton type dropdown values.

### Fields
- `id`
- `name_en`
- `name_th`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### Example records
- Isochrysis
- Chaetoceros
- Tetraselmis

---

## 7.2 `growout_locations`

Purpose:
Store editable grow-out and feeding destination locations.

### Fields
- `id`
- `name`
- `code`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### Example records
- Condo 1
- Condo 2
- Upwelling

---

## 7.3 `water_prep_points`

Purpose:
Store editable water preparation point dropdown values.

### Fields
- `id`
- `name`
- `code`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### Example records
- Sedimentation Pond (Before)
- Sedimentation Pond (After)
- High-Salinity Tank
- Mixing Tank
- Ready Tank 1
- Ready Tank 2

---

## 7.4 `food_destination_settings`

Purpose:
Store food calculation settings per destination.

### Fields
- `id`
- `growout_location_id` → FK to `growout_locations.id`
- `target_concentration_cells_per_ml`
- `water_volume_liters`
- `effective_from`
- `is_active`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Notes
- supports changing target concentration and water volume over time
- latest active row can be treated as the current rule

---

## 7.5 `nursery_settings`

Purpose:
Store editable nursery default settings.

### Fields
- `id`
- `default_dilution_volume_liters`
- `is_active`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

---

## 7.6 `system_settings`

Purpose:
Store global operational settings that are not tied to one feature row.

### Suggested fields
- `id`
- `setting_key`
- `setting_value`
- `value_type`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Example keys
- `WORKER_LINK_EXPIRE_HOUR`
- `WORKER_LINK_EXPIRE_MINUTE`
- `DAILY_SUMMARY_HOUR`
- `DEFAULT_TIMEZONE`

---

# 8. Daily Operational Entry Tables

All operational entry tables should include common fields:

- `data_mode`
- `daily_link_id`
- `created_by_user_id`
- `created_by_worker_key_id`
- `updated_by_user_id`
- `deleted_by_user_id`
- `is_deleted`
- `deleted_at`
- `created_at`
- `updated_at`

`data_mode` should support:
- `REAL`
- `DEMO`

---

## 8.1 `food_entries`

Purpose:
Store the main food entry submission record.

### Fields
- `id`
- `data_mode`
- `daily_link_id`
- `plankton_type_id` → FK to `plankton_types.id`
- `measured_concentration_cells_per_ml`
- `notes`
- `created_by_user_id` → FK to `people.id`
- `created_by_worker_key_id` → FK to `worker_keys.id`
- `updated_by_user_id` → FK to `people.id`
- `deleted_by_user_id` → FK to `people.id`
- `is_deleted`
- `deleted_at`
- `created_at`
- `updated_at`

### Notes
- one food entry may target multiple destinations

---

## 8.2 `food_entry_destinations`

Purpose:
Store per-destination calculations and outputs for a food entry.

### Fields
- `id`
- `food_entry_id` → FK to `food_entries.id`
- `growout_location_id` → FK to `growout_locations.id`
- `target_concentration_cells_per_ml`
- `water_volume_liters`
- `required_dosing_volume_liters`
- `created_at`

### Notes
- this table preserves the exact calculation output used at submit time
- this protects report consistency even if future settings change later

---

## 8.3 `growout_entries`

Purpose:
Store grow-out mortality and water-quality records.

### Fields
- `id`
- `data_mode`
- `daily_link_id`
- `growout_location_id` → FK to `growout_locations.id`
- `dead_count`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `salinity`
- `notes`
- `created_by_user_id`
- `created_by_worker_key_id`
- `updated_by_user_id`
- `deleted_by_user_id`
- `is_deleted`
- `deleted_at`
- `created_at`
- `updated_at`

### Notes
- UI may submit multiple locations in one action
- backend should store one row per location

---

## 8.4 `nursery_entries`

Purpose:
Store nursery main records and calculated outputs.

### Fields
- `id`
- `data_mode`
- `daily_link_id`
- `dilution_water_volume_liters`
- `average_count`
- `total_cells`
- `density_cells_per_ml`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `salinity`
- `notes`
- `created_by_user_id`
- `created_by_worker_key_id`
- `updated_by_user_id`
- `deleted_by_user_id`
- `is_deleted`
- `deleted_at`
- `created_at`
- `updated_at`

### Notes
- repeated count values are stored separately in `nursery_entry_counts`

---

## 8.5 `nursery_entry_counts`

Purpose:
Store repeated count rows linked to a nursery entry.

### Fields
- `id`
- `nursery_entry_id` → FK to `nursery_entries.id`
- `row_no`
- `count_value`
- `created_at`

### Notes
- allows one nursery entry to have one or many count rows
- supports average calculation traceability

---

## 8.6 `water_prep_entries`

Purpose:
Store prepared water quantity and water-quality records.

### Fields
- `id`
- `data_mode`
- `daily_link_id`
- `water_prep_point_id` → FK to `water_prep_points.id`
- `prepared_volume_tons`
- `salinity`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `notes`
- `created_by_user_id`
- `created_by_worker_key_id`
- `updated_by_user_id`
- `deleted_by_user_id`
- `is_deleted`
- `deleted_at`
- `created_at`
- `updated_at`

---

# 9. Forward Planning and Scheduling Tables

## 9.1 `forward_tasks`

Purpose:
Store configurable forward-planning tasks managed by the head.

### Fields
- `id`
- `name`
- `description`
- `start_date`
- `repeat_every_n_days`
- `is_telegram_enabled`
- `is_visible_to_workers`
- `is_active`
- `created_by_admin_account_id`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Notes
- this table stores the recurring task definition
- the application can compute due tasks from this base data

---

## 9.2 `forward_task_notifications`

Purpose:
Track task reminder sends.

### Fields
- `id`
- `forward_task_id` → FK to `forward_tasks.id`
- `target_date`
- `telegram_message_log_id` → nullable FK
- `send_status`
- `sent_at`
- `created_at`

### Notes
- prevents duplicate reminder sends for the same task/date pair

---

# 10. Telegram and Export Support Tables

## 10.1 `telegram_destinations`

Purpose:
Store configured Telegram destinations.

### Fields
- `id`
- `name`
- `room_type`  
  Suggested values:
  - `DAILY_URL`
  - `ENTRY_ACTIVITY`
  - `DAILY_SUMMARY`
  - `TASK_REMINDER`
  - `ALERT`
- `chat_id`
- `is_active`
- `created_at`
- `updated_at`

---

## 10.2 `telegram_message_logs`

Purpose:
Store Telegram send attempts and outcomes.

### Fields
- `id`
- `telegram_destination_id` → FK to `telegram_destinations.id`
- `message_type`
- `related_table_name`
- `related_record_id`
- `payload_text`
- `send_status`  
  Suggested values:
  - `PENDING`
  - `SENT`
  - `FAILED`
- `response_payload`
- `created_at`
- `sent_at`

### Notes
- helps audit what was sent and when
- important for create/edit/delete messages and summaries

---

## 10.3 `export_jobs`

Purpose:
Track export requests and generated files.

### Fields
- `id`
- `requested_by_admin_account_id` → FK to `admin_accounts.id`
- `export_type`  
  Suggested values:
  - `EXCEL`
  - `CSV`
  - `PDF`
- `report_type`  
  Suggested values:
  - `DAILY`
  - `WEEKLY`
  - `MONTHLY`
  - `CUSTOM`
- `data_mode_filter`
- `include_deleted`
- `date_from`
- `date_to`
- `file_path`
- `job_status`  
  Suggested values:
  - `QUEUED`
  - `RUNNING`
  - `COMPLETED`
  - `FAILED`
- `created_at`
- `completed_at`

---

# 11. Sensor and Actuator Tables

## 11.1 `sensors`

Purpose:
Store sensor definitions.

### Fields
- `id`
- `name`
- `code`
- `unit`
- `description`
- `is_active`
- `created_by_admin_account_id`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Example sensors
- Temperature
- Salinity

---

## 11.2 `sensor_readings`

Purpose:
Store sensor data received through HTTP API.

### Fields
- `id`
- `sensor_id` → FK to `sensors.id`
- `reading_value`
- `reading_time`
- `source_device_id`
- `raw_payload`
- `created_at`

### Notes
- `reading_time` is the time provided by device or ingestion process
- `created_at` is the database insertion time

---

## 11.3 `actuators`

Purpose:
Store actuator definitions.

### Fields
- `id`
- `name`
- `code`
- `description`
- `is_active`
- `created_by_admin_account_id`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Example actuators
- Water Pump to Filter Tank

---

## 11.4 `actuator_commands`

Purpose:
Store manual and automated actuator commands.

### Fields
- `id`
- `actuator_id` → FK to `actuators.id`
- `command_type`  
  Suggested values:
  - `ON`
  - `OFF`
- `command_source`  
  Suggested values:
  - `MANUAL`
  - `RULE`
  - `SYSTEM`
- `issued_by_admin_account_id` → nullable FK
- `automation_rule_id` → nullable FK
- `executed_at`
- `execution_status`
- `response_payload`
- `created_at`

---

## 11.5 `automation_rules`

Purpose:
Store automation logic definitions.

### Fields
- `id`
- `name`
- `rule_type`  
  Suggested values:
  - `TIME_BASED`
  - `SENSOR_THRESHOLD`
- `is_active`
- `description`
- `created_by_admin_account_id`
- `updated_by_admin_account_id`
- `created_at`
- `updated_at`

### Notes
- detailed conditions and actions are stored in child tables

---

## 11.6 `automation_rule_time_conditions`

Purpose:
Store time-based rule conditions.

### Fields
- `id`
- `automation_rule_id` → FK to `automation_rules.id`
- `weekday`  
  Suggested values:
  - `MON`
  - `TUE`
  - `WED`
  - `THU`
  - `FRI`
  - `SAT`
  - `SUN`
- `trigger_time`
- `duration_minutes`
- `created_at`

### Example
- Friday 16:00 for 30 minutes
- Saturday 16:00 for 30 minutes

---

## 11.7 `automation_rule_sensor_conditions`

Purpose:
Store sensor threshold conditions.

### Fields
- `id`
- `automation_rule_id` → FK to `automation_rules.id`
- `sensor_id` → FK to `sensors.id`
- `operator`  
  Suggested values:
  - `GT`
  - `GTE`
  - `LT`
  - `LTE`
  - `EQ`
- `threshold_value`
- `created_at`

### Example
- Temperature EQ 30

---

## 11.8 `automation_rule_actions`

Purpose:
Store actions triggered by automation rules.

### Fields
- `id`
- `automation_rule_id` → FK to `automation_rules.id`
- `actuator_id` → FK to `actuators.id`
- `command_type`  
  Suggested values:
  - `ON`
  - `OFF`
- `created_at`

---

## 11.9 `automation_rule_execution_logs`

Purpose:
Track rule evaluations and executions.

### Fields
- `id`
- `automation_rule_id` → FK to `automation_rules.id`
- `matched_at`
- `execution_status`
- `details`
- `created_at`

---

# 12. Relationship Summary

Key relationship overview:

- `people` 1→many `worker_keys`
- `people` 1→many `food_entries`
- `people` 1→many `growout_entries`
- `people` 1→many `nursery_entries`
- `people` 1→many `water_prep_entries`
- `people` 1→many `admin_accounts`

- `daily_links` 1→many operational entries
- `daily_links` 1→many `worker_access_logs`

- `plankton_types` 1→many `food_entries`
- `growout_locations` 1→many `food_entry_destinations`
- `growout_locations` 1→many `growout_entries`
- `water_prep_points` 1→many `water_prep_entries`

- `food_entries` 1→many `food_entry_destinations`
- `nursery_entries` 1→many `nursery_entry_counts`

- `forward_tasks` 1→many `forward_task_notifications`

- `telegram_destinations` 1→many `telegram_message_logs`

- `sensors` 1→many `sensor_readings`
- `actuators` 1→many `actuator_commands`
- `automation_rules` 1→many time conditions
- `automation_rules` 1→many sensor conditions
- `automation_rules` 1→many actions
- `automation_rules` 1→many execution logs

# 13. Recommended Indexes

Recommended indexes for early performance:

## Identity / Access
- unique index on `admin_accounts.google_email`
- unique index on `worker_keys.key_value`
- unique index on `daily_links.token`

## Operational
- index on `(data_mode, created_at)` for all operational entry tables
- index on `daily_link_id` for operational entry tables
- index on `created_by_user_id` for operational entry tables
- index on `is_deleted` for operational entry tables

## Reporting
- index on `telegram_message_logs.created_at`
- index on `export_jobs.created_at`

## Sensors / Rules
- index on `sensor_readings(sensor_id, reading_time desc)`
- index on `actuator_commands(actuator_id, executed_at desc)`
- index on `automation_rules.is_active`

# 14. Optional Future Tables

These are not required in the first schema version, but may be added later if complexity increases:

- `showcase_content_blocks`
- `report_snapshots`
- `api_keys_for_devices`
- `file_attachments`
- `notification_retry_jobs`
- `audit_event_logs`

# 15. Tables Recommended for First Implementation

If implementation needs a practical first production pass, prioritize these tables first:

1. `people`
2. `admin_accounts`
3. `worker_keys`
4. `daily_links`
5. `worker_access_logs`
6. `plankton_types`
7. `growout_locations`
8. `water_prep_points`
9. `food_destination_settings`
10. `nursery_settings`
11. `food_entries`
12. `food_entry_destinations`
13. `growout_entries`
14. `nursery_entries`
15. `nursery_entry_counts`
16. `water_prep_entries`
17. `forward_tasks`
18. `telegram_destinations`
19. `telegram_message_logs`
20. `sensors`
21. `sensor_readings`
22. `actuators`
23. `actuator_commands`
24. `automation_rules`
25. `automation_rule_time_conditions`
26. `automation_rule_sensor_conditions`
27. `automation_rule_actions`

# 16. Next Technical Document

The next document should be:

**Permission Matrix**

That document should define:
- who can access each route
- who can create, read, update, delete each data group
- special rules for expired worker URLs
- owner-only approval actions
- head-only sensor/control actions
- showcase/demo access boundaries

# 17. Status

**Status:** Database Schema Draft Ready  
**Next Step:** Create Permission Matrix
