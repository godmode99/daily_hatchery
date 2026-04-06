# Prisma / ORM Model Draft

## 1. Document Purpose

This document translates the approved database schema direction into an ORM-friendly draft structure for implementation.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**
- the **Permission Matrix**
- the **API / Server Action Specification**
- the **Scheduler / Automation Specification**
- the **Export / Reporting Specification**
- the **Implementation Plan / Build Order**

This document defines:
- recommended model structure for Prisma or similar ORM usage
- model grouping
- enum candidates
- relation design
- soft delete patterns
- audit metadata direction
- implementation notes for historical settings and reporting safety

This document does **not** yet define:
- final migration files
- exact Prisma code syntax for every field
- every index in ORM syntax
- every unique constraint implementation detail
- raw SQL fallback for advanced performance optimization

## 2. ORM Goals

The ORM layer should support:

1. clean relational modeling
2. safe querying for operational flows
3. safe separation of `REAL` and `DEMO`
4. reliable reporting joins
5. soft delete support
6. auditable create/update/delete metadata
7. future extensibility for scheduler, sensor, and automation logic

## 3. Recommended ORM Choice

Recommended ORM:
- **Prisma**

Reasons:
- good developer experience with TypeScript and Next.js
- straightforward relational modeling
- migration support
- strong fit for Neon Postgres
- practical for admin CRUD and reporting query composition

## 4. Modeling Principles

### 4.1 Keep Business Entities Explicit
Do not over-collapse models into generic JSON tables.

Use explicit models for:
- food entries
- grow-out entries
- nursery entries
- water preparation entries
- worker keys
- daily links
- sensors
- actuators
- automation rules

### 4.2 Preserve Historical Calculation Outputs
When values are calculated using settings, store the resolved values on the entry-side models where needed.

Do not rely only on “current settings” for old reports.

### 4.3 Use Soft Delete on Operational Models
Operational records should prefer:
- `isDeleted`
- `deletedAt`
- `deletedByUserId`

### 4.4 Use Shared Audit Fields
Important mutable models should include:
- `createdAt`
- `updatedAt`
- `createdByUserId`
- `updatedByUserId`

### 4.5 Use Enum Types Where Semantics Matter
Recommended enum candidates:
- `DataMode`
- `DefaultRole`
- `AdminRole`
- `ApprovalStatus`
- `KeyStatus`
- `DailyLinkStatus`
- `TelegramRoomType`
- `TelegramSendStatus`
- `ExportType`
- `ReportType`
- `ExportJobStatus`
- `RuleType`
- `ActuatorCommandType`
- `ActuatorCommandSource`
- `ExecutionStatus`

## 5. Suggested Enum Draft

## 5.1 `DataMode`
```text
REAL
DEMO
```

## 5.2 `DefaultRole`
```text
WORKER
HEAD
OWNER
```

## 5.3 `AdminRole`
```text
HEAD
OWNER
```

## 5.4 `ApprovalStatus`
```text
PENDING
APPROVED
REJECTED
DISABLED
```

## 5.5 `KeyStatus`
```text
ACTIVE
DISABLED
```

## 5.6 `DailyLinkStatus`
```text
ACTIVE
EXPIRED
CANCELLED
```

## 5.7 `TelegramRoomType`
```text
DAILY_URL
ENTRY_ACTIVITY
DAILY_SUMMARY
TASK_REMINDER
ALERT
```

## 5.8 `TelegramSendStatus`
```text
PENDING
SENT
FAILED
```

## 5.9 `ExportType`
```text
EXCEL
CSV
PDF
```

## 5.10 `ReportType`
```text
DAILY
WEEKLY
MONTHLY
CUSTOM
```

## 5.11 `ExportJobStatus`
```text
QUEUED
RUNNING
COMPLETED
FAILED
```

## 5.12 `RuleType`
```text
TIME_BASED
SENSOR_THRESHOLD
```

## 5.13 `ActuatorCommandType`
```text
ON
OFF
```

