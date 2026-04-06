# Export / Reporting Specification

## 1. Document Purpose

This document defines the reporting model, export behavior, aggregation rules, and output expectations for the hatchery web system.

It is written after:
- the **Business & Feature Specification**
- the **Technical Design Overview**
- the **Page Flow**
- the **Database Schema Draft**
- the **Permission Matrix**
- the **API / Server Action Specification**
- the **Scheduler / Automation Specification**

This document defines:
- report types
- report filters
- aggregation scope
- export file behavior
- `REAL` vs `DEMO` reporting rules
- deleted-record handling in reports
- Excel / CSV / PDF output expectations
- Telegram summary relationship to reporting logic

This document does **not** yet define:
- exact UI component styling
- final spreadsheet cell formatting
- final PDF visual layout implementation code
- exact chart library configuration
- caching strategy implementation details

## 2. Reporting Goals

The reporting and export layer must support:

1. operational review for heads/admins
2. clean export output for internal use
3. summary visibility for decision making
4. safe separation between real and demo data
5. date-based filtering for daily, weekly, monthly, and custom periods
6. consistent numbers across dashboard, export, and Telegram summaries

## 3. Reporting Principles

### 3.1 Database-Driven Reporting
All reports and exports must be generated from database records.

Rules:
- database is the source of truth
- exports are outputs, not primary records
- Telegram summaries should be based on the same reporting logic where practical

### 3.2 Real vs Demo Separation
Reports must clearly control whether they use:
- `REAL`
- `DEMO`

Default rule:
- admin reports default to `REAL`
- showcase reports use `DEMO` only

### 3.3 Soft Delete Awareness
Deleted operational records should not silently disappear from all reporting contexts.

Default rule:
- normal reports exclude soft-deleted records
- admin may optionally include deleted records in filtered reports/export
- public/showcase reports never include deleted real records

### 3.4 Consistent Timezone Interpretation
All report date logic should use:
- `Asia/Bangkok`

This affects:
- daily buckets
- weekly buckets
- monthly buckets
- Telegram summary date logic
- PDF report titles
- export date labels

### 3.5 Human-Readable Output
Reports must be readable by non-technical users.

This means:
- clear labels
- consistent units
- obvious section grouping
- visible date ranges
- simple tables for exported files

## 4. Reporting Audience

## 4.1 Head / Admin
Can access:
- real dashboards
- filtered operational reports
- deleted-record-aware exports
- Excel/CSV/PDF generation

## 4.2 Owner
Can access all head-level reporting plus owner-level oversight.

## 4.3 Worker
Workers do not use the main admin reporting/export module.

Workers only see:
- current active worker dashboard
- current active worker window entries
- worker-visible forward tasks

## 4.4 Public / Customer
Public/showcase reporting is:
- demo-only
- read-only
- non-exporting by default unless a future brochure-style export is added

## 5. Core Reporting Dimensions

All report types should be filterable by some combination of:

- date range
- report type
- category
- data mode
- include/exclude deleted
- location/point where relevant
- actor/person where relevant in admin-only contexts

## 6. Main Report Types

The system should support these primary report types:

1. Daily Operational Summary
2. Weekly Summary
3. Monthly Summary
4. Custom Range Summary
5. Category-Specific Detail Report
6. Data Export Report
7. Showcase Demo Report

---

# 7. Daily Operational Summary

## 7.1 Purpose
Provide a same-day operational view for heads/admins.

## 7.2 Scope
Typical sections:
- food activity
- grow-out mortality
- nursery activity
- water preparation activity
- due forward tasks
- latest sensor highlights if desired later

## 7.3 Default Filters
- date = today in Asia/Bangkok
- `data_mode = REAL`
- exclude deleted

## 7.4 Suggested Daily Summary Outputs

### Food
- number of food submissions
- plankton types used
- destination count
- required dosing volume totals by destination
- latest food entry time

### Grow-out
- total dead count for the day
- dead count by location
- latest water quality by location if reported

### Nursery
- number of nursery submissions
- average latest density readings
- latest total cells result

### Water Preparation
- number of water-prep submissions
- total prepared volume
- latest water-quality values by point

