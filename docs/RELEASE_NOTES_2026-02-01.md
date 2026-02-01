# Release Notes - February 1, 2026

## Summary

This release adds significant new capabilities across three major areas:
1. **Analytics Pipeline** - Problem/Resolution codes with BI reporting
2. **CRM Module** - Deal pipelines, customer interactions, and lead management
3. **Accounting Compliance** - Period controls, audit logging, tax tracking, and 1099 reporting

---

## 1. Analytics Pipeline (Standard Codes System)

### New Database Tables

#### `standard_codes`
Master table for standardized problem and resolution codes used in ticket analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique code identifier (e.g., `NO-COOL-AIRFLOW`) |
| `code_type` | TEXT | `problem` or `resolution` |
| `label` | TEXT | Human-readable label |
| `description` | TEXT | Detailed description |
| `category` | TEXT | Grouping: electrical, airflow, refrigerant, safety, usage, drainage, mechanical |
| `severity` | INTEGER | 1-10 scale |
| `triggers_sales_lead` | BOOLEAN | Auto-flags ticket as sales opportunity |
| `triggers_urgent_review` | BOOLEAN | Auto-flags for management review |
| `is_critical_safety` | BOOLEAN | Shows safety warning when selected |
| `is_active` | BOOLEAN | Whether code is available for selection |
| `sort_order` | INTEGER | Display ordering |

### New Columns on `tickets`

| Column | Type | Description |
|--------|------|-------------|
| `problem_code` | TEXT | FK to standard_codes |
| `resolution_code` | TEXT | FK to standard_codes |
| `sales_opportunity_flag` | BOOLEAN | Auto-set when trigger codes used |
| `urgent_review_flag` | BOOLEAN | Auto-set for temporary fixes |

### Pre-seeded HVAC Codes

**Problem Codes (25+):**
- `NO-COOL-AIRFLOW` - No cooling, airflow issue
- `NO-COOL-REFRIG` - No cooling, refrigerant issue
- `NO-HEAT-IGNITION` - No heat, ignition failure
- `NOISE-COMPRESSOR` - Unusual noise from compressor
- `LEAK-REFRIGERANT` - Refrigerant leak detected
- `SAFETY-GAS-LEAK` - Gas leak (critical safety)
- And more...

**Resolution Codes (25+):**
- `RES-CAPACITOR-REPLACE` - Replaced capacitor
- `RES-REFRIG-RECHARGE` - Recharged refrigerant
- `RES-FILTER-REPLACE` - Replaced air filter
- `RES-RECOMMEND-REPLACE` - Recommended system replacement (triggers sales lead)
- `RES-TEMP-REPAIR` - Temporary repair (triggers urgent review)
- And more...

### New Analytics Views

#### `vw_problem_pareto`
Pareto analysis showing top problem codes by frequency with cumulative percentages.

```sql
SELECT * FROM vw_problem_pareto;
-- Returns: code, label, category, severity, ticket_count,
--          percentage_of_total, cumulative_percentage, total_revenue
```

#### `vw_rework_analysis`
Identifies potential rework by finding repeat visits to the same customer within 30 days.

```sql
SELECT * FROM vw_rework_analysis;
-- Returns: original_ticket_id, rework_ticket_id, customer_name,
--          days_between, original_problem, rework_problem, technician_name
```

#### `vw_equipment_reliability`
Equipment failure analysis showing MTBF and failure rates by manufacturer/model.

```sql
SELECT * FROM vw_equipment_reliability;
-- Returns: manufacturer, model_number, equipment_count, total_failures,
--          mtbf_days, failure_rate, avg_equipment_age_years
```

#### `vw_sales_opportunities`
Lists all tickets flagged as sales opportunities with customer and equipment details.

```sql
SELECT * FROM vw_sales_opportunities;
-- Returns: ticket_id, ticket_number, customer_name, equipment_manufacturer,
--          equipment_age_years, problem_code, resolution_code, technician_name
```

### New BI Report Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ProblemParetoReport.tsx` | `/src/components/BI/` | Interactive Pareto chart with cumulative line |
| `ReworkAnalysisReport.tsx` | `/src/components/BI/` | Rework detection with drill-down |
| `EquipmentReliabilityReport.tsx` | `/src/components/BI/` | MTBF and reliability metrics |