## 5.14 `ActuatorCommandSource`
```text
MANUAL
RULE
SYSTEM
```

## 5.15 `ExecutionStatus`
```text
PENDING
EXECUTING
SUCCESS
FAILED
CANCELLED
```

## 6. Identity & Access Model Draft

## 6.1 `Person`

Purpose:
- stores worker, head, and owner person records

Suggested fields:
- `id`
- `displayName`
- `defaultRole`
- `isActive`
- `notes`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `workerKeys`
- one-to-many `adminAccounts`
- one-to-many created operational records
- one-to-many updated operational records
- one-to-many deleted operational records

---

## 6.2 `AdminAccount`

Purpose:
- stores Google-based admin access records

Suggested fields:
- `id`
- `personId`
- `googleEmail`
- `adminRole`
- `approvalStatus`
- `approvedByAdminAccountId`
- `approvedAt`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `Person`
- optional self relation to approver admin account

Important constraints:
- unique `googleEmail`

---

## 6.3 `WorkerKey`

Purpose:
- stores worker key credentials for daily worker flow

Suggested fields:
- `id`
- `personId`
- `keyValue`
- `keyMasked`
- `status`
- `notes`
- `createdByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `Person`
- optional belongs to `AdminAccount` creator

Important constraints:
- unique `keyValue`

Implementation note:
- if encryption-at-rest is added later, ORM may store encrypted value and/or derived searchable hash

---

## 6.4 `DailyLink`

Purpose:
- stores shared worker token links

Suggested fields:
- `id`
- `token`
- `startsAt`
- `expiresAt`
- `status`
- `telegramSentAt`
- `createdAt`

Suggested relations:
- one-to-many `workerAccessLogs`
- one-to-many operational entries

Important constraints:
- unique `token`

---

## 6.5 `WorkerAccessLog`

Purpose:
- stores verification attempts and worker link access traces

Suggested fields:
- `id`
- `dailyLinkId`
- `workerKeyId`
- `personId`
- `actionType`
- `ipAddress`
- `userAgent`
- `createdAt`

Suggested relations:
- belongs to `DailyLink`
- optional belongs to `WorkerKey`
- optional belongs to `Person`

## 7. Reference & Configuration Model Draft

## 7.1 `PlanktonType`

Suggested fields:
- `id`
- `nameEn`
- `nameTh`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `foodEntries`

---

## 7.2 `GrowoutLocation`

Suggested fields:
- `id`
- `name`
- `code`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `growoutEntries`
- one-to-many `foodEntryDestinations`
- one-to-many `foodDestinationSettings`

---

## 7.3 `WaterPrepPoint`

Suggested fields:
- `id`
- `name`
- `code`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `waterPrepEntries`

---

## 7.4 `FoodDestinationSetting`

Purpose:
- stores active and historical destination-based feeding settings

Suggested fields:
- `id`
- `growoutLocationId`
- `targetConcentrationCellsPerMl`
- `waterVolumeLiters`
- `effectiveFrom`
- `isActive`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `GrowoutLocation`
- optional belongs to `AdminAccount`

Implementation note:
- if later historical precision is critical, add `effectiveTo`

---

## 7.5 `NurserySetting`

Suggested fields:
- `id`
- `defaultDilutionVolumeLiters`
- `isActive`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

---

## 7.6 `SystemSetting`

Purpose:
- stores global config by key/value pairs

Suggested fields:
- `id`
- `settingKey`
- `settingValue`
- `valueType`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Implementation note:
- keep usage limited to truly global settings
- do not use this model as a lazy dumping ground for everything

## 8. Operational Model Draft

All operational models should support:
- `dataMode`
- `dailyLinkId`
- actor references
- soft delete
- timestamps

## 8.1 Shared Operational Field Concept

Recommended common operational fields:
- `dataMode`
- `dailyLinkId`
- `createdByUserId`
- `createdByWorkerKeyId`
- `updatedByUserId`
- `deletedByUserId`
- `isDeleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

Not every relation must be required in all contexts, especially for admin-side later corrections.

---