### Tasks
- due tasks for the day
- completion visibility if added later

---

# 8. Weekly Summary

## 8.1 Purpose
Provide a 7-day or calendar-week operational view.

## 8.2 Suggested Metrics
- food submission count per day
- grow-out mortality trend
- nursery entry count trend
- water preparation volume trend
- optional average water-quality trend lines

## 8.3 Bucket Strategy
Recommended:
- use Bangkok-local daily buckets
- define week boundaries consistently in implementation
- surface clear labels in exports

---

# 9. Monthly Summary

## 9.1 Purpose
Provide a higher-level management view across a month.

## 9.2 Suggested Metrics
- total food submissions
- total grow-out mortality
- total nursery submissions
- total prepared water volume
- trend by week or by day inside the month
- operational activity distribution by category

## 9.3 Use Cases
- monthly management review
- internal planning
- export to Excel/PDF
- comparing month performance later if desired

---

# 10. Custom Range Summary

## 10.1 Purpose
Allow heads/admins to select arbitrary date ranges.

## 10.2 Required Filters
- `dateFrom`
- `dateTo`
- `dataMode`
- `includeDeleted`

## 10.3 Recommended Category Filters
- all categories
- food only
- grow-out only
- nursery only
- water preparation only

## 10.4 Recommended Optional Filters
- location
- plankton type
- water preparation point
- actor/person

These are admin-only filters and not public-facing.

---

# 11. Category-Specific Detail Reports

These reports focus on one operational domain at a time.

## 11.1 Food Detail Report

### Purpose
Show food activity and calculation outputs in detail.

### Row-level columns
- date/time
- plankton type
- measured concentration
- destination
- target concentration used
- water volume used
- required dosing volume
- created by
- deleted status (optional admin view)

### Suggested aggregations
- total submissions
- total dosing volume by destination
- total dosing volume by plankton type

---

## 11.2 Grow-out Detail Report

### Purpose
Show mortality and water-quality records by grow-out location.

### Row-level columns
- date/time
- location
- dead count
- pH
- Ammonia
- Nitrite
- Alkaline
- Salinity
- created by
- deleted status (optional admin view)

### Suggested aggregations
- total dead count
- dead count by location
- latest water quality per location

---

## 11.3 Nursery Detail Report

### Purpose
Show nursery counts and calculated outputs.

### Row-level columns
- date/time
- dilution volume
- repeated count values
- average count
- total cells
- density
- pH
- Ammonia
- Nitrite
- Alkaline
- Salinity
- created by
- deleted status (optional admin view)

### Suggested aggregations
- submission count
- average density over range
- latest total cells result

---

## 11.4 Water Preparation Detail Report

### Purpose
Show prepared water records by preparation point.

### Row-level columns
- date/time
- preparation point
- prepared volume (tons)
- salinity
- pH
- Ammonia
- Nitrite
- Alkaline
- created by
- deleted status (optional admin view)

### Suggested aggregations
- total prepared volume
- latest quality values by point
- submission count by point

---

# 12. Dashboard Reporting vs Export Reporting

## 12.1 Dashboard Reporting
Dashboard reports are optimized for:
- on-screen review
- summary cards
- charts
- latest-record widgets
- fast filtering

## 12.2 Export Reporting
Export reports are optimized for:
- downloading
- sharing
- archiving
- offline review
- external use by internal staff

### Key difference
Dashboards may show compact summaries.  
Exports must preserve enough tabular detail for real operational review.

---

# 13. Export Types

The system must support:

- Excel
- CSV
- PDF

## 13.1 Excel Export

### Purpose
Provide structured, spreadsheet-friendly exports.

### Good use cases
- internal analysis
- further calculations
- sharing with staff
- archiving operational records

### Recommended structure
Option A:
- one workbook with multiple sheets

Example sheets:
- Summary
- Food
- Grow-out
- Nursery
- Water Preparation

Option B:
- one workbook per report request with one main sheet and optional summary sheet

### Recommendation
Start with:
- one workbook per export job
- summary sheet first
- detail sheets by category when relevant

### Excel expectations
- clear sheet names
- clear headers
- date range on top
- filters enabled
- units included in column headers when useful

