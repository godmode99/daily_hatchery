# Permission Matrix

## 1. Document Purpose

This document defines the role-based access and action permissions for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**

This document defines:
- who can access each major route group
- who can create, read, update, and delete each functional area
- what changes when the worker daily URL expires
- which actions are restricted to approved heads or owner users
- how demo/showcase access differs from real operational access

This document does **not** yet define:
- middleware code
- exact policy implementation syntax
- SQL row-level security rules
- API authorization code details

## 2. Role Definitions

The system uses the following effective roles.

### 2.1 Public
Unauthenticated visitor.

Typical use:
- visits home page
- views showcase pages
- views demo dashboards

### 2.2 Customer
A public/showcase user from a business perspective.

Technical access is the same as Public unless future customer-only areas are added.

### 2.3 Worker
A worker is a person who:
- opens the daily URL
- verifies with a valid worker key
- performs operational actions inside the current active worker window

### 2.4 Pending Head
A Google-authenticated head candidate who has signed in but has not yet been approved by the owner.

### 2.5 Approved Head
A Google-authenticated and owner-approved head user.

### 2.6 Owner
A special approved head with the highest admin authority.

Initial owner account:
- `bestpratice168@gmail.com`

## 3. Permission Principles

### 3.1 Public and Demo Safety
Public/showcase users must only access:
- public pages
- showcase pages
- demo/mock data

They must never access:
- real operational routes
- real raw data
- worker entry routes
- head/admin routes
- sensor/control execution routes

### 3.2 Worker Window Restriction
Worker permissions exist only inside the current valid daily URL window.

When the daily URL expires:
- worker create is blocked
- worker update is blocked
- worker delete is blocked
- worker read of the expired worker flow is limited to the expired state/page only

### 3.3 Head Approval Restriction
Google login alone is not enough for admin use.

Pending head users may:
- sign in
- view pending approval page
- sign out

Pending head users may not:
- access admin pages
- manage settings
- view real dashboards
- export
- control sensors/actuators

### 3.4 Owner-Only Authority
The owner has additional authority for:
- approving head accounts
- disabling head accounts
- highest-level privileged oversight

### 3.5 Soft Delete Rule
Delete actions in operational areas should be treated as soft delete, not physical delete.

## 4. Access States That Affect Permission

Permission depends not only on role, but also on state.

Important state examples:
- worker key valid or invalid
- daily URL active or expired
- admin account pending/approved/disabled/rejected
- record active or soft-deleted
- demo mode vs real mode

## 5. Route Access Matrix

Legend:
- `Y` = allowed
- `N` = not allowed
- `L` = limited access
- `C` = conditional

### 5.1 Public / Showcase Routes

| Route / Area | Public | Worker | Pending Head | Approved Head | Owner |
|---|---:|---:|---:|---:|---:|
| `/` | Y | Y | Y | Y | Y |
| `/showcase` | Y | Y | Y | Y | Y |
| `/showcase/dashboard` | Y | Y | Y | Y | Y |
| `/showcase/reports` | Y | Y | Y | Y | Y |
| `/showcase/control-preview` | Y | Y | Y | Y | Y |

Rules:
- showcase routes are always demo-only
- no role may see real operational data from showcase routes

### 5.2 Worker Routes