## 8.2 `FoodEntry`

Suggested fields:
- `id`
- `dataMode`
- `dailyLinkId`
- `planktonTypeId`
- `measuredConcentrationCellsPerMl`
- `notes`
- `createdByUserId`
- `createdByWorkerKeyId`
- `updatedByUserId`
- `deletedByUserId`
- `isDeleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `PlanktonType`
- belongs to `DailyLink`
- one-to-many `destinations`
- belongs to `Person` creator/updater/deleter
- optional belongs to `WorkerKey`

---

## 8.3 `FoodEntryDestination`

Suggested fields:
- `id`
- `foodEntryId`
- `growoutLocationId`
- `targetConcentrationCellsPerMl`
- `waterVolumeLiters`
- `requiredDosingVolumeLiters`
- `createdAt`

Suggested relations:
- belongs to `FoodEntry`
- belongs to `GrowoutLocation`

Important modeling note:
- preserve the resolved calculation output here
- do not try to recalculate reports later from current settings only

---

## 8.4 `GrowoutEntry`

Suggested fields:
- `id`
- `dataMode`
- `dailyLinkId`
- `growoutLocationId`
- `deadCount`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `salinity`
- `notes`
- `createdByUserId`
- `createdByWorkerKeyId`
- `updatedByUserId`
- `deletedByUserId`
- `isDeleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `GrowoutLocation`
- belongs to `DailyLink`
- belongs to `Person` creator/updater/deleter

---

## 8.5 `NurseryEntry`

Suggested fields:
- `id`
- `dataMode`
- `dailyLinkId`
- `dilutionWaterVolumeLiters`
- `averageCount`
- `totalCells`
- `densityCellsPerMl`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `salinity`
- `notes`
- `createdByUserId`
- `createdByWorkerKeyId`
- `updatedByUserId`
- `deletedByUserId`
- `isDeleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `counts`
- belongs to `DailyLink`
- belongs to `Person` creator/updater/deleter

---

## 8.6 `NurseryEntryCount`

Suggested fields:
- `id`
- `nurseryEntryId`
- `rowNo`
- `countValue`
- `createdAt`

Suggested relations:
- belongs to `NurseryEntry`

Implementation note:
- replacing count rows on update is acceptable in first version if transaction-safe

---

## 8.7 `WaterPrepEntry`

Suggested fields:
- `id`
- `dataMode`
- `dailyLinkId`
- `waterPrepPointId`
- `preparedVolumeTons`
- `salinity`
- `ph`
- `ammonia`
- `nitrite`
- `alkaline`
- `notes`
- `createdByUserId`
- `createdByWorkerKeyId`
- `updatedByUserId`
- `deletedByUserId`
- `isDeleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

Suggested relations:
- belongs to `WaterPrepPoint`
- belongs to `DailyLink`
- belongs to `Person` creator/updater/deleter

## 9. Forward Planning Model Draft

## 9.1 `ForwardTask`

Suggested fields:
- `id`
- `name`
- `description`
- `startDate`
- `repeatEveryNDays`
- `isTelegramEnabled`
- `isVisibleToWorkers`
- `isActive`
- `createdByAdminAccountId`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `notifications`
- optional belongs to `AdminAccount` creator/updater

---

## 9.2 `ForwardTaskNotification`

Suggested fields:
- `id`
- `forwardTaskId`
- `targetDate`
- `telegramMessageLogId`
- `sendStatus`
- `sentAt`
- `createdAt`

Suggested relations:
- belongs to `ForwardTask`
- optional belongs to `TelegramMessageLog`

Important constraint idea:
- unique combination of `(forwardTaskId, targetDate)`

## 10. Telegram & Export Model Draft

## 10.1 `TelegramDestination`

Suggested fields:
- `id`
- `name`
- `roomType`
- `chatId`
- `isActive`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `messageLogs`

---

## 10.2 `TelegramMessageLog`

Suggested fields:
- `id`
- `telegramDestinationId`
- `messageType`
- `relatedTableName`
- `relatedRecordId`
- `payloadText`
- `sendStatus`
- `responsePayload`
- `createdAt`
- `sentAt`