---

## 13.2 CSV Export

### Purpose
Provide simple tabular export for machine use or quick spreadsheet loading.

### Use cases
- data import into other systems
- lightweight sharing
- quick admin usage

### Recommendation
CSV should usually be:
- single-category
- flat tabular
- one file per selected report dataset

---

## 13.3 PDF Export

### Purpose
Provide readable, shareable, presentation-friendly reports.

### Style direction
Per requirement:
- table-based
- clean
- simple
- visually neat, not overly decorative

### Good use cases
- management review
- sharing snapshots
- printing
- sending to non-technical stakeholders

### Recommended PDF sections
- report title
- date range
- data mode
- summary section
- category tables
- optional notes/footer

---

# 14. Report Filter Specification

## 14.1 Common Filters
Most admin reports should support:
- `reportType`
- `dateFrom`
- `dateTo`
- `dataMode`
- `includeDeleted`

## 14.2 Category Filter
Supported values:
- `ALL`
- `FOOD`
- `GROWOUT`
- `NURSERY`
- `WATER_PREP`

## 14.3 Data Mode Filter
Supported values:
- `REAL`
- `DEMO`

Default:
- admin default = `REAL`
- showcase fixed = `DEMO`

## 14.4 Include Deleted Filter
Supported values:
- `true`
- `false`

Default:
- `false`

## 14.5 Optional Admin Filters
May be added in first or later version:
- location
- plankton type
- water preparation point
- actor/person
- task visibility-related context if reporting extends there later

---

# 15. Deleted Record Handling

## 15.1 Default Behavior
Normal reports and exports exclude deleted records.

## 15.2 Admin Option
Approved heads and owners may explicitly include deleted records in reports/export for audit review.

## 15.3 Presentation Rule
If deleted records are included:
- rows should be clearly marked
- totals should either:
  - exclude deleted by default and say so
  - or clearly state that deleted rows are included

### Recommendation
When `includeDeleted = true`:
- show deleted rows with a visible status column
- provide separate counts where useful
- do not silently merge deleted records into normal totals without labeling

---

# 16. Demo vs Real Reporting Rules

## 16.1 Showcase
Showcase always uses:
- `data_mode = DEMO`

It must never expose:
- real raw records
- real names
- real keys
- admin-only metadata

## 16.2 Admin Reports
Admin may report on:
- `REAL`
- `DEMO`

But must intentionally choose demo mode when needed.

## 16.3 Export Default
Export defaults to:
- `REAL`
- `includeDeleted = false`

## 16.4 Mixed Reporting
Mixed real+demo reporting is not recommended in first version.

Recommendation:
- do not allow combined real/demo aggregates in normal reporting
- keep them separate to avoid confusion and accidental leakage

---

# 17. Aggregation Rules

## 17.1 Food Aggregations
Suggested aggregations:
- total food entry count
- total required dosing volume by destination
- total required dosing volume by plankton type
- latest concentration reading by plankton type

## 17.2 Grow-out Aggregations
Suggested aggregations:
- total dead count
- total dead count by location
- latest water-quality snapshot by location
- count of submissions by location

## 17.3 Nursery Aggregations
Suggested aggregations:
- total nursery entry count
- average density across selected range
- latest total cells
- average or latest water quality across selected range

## 17.4 Water Preparation Aggregations
Suggested aggregations:
- total prepared volume
- submission count by point
- latest quality values by point

## 17.5 Task Aggregations
If included in reporting:
- due tasks count
- due tasks list
- reminder send status if useful later

---

# 18. Telegram Summary Relationship

## 18.1 Principle
Telegram daily summary should use the same reporting logic source as admin reports where practical.

This avoids number mismatch between:
- dashboard
- export
- Telegram summary

## 18.2 Daily Summary Scope
Telegram room 3 summary should be based on:
- today's `REAL` records
- Bangkok date boundaries
- exclude deleted by default

## 18.3 Telegram Summary Sections
Recommended:
- food activity summary
- grow-out mortality summary
- nursery summary
- water preparation summary
- due tasks

---

# 19. Report Generation Workflow

