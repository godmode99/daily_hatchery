# Hatchery Web System Business & Feature Specification

## 1. Document Purpose

This document summarizes the agreed **business scope** and **feature scope** for the hatchery web system. It focuses on product requirements and user-facing behavior, not detailed technical architecture.

## 2. Product Vision

The web system has two main purposes:

1. **Operational use inside the hatchery**
2. **Showcase/demo presentation for customers**

The product must therefore support both:

- a **real operational workflow** for daily hatchery data entry and management
- a **mock/demo experience** that looks like the real system but does not expose actual hatchery raw data

## 3. User Roles

### 3.1 Worker
Workers are the daily operators who enter hatchery data.

Core abilities:
- Open the daily data-entry URL
- Submit data only with a valid personal key
- View the current day's dashboard
- View all entries made by the team during the current active daily cycle
- View selected forward-planning tasks that the head enables for them
- Edit/delete entries only while the daily URL is still valid

### 3.2 Head
The head is the main administrator and operational manager.

Core abilities:
- Manage keys
- Manage people
- Manage dropdown lists
- Manage calculation settings
- Manage forward-planning tasks
- View all operational data
- Export reports
- View sensor data
- Control actuators
- Configure conditions and automation logic

### 3.3 Customer
Customers only see the showcase side of the system.

Core abilities:
- View the public/showcase pages
- View demo dashboards and mock data
- View selected charts, tables, images, and workflow explanations

Restrictions:
- Customers must not see real hatchery raw data

## 4. Main Product Areas

The system is divided into the following major areas:

- Home page
- Showcase pages
- Daily data-entry page
- Head/Admin area
- Dashboard area
- Report area
- Export area
- Sensor page
- Actuator controller page

## 5. Daily Data Entry System

The daily data-entry module is the core operational module for the hatchery.

### 5.1 Access Model

Workers do **not** use a normal login flow.

Instead, the system uses:

- a **shared daily URL**
- a **personal key** per worker

Rules:
- Anyone can open the URL
- Only users with a valid key can submit, edit, or delete data
- The key is tied to a named owner
- The head can create, disable, or change keys

### 5.2 Daily URL Expiration

The daily URL:

- is shared with the team
- changes every day
- expires every day at **09:00 AM Thailand time**

Behavior after expiration:
- that URL can no longer be used for normal worker submission
- workers lose the ability to edit old entries through that expired daily flow
- after expiration, only the head may handle later corrections

### 5.3 Key Rules

The key system is intentionally simple.

Rules:
- the head can define the key text freely
- a key must not be empty
- a key must be unique
- leading and trailing spaces are automatically trimmed
- the key is linked to a named owner

The system should store:
- owner name
- key
- role
- status

## 6. Daily Data Categories

The agreed daily operational entry categories are:

1. Food
2. Grow-out
3. Nursery
4. Water Preparation

---

## 6.1 Food Entry

Purpose:
Record plankton feeding information and calculate the required volume to dose.

Worker input:
- plankton type
- measured concentration (`cells/ml`)
- destination(s) to feed

Destinations:
- Condo 1
- Condo 2
- Upwelling

Head-configured values:
- target concentration per destination
- water volume per destination

Calculation:
```text
Required dosing volume = (target concentration × water volume) ÷ measured concentration
```

Business notes:
- workers measure the tank concentration
- the head manages the configured target values and water volumes
- the system calculates the required volume automatically after submission

---

## 6.2 Grow-out Entry

Purpose:
Record mortality and water quality for grow-out locations.

Worker input:
- number of dead shellfish
- location
- water quality values:
  - pH
  - Ammonia
  - Nitrite
  - Alkaline
  - Salinity

Locations are selected from dropdown values managed by the head.

The UI may allow multiple locations in one action, but the saved operational records should be handled as separate records per location.

---

## 6.3 Nursery Entry

Purpose:
Record shellfish counts from slide sampling and calculate the estimated total number of cells/animals and density.

Worker input:
- one or more counting results from the slide
- water volume used for dilution/distribution before counting
- water quality values:
  - pH
  - Ammonia
  - Nitrite
  - Alkaline
  - Salinity

Business rule:
- workers often dilute a batch in water before counting
- the default operational case may be 10 liters, but the volume must remain editable because actual work conditions may vary

Calculation logic:
1. Average the repeated counts
2. Estimate the total number in the diluted water volume

Formula:
```text
Average count = total of all counts ÷ number of counting rounds
Total cells = average count × dilution water volume (liters) × 1000
Density (cells/ml) = total cells ÷ [dilution water volume (liters) × 1000]
```

---

## 6.4 Water Preparation Entry

Purpose:
Record prepared water quantity and water quality by preparation point.

Worker input:
- preparation point
- prepared volume (tons)
- salinity
- pH
- Ammonia
- Nitrite
- Alkaline