Suggested relations:
- belongs to `TelegramDestination`
- optional one-to-one link from `ForwardTaskNotification`

Implementation note:
- `relatedTableName` + `relatedRecordId` is acceptable in first version for flexible linkage
- if this becomes messy later, separate typed relations can be introduced for critical message types

---

## 10.3 `ExportJob`

Suggested fields:
- `id`
- `requestedByAdminAccountId`
- `exportType`
- `reportType`
- `dataModeFilter`
- `includeDeleted`
- `dateFrom`
- `dateTo`
- `filePath`
- `jobStatus`
- `createdAt`
- `completedAt`

Suggested relations:
- belongs to `AdminAccount`

## 11. Sensor & Actuator Model Draft

## 11.1 `Sensor`

Suggested fields:
- `id`
- `name`
- `code`
- `unit`
- `description`
- `isActive`
- `createdByAdminAccountId`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `readings`
- one-to-many `sensorConditions`

Important constraints:
- unique `code`

---

## 11.2 `SensorReading`

Suggested fields:
- `id`
- `sensorId`
- `readingValue`
- `readingTime`
- `sourceDeviceId`
- `rawPayload`
- `createdAt`

Suggested relations:
- belongs to `Sensor`

Implementation note:
- `rawPayload` can be JSON
- `readingTime` and `createdAt` should remain separate

---

## 11.3 `Actuator`

Suggested fields:
- `id`
- `name`
- `code`
- `description`
- `isActive`
- `createdByAdminAccountId`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `commands`
- one-to-many `ruleActions`

Important constraints:
- unique `code`

---

## 11.4 `ActuatorCommand`

Suggested fields:
- `id`
- `actuatorId`
- `commandType`
- `commandSource`
- `issuedByAdminAccountId`
- `automationRuleId`
- `executedAt`
- `executionStatus`
- `responsePayload`
- `createdAt`

Suggested relations:
- belongs to `Actuator`
- optional belongs to `AdminAccount`
- optional belongs to `AutomationRule`

---

## 11.5 `AutomationRule`

Suggested fields:
- `id`
- `name`
- `ruleType`
- `isActive`
- `description`
- `createdByAdminAccountId`
- `updatedByAdminAccountId`
- `createdAt`
- `updatedAt`

Suggested relations:
- one-to-many `timeConditions`
- one-to-many `sensorConditions`
- one-to-many `actions`
- one-to-many `executionLogs`

---

## 11.6 `AutomationRuleTimeCondition`

Suggested fields:
- `id`
- `automationRuleId`
- `weekday`
- `triggerTime`
- `durationMinutes`
- `createdAt`

Suggested relations:
- belongs to `AutomationRule`

---

## 11.7 `AutomationRuleSensorCondition`

Suggested fields:
- `id`
- `automationRuleId`
- `sensorId`
- `operator`
- `thresholdValue`
- `createdAt`

Suggested relations:
- belongs to `AutomationRule`
- belongs to `Sensor`

---

## 11.8 `AutomationRuleAction`

Suggested fields:
- `id`
- `automationRuleId`
- `actuatorId`
- `commandType`
- `createdAt`

Suggested relations:
- belongs to `AutomationRule`
- belongs to `Actuator`

---

## 11.9 `AutomationRuleExecutionLog`

Suggested fields:
- `id`
- `automationRuleId`
- `matchedAt`
- `executionStatus`
- `details`
- `createdAt`

Suggested relations:
- belongs to `AutomationRule`

## 12. Optional Support Model Draft

These may be added later if needed.

## 12.1 `SchedulerExecutionLog`
Purpose:
- record system job runs

Suggested fields:
- `id`
- `jobName`
- `startedAt`
- `finishedAt`
- `status`
- `details`
- `triggerContext`
- `createdAt`

---

## 12.2 `DeviceCredential`
Purpose:
- support authenticated sensor ingestion later