### Automation Triggers

1. **Sales Opportunity Auto-Flag**: When a technician selects a resolution code with `triggers_sales_lead = true`, the ticket is automatically flagged as a sales opportunity.

2. **Urgent Review Auto-Flag**: When a resolution code with `triggers_urgent_review = true` is used (e.g., temporary repairs), the ticket is flagged for management review.

3. **Safety Warnings**: When selecting a problem code with `is_critical_safety = true`, the UI displays a safety warning.

### UI Updates

- **NewTicketModal**: Added Problem Code dropdown
- **TechnicianTicketView**: Added Problem Code and Resolution Code dropdowns
- **TicketDetailModal**: Displays selected codes with color-coded categories

---

## 2. CRM Module

### New Database Tables

#### `deal_pipelines`
Sales pipelines for tracking deals through stages (Kanban boards).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Pipeline name |
| `description` | TEXT | Pipeline description |
| `is_default` | BOOLEAN | Default pipeline flag |
| `is_active` | BOOLEAN | Active status |
| `sort_order` | INTEGER | Display ordering |

**Pre-seeded Pipelines:**
- Residential Sales (default)
- Commercial Contracts

#### `deal_stages`
Stages within a sales pipeline (Kanban columns).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `pipeline_id` | UUID | FK to deal_pipelines |
| `name` | TEXT | Stage name |
| `probability` | INTEGER | Win probability (0-100%) |
| `sort_order` | INTEGER | Column order |
| `is_won` | BOOLEAN | Marks winning stage |
| `is_lost` | BOOLEAN | Marks losing stage |
| `color` | TEXT | Hex color for UI |

**Pre-seeded Stages (Residential Sales):**
1. New Lead (10%)
2. Site Visit Scheduled (25%)
3. Proposal Sent (50%)
4. Negotiation (75%)
5. Won (100%)
6. Lost (0%)

#### `customer_interactions`
Customer touchpoint logging for 360-degree view.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `customer_id` | UUID | FK to customers |
| `interaction_type` | TEXT | call, email, sms, meeting, note, site_visit |
| `direction` | TEXT | inbound or outbound |
| `subject` | TEXT | Interaction subject |
| `notes` | TEXT | Detailed notes |
| `duration_minutes` | INTEGER | Call/meeting duration |
| `outcome` | TEXT | Result of interaction |
| `follow_up_date` | DATE | Scheduled follow-up |
| `related_ticket_id` | UUID | Optional link to ticket |
| `related_estimate_id` | UUID | Optional link to estimate |
| `created_by` | UUID | User who logged it |

### New Columns on `customers`

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | lead, active, or churned |
| `lead_source` | TEXT | Where the lead came from |
| `converted_at` | TIMESTAMPTZ | When lead became customer |
| `churned_at` | TIMESTAMPTZ | When customer churned |
| `prospect_replacement_flag` | BOOLEAN | Flagged for equipment replacement |

### New Columns on `estimates`

| Column | Type | Description |
|--------|------|-------------|
| `deal_stage_id` | UUID | FK to deal_stages |
| `expected_close_date` | DATE | Projected close date |
| `lost_reason` | TEXT | Why deal was lost |
| `days_in_stage` | INTEGER | Time in current stage |
| `stage_entered_at` | TIMESTAMPTZ | When entered current stage |

### New CRM Views

#### `vw_customer_timeline`
Unified timeline of all customer touchpoints (interactions, tickets, estimates).

```sql
SELECT * FROM vw_customer_timeline WHERE customer_id = 'uuid';
-- Returns chronological list of all customer events
```

#### `vw_leads_inbox`
Lead management inbox showing qualification status.

```sql
SELECT * FROM vw_leads_inbox;
-- Returns: id, name, email, phone, lead_source, interaction_count,
--          last_interaction, estimate_count, pending_estimate_value
```

#### `vw_sales_pipeline`
Kanban view of deals in pipeline stages.