Initial preparation points:
- Sedimentation Pond (Before)
- Sedimentation Pond (After)
- High-Salinity Tank
- Mixing Tank
- Ready Tank 1
- Ready Tank 2

These dropdown values must be editable by the head.

## 7. Worker Dashboard

Workers must be able to see a dashboard for the current active daily cycle.

Worker dashboard behavior:
- show entries for the current active day/window
- show entries from all workers in that active period
- allow editing/deleting only while the daily URL is still valid
- show forward-planning tasks that the head chooses to expose

Once the daily URL expires:
- the old daily operational flow is no longer usable for workers
- further corrections become head-only actions

## 8. Head/Admin Capabilities

The head/admin side must include the following management functions.

### 8.1 Key Management
The head can:
- create keys
- disable keys
- change keys
- see which person owns a key

### 8.2 People Management
The head can:
- create/edit people records
- link people to keys
- assign roles

### 8.3 Dropdown Management
The head can manage dropdown values for:
- plankton types
- grow-out locations
- water preparation points
- forward-planning task items
- other operational selections if needed

### 8.4 Calculation Settings Management
The head can manage:
- water volume per location
- target concentration per location
- default nursery dilution volume
- other formula-related defaults if needed

### 8.5 Forward-Planning Task Management
The head can manage a planning schedule for future operational tasks.

Each task should support:
- task name
- start date
- repeat interval in days
- Telegram notification option
- visibility control for workers

### 8.6 Operational Data Visibility
The head can view:
- today's entries
- latest entries
- food summary
- mortality summary
- nursery summary
- water-quality summary
- charts/graphs

### 8.7 Export
The head can export data as:
- Excel
- CSV
- PDF
- Telegram summary

## 9. Customer Showcase Experience

Customers must only see the **showcase/demo layer** of the product.

Customer-facing content may include:
- mock dashboards
- mock versions of product functions
- selected charts and summaries
- selected demo tables
- images and hatchery workflow explanations
- a polished showcase experience that resembles the real system

Customers must **not** see:
- real hatchery raw data
- internal daily operational entries
- real worker names tied to operations
- real keys
- internal formulas/configuration
- real admin controls
- real sensor/control operations

## 10. Telegram Integration

The system uses three Telegram destinations/flows.

### 10.1 Room 1 — Daily URL Distribution
Used for:
- sending the daily URL to the operational team

### 10.2 Room 2 — Operational Activity Notifications
Used for:
- new entry notifications
- edit notifications
- delete notifications

Each message should include:
- who performed the action
- what was submitted/edited/deleted
- timestamp
- relevant item details

### 10.3 Room 3 — Daily Summary
Used for:
- automatic daily summary messages

Possible summary content:
- who entered data that day
- total mortality
- food-related summary
- latest water-quality summary
- due forward-planning tasks

## 11. Sensor & Actuator Control

This section is for **head-only** use.

The head must be able to:
- view sensor values
- send ON/OFF commands
- configure conditions
- define rule-based actions

Examples:
- if a sensor reaches a threshold, turn a device on/off
- if a sensor goes out of range, send a Telegram alert

Customers must not access this part of the system.

## 12. Data Visibility Policy

### Workers
Can see:
- the current active operational period
- all team entries in that active period
- selected forward-planning tasks

Cannot continue operational editing after the daily URL expires.

### Head
Can see:
- all operational information
- all management/configuration areas
- all reports and exports
- all sensor/control functions

### Customers
Can see:
- mock/demo views only

Cannot see:
- real raw hatchery data

## 13. Reporting and Export Expectations

The system should support:
- operational review dashboards
- reports
- Excel export
- CSV export
- PDF export
- Telegram summary output

The exact final report layouts can be defined in the technical design phase.

## 14. Feature Scope Already Defined

The business/feature planning is considered sufficiently defined for the following areas:

- user groups
- system purpose
- main product sections
- daily data-entry categories
- food formula business rule
- nursery formula business rule
- daily URL behavior
- key behavior
- worker edit window
- admin/head responsibilities
- customer showcase boundaries
- Telegram flows
- sensor/actuator control scope

## 15. Out of Scope for This Document

This document does **not** yet define the technical implementation details, such as:

- database schema
- page-by-page UI wireframes
- API design
- Next.js folder structure
- Vercel deployment details
- cron/scheduler implementation
- permission middleware
- export implementation logic
- mock data structure vs real data structure

Those belong to the next technical design phase.

## 16. Next Recommended Step

The next phase should focus on **technical design**, in this order:

1. Page flow / screen flow
2. Database schema
3. Role and permission logic
4. Next.js architecture
5. Telegram and scheduling logic
6. Export/report implementation plan

---
**Status:** Business & Feature Planning Completed