## 19.1 Dashboard Report Flow
1. user selects filters
2. server validates permissions
3. server builds filtered query/queries
4. server computes aggregates
5. server returns summary payload for UI

## 19.2 Export Flow
1. user selects export type and filters
2. server validates permissions
3. server creates export job
4. server queries records and aggregates
5. server renders file
6. server stores file reference
7. server updates export job status
8. user downloads file

## 19.3 PDF Flow
1. load filtered data
2. compute summary values
3. build report sections
4. render PDF
5. persist file reference
6. return download availability

---

# 20. Suggested Export Layouts

## 20.1 Excel Layout

### Summary Sheet
Suggested sections:
- report title
- date range
- data mode
- include deleted flag
- summary cards in table form
- quick totals by category

### Food Sheet
Columns:
- Date Time
- Plankton Type
- Measured Concentration (cells/ml)
- Destination
- Target Concentration (cells/ml)
- Water Volume (L)
- Required Dosing Volume (L)
- Created By
- Deleted Status

### Grow-out Sheet
Columns:
- Date Time
- Location
- Dead Count
- pH
- Ammonia
- Nitrite
- Alkaline
- Salinity
- Created By
- Deleted Status

### Nursery Sheet
Columns:
- Date Time
- Dilution Volume (L)
- Counts
- Average Count
- Total Cells
- Density (cells/ml)
- pH
- Ammonia
- Nitrite
- Alkaline
- Salinity
- Created By
- Deleted Status

### Water Preparation Sheet
Columns:
- Date Time
- Preparation Point
- Prepared Volume (tons)
- Salinity
- pH
- Ammonia
- Nitrite
- Alkaline
- Created By
- Deleted Status

---

## 20.2 CSV Layout
Recommended:
- one category per export file
- flat rows only
- repeated counts may be represented in one joined column or normalized rows depending on export type

### Recommendation
For first version:
- joined count column for nursery CSV
- keep it simple and readable

---

## 20.3 PDF Layout
Recommended sections:
1. Header
2. Report metadata
3. Summary table
4. Category tables
5. Footer with generation timestamp

### Header
- Report title
- Date range
- Data mode
- Generated at

### Summary Table
- Food entry count
- Grow-out total dead count
- Nursery entry count
- Water preparation total volume

### Detail Tables
Use compact clean tables per category.

---

# 21. Performance Guidance

## 21.1 First-Version Strategy
Initial reporting can use live query generation directly from base tables.

## 21.2 Later Optimization Options
If volume grows, later optimization may include:
- cached aggregates
- materialized summary tables
- precomputed daily snapshots
- background export generation queues

## 21.3 Initial Index Reliance
Use the indexes already recommended in the schema draft for:
- date filtering
- data mode filtering
- deleted filtering
- category-specific lookups

---

# 22. Security and Exposure Rules

## 22.1 Public/Showcase
Must never export or display real operational raw data.

## 22.2 Worker
Workers do not use admin reporting/export pages.

## 22.3 Approved Head
Can generate reports and exports using allowed admin filters.

## 22.4 Owner
Can access all report/export functionality.

## 22.5 Sensitive Data in Exports
Consider whether exports should include:
- full worker names
- deleted markers
- internal notes

### First-version recommendation
Approved head/admin exports may include:
- creator display name
- deleted status when requested
- notes where operationally useful

Public/showcase exports should not exist in first version.

---

# 23. Recommended API/Action Alignment

The following actions should align with this document:

- admin dashboard data loader
- reports preview endpoint
- export creation action
- export status endpoint
- Telegram summary generation service

These actions should all use shared reporting query logic where possible.

---

# 24. Suggested Future Enhancements

Not required for first version, but useful later:
- side-by-side period comparison
- chart snapshot export
- report templates
- saved report presets
- automatic weekly/monthly report delivery
- CSV normalization options for nursery counts
- report watermarking for demo exports

---

# 25. Recommended Next Technical Document

The next document should be:

**Implementation Plan / Build Order**

That document should define:
- engineering build phases
- dependency order between modules
- recommended milestones
- critical-path items
- testing priorities
- production rollout order

## 26. Status

**Status:** Export / Reporting Specification Ready  
**Next Step:** Create Implementation Plan / Build Order