```sql
SELECT * FROM vw_sales_pipeline;
-- Returns: estimate_id, estimate_number, title, total_amount, stage_name,
--          probability, customer_name, expected_close_date, days_in_stage
```

### Automation

**Sales Interaction Trigger**: When a ticket is flagged as a sales opportunity, the system automatically:
1. Creates a customer interaction record documenting the opportunity
2. Sets the customer's `prospect_replacement_flag` to true

---

## 3. Accounting Compliance

### New Database Tables

#### `accounting_periods`
Fiscal periods for controlling GL entry modifications (month closing).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Period name (e.g., "January 2026") |
| `start_date` | DATE | Period start |
| `end_date` | DATE | Period end |
| `fiscal_year` | INTEGER | Fiscal year |
| `fiscal_period` | INTEGER | Period number (1-12) |
| `status` | ENUM | open, closing, or closed |
| `locked_at` | TIMESTAMPTZ | When period was locked |
| `locked_by` | UUID | Who locked it |
| `locked_reason` | TEXT | Reason for locking |

**Auto-seeded**: All 12 months of the current year are created as "open" periods.

#### `gl_audit_log`
Forensic audit trail for all GL changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `gl_entry_id` | UUID | Reference to GL entry |
| `entry_number` | TEXT | GL entry number |
| `action` | ENUM | insert, update, void, delete_attempt |
| `changed_fields` | JSONB | Which fields changed |
| `old_values` | JSONB | Previous values |
| `new_values` | JSONB | New values |
| `reason` | TEXT | Reason for change |
| `performed_by` | UUID | User who made change |
| `ip_address` | INET | Client IP |
| `user_agent` | TEXT | Browser/client info |

#### `tax_jurisdictions`
Tax authorities and rates by jurisdiction.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Jurisdiction name |
| `code` | TEXT | Jurisdiction code |
| `state_code` | TEXT | State abbreviation |
| `level` | TEXT | state, county, city, special |
| `tax_rate` | DECIMAL | Tax rate (e.g., 0.0700 for 7%) |
| `agency_name` | TEXT | Tax authority name |
| `is_active` | BOOLEAN | Active status |
| `effective_date` | DATE | When rate became effective |

**Pre-seeded Jurisdictions (Tri-State Pilot):**
- Mississippi State (7.00%)
- Louisiana State (4.45%)
- Alabama State (4.00%)
- Hinds County, MS (1.00%)
- Jackson, MS (1.00%)
- New Orleans, LA (5.00%)
- Jefferson Parish, LA (5.00%)
- Birmingham, AL (4.00%)
- Mobile, AL (5.00%)