| Route / Area | Public | Worker (verified, active link) | Worker (invalid key) | Worker (expired link) | Pending Head | Approved Head | Owner |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/entry/[dailyToken]` | C | C | C | C | C | C | C |
| `/entry/[dailyToken]/verify` | C | C | C | N | C | C | C |
| `/entry/[dailyToken]/today` | N | Y | N | N | N | Y | Y |
| `/entry/[dailyToken]/food` | N | Y | N | N | N | Y | Y |
| `/entry/[dailyToken]/growout` | N | Y | N | N | N | Y | Y |
| `/entry/[dailyToken]/nursery` | N | Y | N | N | N | Y | Y |
| `/entry/[dailyToken]/water-prep` | N | Y | N | N | N | Y | Y |
| `/entry/[dailyToken]/expired` | C | C | C | Y | C | Y | Y |

Conditional notes:
- `/entry/[dailyToken]` is accessible only if the token exists
- verification succeeds only with a valid worker key
- approved head and owner may be allowed to inspect worker flows if useful for support, but real corrections after expiry should happen through admin flows rather than pretending to be a worker

### 5.3 Admin Routes

| Route / Area | Public | Worker | Pending Head | Approved Head | Owner |
|---|---:|---:|---:|---:|---:|
| `/admin/login` | Y | Y | Y | Y | Y |
| `/admin/pending` | N | N | Y | N | N |
| `/admin` | N | N | N | Y | Y |
| `/admin/people` | N | N | N | Y | Y |
| `/admin/keys` | N | N | N | Y | Y |
| `/admin/dropdowns` | N | N | N | Y | Y |
| `/admin/calculations` | N | N | N | Y | Y |
| `/admin/tasks` | N | N | N | Y | Y |
| `/admin/dashboard` | N | N | N | Y | Y |
| `/admin/reports` | N | N | N | Y | Y |
| `/admin/export` | N | N | N | Y | Y |
| `/admin/sensors` | N | N | N | Y | Y |
| `/admin/actuators` | N | N | N | Y | Y |
| `/admin/rules` | N | N | N | Y | Y |

### 5.4 Owner-Sensitive Actions

| Owner-Sensitive Action | Approved Head | Owner |
|---|---:|---:|
| Approve pending head account | N | Y |
| Reject pending head account | N | Y |
| Disable another head account | N | Y |
| Re-enable disabled head account | N | Y |
| Transfer owner authority | N | C |

Note:
- owner transfer should be treated as a future controlled action, not a first-version routine action

## 6. CRUD Matrix by Functional Area

Legend:
- `C` = create
- `R` = read
- `U` = update
- `D` = soft delete
- `-` = no permission
- `C*` / `U*` / `D*` = conditional

## 6.1 People Records

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- hard delete should not be normal behavior
- deactivation is preferred over deletion

## 6.2 Admin Accounts

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | R* | - | - |
| Approved Head | - | R* | - | - |
| Owner | Y* | Y | Y | C* |

Notes:
- approved heads may read their own profile state
- owner handles approval state changes

## 6.3 Worker Keys

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- delete should normally mean disable/inactivate, not physical delete

## 6.4 Daily Links

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | R* | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | R | U* | - | - |
| Owner | R | U* | - | - |
| System Scheduler | Y | Y | Y | - |

Notes:
- workers do not manage daily links; they only consume a valid token route
- generation/expiration is primarily system-driven

## 6.5 Food Entries

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

Worker notes:
- worker read is limited to entries visible in the current active daily window
- worker update/delete only while the link remains valid

## 6.6 Food Entry Destinations

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y* | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

Notes:
- destination rows are created/updated as part of the food entry operation, not usually as a separate manual workflow

## 6.7 Grow-out Entries

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

## 6.8 Nursery Entries

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

## 6.9 Nursery Entry Counts

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y* | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

Notes:
- count rows are subordinate to nursery entry workflows

## 6.10 Water Preparation Entries

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker (active link) | Y | Y* | Y* | Y* |
| Worker (expired link) | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

## 6.11 Dropdown Tables

Applies to:
- plankton types
- grow-out locations
- water preparation points
- future configurable lists

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | R* | - | - |
| Worker | R* | R* | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- public/worker read is indirect through forms and demo pages
- delete should usually be deactivate, not physical remove

## 6.12 Calculation Settings

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y* | Y | Y | C* |
| Owner | Y* | Y | Y | C* |

Notes:
- first-version behavior may be effectively “update active settings,” not frequent creation
- calculation settings must not be exposed to public/showcase users

## 6.13 Forward Tasks

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | R* | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | Y |
| Owner | Y | Y | Y | Y |

Worker note:
- worker can only read tasks explicitly marked visible to workers

## 6.14 Telegram Destinations

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

## 6.15 Telegram Message Logs

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | - | Y | - | - |
| Owner | - | Y | - | - |
| System | Y | Y | Y* | - |

Notes:
- logs are primarily system-written
- admins read logs for audit/debug purposes

## 6.16 Export Jobs

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | - | - |
| Owner | Y | Y | - | - |
| System | Y* | Y | Y* | - |

## 6.17 Sensors

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | R* | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- public showcase may read demo-only sensor definitions or previews
- real sensor definitions are admin-managed

## 6.18 Sensor Readings

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | R* | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | - | Y | - | - |
| Owner | - | Y | - | - |
| Device/API | Y | - | - | - |

Notes:
- public read is demo-only via showcase if exposed at all
- real sensor readings are head-only

## 6.19 Actuators

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | R* | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- public read is demo-only if shown in showcase
- real actuator definitions are admin-managed

## 6.20 Actuator Commands

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | - | - |
| Owner | Y | Y | - | - |
| System | Y | Y | - | - |

Notes:
- manual command execution is head/owner only
- system may also generate commands from automation rules

## 6.21 Automation Rules

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | R* | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | Y | Y | Y | C* |
| Owner | Y | Y | Y | C* |

Notes:
- public showcase may read demo rule examples only
- real automation rules are head-only

## 6.22 Automation Rule Logs

| Role | C | R | U | D |
|---|---:|---:|---:|---:|
| Public | - | - | - | - |
| Worker | - | - | - | - |
| Pending Head | - | - | - | - |
| Approved Head | - | Y | - | - |
| Owner | - | Y | - | - |
| System | Y | Y | - | - |

## 7. Worker-Specific Permission Rules

### 7.1 Worker Read Scope
Workers can read:
- current active operational entries
- entries created by all workers within the current active daily window
- worker-visible forward tasks

Workers cannot read:
- past raw data outside the active worker window
- admin configuration pages
- real dashboards outside worker flow
- Telegram logs
- sensor/control areas

### 7.2 Worker Create Scope
Workers can create:
- food entries
- grow-out entries
- nursery entries
- water preparation entries

Only when:
- daily link is active
- key verification succeeded
- person is active
- worker key is active

### 7.3 Worker Update Scope
Workers can update:
- operational records in the current active daily window

Only when:
- daily link remains active
- record is not deleted
- worker still has valid verified access

### 7.4 Worker Delete Scope
Workers can soft delete:
- operational records in the current active daily window

Only when:
- daily link remains active
- record is not already deleted
- worker still has valid verified access

### 7.5 Worker After Expiry
Once the daily link expires:
- worker create = blocked
- worker update = blocked
- worker delete = blocked
- worker operational dashboard = blocked
- expired screen = allowed

## 8. Head-Specific Permission Rules

Approved heads can:
- manage people
- manage worker keys
- manage dropdowns
- manage calculation settings
- manage forward tasks
- view real dashboards
- generate reports and exports
- view sensors
- manage actuators
- manage automation rules
- correct old operational data after worker expiry

Approved heads cannot:
- approve head accounts unless they are owner
- perform owner-only authority actions

## 9. Owner-Specific Permission Rules

The owner has all approved head permissions plus:
- approve pending heads
- reject pending heads
- disable head accounts
- re-enable head accounts
- oversee top-level privileged settings

## 10. Demo vs Real Data Rules

### 10.1 Public/Showcase
Public/showcase routes may only access:
- `data_mode = DEMO`

### 10.2 Worker
Worker routes should normally operate on:
- `data_mode = REAL`

### 10.3 Admin
Admin routes may access:
- `REAL`
- `DEMO`

But must use explicit filtering where relevant.

### 10.4 Export
Default export mode should be:
- `REAL`

If admins export demo data, this must be an explicit selection.

## 11. Sensitive Information Rules

The following data must never be exposed to public/showcase users:
- real hatchery raw records
- worker keys
- internal formula settings
- admin-only configuration
- real sensor values if the page is demo-only
- real actuator command capability
- approval states of internal users

The following data should not be broadly exposed to workers unless necessary:
- full worker key values
- admin account information
- Telegram logs
- export history
- automation rule internals

## 12. Implementation Guidance Notes

Recommended enforcement layers:
- route guard for public vs worker vs admin access
- server-side key verification for worker actions
- server-side approval check for admin actions
- role/mode-aware query filters
- action-level permission checks for create/update/delete
- owner-only checks for head approval actions

Recommended first enforcement priorities:
1. protect real vs demo data
2. protect worker active-window logic
3. protect admin approval flow
4. protect sensor/actuator commands
5. protect export access

## 13. Next Technical Document

The next document should be:

**API / Server Action Specification**

That document should define:
- verification actions
- operational create/update/delete actions
- admin CRUD actions
- daily URL generation actions
- Telegram send triggers
- sensor ingestion endpoint rules
- actuator command actions

## 14. Status

**Status:** Permission Matrix Ready  
**Next Step:** Create API / Server Action Specification