Suggested fields:
- `id`
- `deviceCode`
- `secretHash`
- `isActive`
- `createdAt`
- `updatedAt`

Not required for the first version.

## 13. Suggested Model Grouping in Code

Recommended grouping by domain:

### Access
- `Person`
- `AdminAccount`
- `WorkerKey`
- `DailyLink`
- `WorkerAccessLog`

### Reference & Config
- `PlanktonType`
- `GrowoutLocation`
- `WaterPrepPoint`
- `FoodDestinationSetting`
- `NurserySetting`
- `SystemSetting`

### Operational
- `FoodEntry`
- `FoodEntryDestination`
- `GrowoutEntry`
- `NurseryEntry`
- `NurseryEntryCount`
- `WaterPrepEntry`

### Planning & Notifications
- `ForwardTask`
- `ForwardTaskNotification`
- `TelegramDestination`
- `TelegramMessageLog`
- `ExportJob`

### Sensor & Control
- `Sensor`
- `SensorReading`
- `Actuator`
- `ActuatorCommand`
- `AutomationRule`
- `AutomationRuleTimeCondition`
- `AutomationRuleSensorCondition`
- `AutomationRuleAction`
- `AutomationRuleExecutionLog`

## 14. Recommended ORM Implementation Notes

## 14.1 Nullable Actor Fields
Some actor fields should be nullable because:
- system-generated jobs may not have a normal human actor
- future admin corrections may differ from worker-created flows

Example:
- `createdByWorkerKeyId` may be null for admin-created correction records

## 14.2 JSON Fields
Reasonable JSON candidates:
- `SensorReading.rawPayload`
- `TelegramMessageLog.responsePayload`
- `ActuatorCommand.responsePayload`
- optional structured notes/details fields if needed later

Use JSON only where flexibility is truly useful, not for core operational data.

## 14.3 Relation Naming
Use relation names that are explicit and readable.

Examples:
- `FoodEntry.destinations`
- `NurseryEntry.counts`
- `AutomationRule.timeConditions`
- `AutomationRule.sensorConditions`
- `AutomationRule.actions`

## 14.4 Historical Settings Safety
Where reports depend on settings-resolved values:
- store resolved numbers on entry-related child rows
- do not depend on later joins to mutable active settings for historical accuracy

## 14.5 Showcase Safety
Showcase should query normal domain models with:
- `dataMode = DEMO`

Do not create a completely separate fake schema unless there is a strong reason later.

## 15. Recommended First Prisma Model Order

If writing the ORM file incrementally, create models in this rough order:

1. enums
2. `Person`
3. `AdminAccount`
4. `WorkerKey`
5. `DailyLink`
6. `WorkerAccessLog`
7. reference tables
8. configuration tables
9. operational tables
10. task/reminder tables
11. Telegram/export tables
12. sensor/actuator tables
13. automation tables
14. optional support tables

## 16. Recommended Validation Layer Boundaries

ORM model alone is not enough.

Validation should also exist in:
- server action input parsing
- API payload validation
- permission checks
- domain services
- scheduler jobs

Examples:
- `keyValue` uniqueness is DB + validation concern
- food entry destination list is API + business-service concern
- nursery count list is API + domain-service concern
- duplicate summary send prevention is scheduler/domain concern

## 17. Known Areas Likely to Need Raw SQL Later

These areas may eventually need raw SQL or optimized views:
- heavy admin reporting
- cross-category summary exports
- time-bucketed dashboard aggregates
- sensor history trend queries
- duplicate-safe scheduler selection patterns

Do not prematurely optimize them in the first ORM draft unless profiling proves the need.

## 18. Recommended Next Deliverable

After this ORM draft, the next most useful artifact is either:

1. **Next.js Folder / Module Structure Spec**
2. **Prisma Schema First Draft (`schema.prisma`)**
3. **Environment & Deployment Runbook**
4. **Testing Strategy Document**

## 19. Status

**Status:** Prisma / ORM Model Draft Ready  
**Next Step:** Create `schema.prisma` first draft or Next.js Folder / Module Structure Spec