#### `tax_ledger`
Per-transaction tax collection tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_source_type` | TEXT | invoice, credit_memo, bill |
| `transaction_source_id` | UUID | Reference to source document |
| `jurisdiction_id` | UUID | FK to tax_jurisdictions |
| `taxable_amount` | DECIMAL | Amount subject to tax |
| `tax_amount` | DECIMAL | Tax collected |
| `transaction_date` | DATE | Transaction date |
| `is_remitted` | BOOLEAN | Whether tax has been paid to authority |
| `remitted_at` | TIMESTAMPTZ | When tax was remitted |

### New Columns on `gl_entries`

| Column | Type | Description |
|--------|------|-------------|
| `is_voided` | BOOLEAN | Whether entry has been voided |
| `voided_at` | TIMESTAMPTZ | When voided |
| `voided_by` | UUID | Who voided it |
| `void_reason` | TEXT | Reason for voiding |
| `reversing_entry_id` | UUID | Reference to reversing entry |

### New Columns on `vendors`

| Column | Type | Description |
|--------|------|-------------|
| `tax_id_number` | TEXT | Vendor's tax ID (for 1099) |
| `is_1099_eligible` | BOOLEAN | Whether vendor gets 1099 |
| `default_1099_box` | TEXT | NEC, MISC, RENT, or ROYALTIES |

### Compliance Views

#### `vw_trial_balance`
CPA-ready trial balance showing all account balances.

```sql
SELECT * FROM vw_trial_balance;
-- Returns: account_code, account_name, account_type,
--          total_debits, total_credits, balance
```

#### `vw_sales_tax_liability`
Tax liability summary by jurisdiction and period.

```sql
SELECT * FROM vw_sales_tax_liability;
-- Returns: jurisdiction, state_code, period_start, period_end,
--          taxable_sales, tax_collected, amount_remitted, amount_due
```

#### `vw_1099_report`
Year-end 1099 preparation for eligible vendors.

```sql
SELECT * FROM vw_1099_report WHERE tax_year = 2026;
-- Returns: vendor_name, tax_id_number, box_type, address,
--          payment_count, total_paid (only vendors >= $600)
```

#### `vw_accounting_period_status`
Period status with entry counts and totals.

```sql
SELECT * FROM vw_accounting_period_status;
-- Returns: name, fiscal_year, fiscal_period, status,
--          locked_at, entry_count, total_debits, total_credits
```

### Compliance Functions

#### `void_gl_entry(entry_id, reason)`
Safely void a GL entry by creating a reversing entry.

```sql
SELECT void_gl_entry('entry-uuid', 'Duplicate entry');
-- Returns: { success: true, voided_entry_id: '...', reversing_entry_id: '...' }
```

### Enforcement Triggers

1. **GL Delete Prevention**: Any attempt to DELETE a GL entry is blocked and logged. Users must use the void function instead.

2. **Period Lock Enforcement**: Attempting to INSERT or UPDATE GL entries in a closed period raises an error.

3. **GL Audit Logging**: All GL inserts, updates, and voids are automatically logged to `gl_audit_log`.

---

## Database Migrations

Run these migrations in order:

1. `20260201100001_create_standard_codes.sql` - Standard codes table
2. `20260201100002_add_ticket_code_columns.sql` - Ticket code columns
3. `20260201100003_seed_hvac_codes.sql` - Pre-seeded HVAC codes
4. `20260201100004_create_analytics_views.sql` - Analytics views
5. `20260201100005_create_code_triggers.sql` - Automation triggers
6. `20260201100006_create_crm_tables.sql` - CRM module
7. `20260201100007_create_accounting_compliance.sql` - Accounting compliance

---

## Previously Completed Features (Verified)

The following features were already implemented and verified during this release:

### BI Report Exports
All 10 BI reports support PDF, Excel, and CSV export via:
- `ExportService.ts` - Export logic
- `ExportMenu.tsx` - UI dropdown

### Data Import
All 5 entity types are enabled:
- Customers
- Open AR (Accounts Receivable)
- Vendors
- Items/Parts
- Historical Data

### Bank Reconciliation
Full reconciliation workflow with:
- `BankStatementImport.tsx` - CSV/OFX upload
- `TransactionMatcher.tsx` - Match bank lines to GL entries
- `AdjustmentForm.tsx` - Bank fees, interest, corrections

### Accounts Payable
Full AP module with:
- `BillsView.tsx` - Bill list and management
- `NewBillModal.tsx` - Create vendor bills
- `BillDetailModal.tsx` - View/edit bills
- `RecordPaymentModal.tsx` - Pay vendor bills
- `APAgingReport.tsx` - AP aging analysis

---

## File Changes Summary

### New Files (17)
- `project/src/components/BI/ProblemParetoReport.tsx`
- `project/src/components/BI/ReworkAnalysisReport.tsx`
- `project/src/components/BI/EquipmentReliabilityReport.tsx`
- `project/supabase/migrations/20260201100001_create_standard_codes.sql`
- `project/supabase/migrations/20260201100002_add_ticket_code_columns.sql`
- `project/supabase/migrations/20260201100003_seed_hvac_codes.sql`
- `project/supabase/migrations/20260201100004_create_analytics_views.sql`
- `project/supabase/migrations/20260201100005_create_code_triggers.sql`
- `project/supabase/migrations/20260201100006_create_crm_tables.sql`
- `project/supabase/migrations/20260201100007_create_accounting_compliance.sql`
- `docs/CRM/` directory with implementation plans

### Modified Files (3)
- `project/src/components/Dispatch/TicketDetailModal.tsx`
- `project/src/components/Tickets/NewTicketModal.tsx`
- `project/src/components/Tickets/TechnicianTicketView.tsx`
