# IntelliService

A comprehensive field service management application built for field service and project oriented businesses.

## Features

### Field Operations
- **Ticket Management** - Create, assign, and track service work orders and project tickets
- **Dispatch Board** - Drag-and-drop scheduling with calendar, list, and board views
- **GPS Tracking** - Real-time technician location monitoring
- **Time Clock** - Clock in/out with automatic hour calculations and approval workflow

### Customer Management
- **Customer Profiles** - Contact info, locations, service history, and financials
- **Equipment Tracking** - Serial numbers, warranty status, installed parts
- **Service Contracts** - Plan templates with discounts, SLAs, and visit tracking

### Inventory & Procurement
- **Parts & Tools** - Multi-location inventory with stock levels and reorder alerts
- **Purchase Orders** - PO creation, approval workflow, and receiving
- **Vendor Management** - Contracts, performance metrics, and payment history
- **Serialized Parts** - Individual tracking with warranty and installation history

### Projects & Estimates
- **Project Management** - Master/sub-projects, budget tracking, milestones
- **Estimates** - Line items, customer portal for approval, conversion to tickets
- **Milestone Billing** - Deposit and retainage management with GL posting

### Financial
- **Invoicing** - Auto-generation from tickets, payment tracking
- **Accounting** - Chart of accounts, journal entries, bank reconciliation
- **Payroll** - Time log integration, deductions, pay stub generation
- **AR/AP** - Aging analysis, collection tracking

### Business Intelligence
- **Reports** - Job cost, technician metrics, project margins
- **Insights** - Revenue trends, customer value, DSO, labor efficiency

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/thamain1/IntelliServiceBeta.git
cd IntelliServiceBeta/project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file in the `project` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Project Structure

```
project/
├── src/
│   ├── components/     # React components by module
│   │   ├── Accounting/
│   │   ├── Auth/
│   │   ├── BI/
│   │   ├── Contracts/
│   │   ├── Customers/
│   │   ├── Dashboard/
│   │   ├── DataImport/
│   │   ├── Dispatch/
│   │   ├── Equipment/
│   │   ├── Estimates/
│   │   ├── Help/
│   │   ├── Invoicing/
│   │   ├── Layout/
│   │   ├── Mapping/
│   │   ├── Parts/
│   │   ├── Payroll/
│   │   ├── Projects/
│   │   ├── Reports/
│   │   ├── Settings/
│   │   ├── Tickets/
│   │   ├── Tracking/
│   │   └── Vendors/
│   ├── config/         # Navigation and app configuration
│   ├── contexts/       # React contexts (Auth)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client, utilities
│   └── services/       # Business logic services
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── docs/               # Documentation
```

## Documentation

- [User Guide](docs/USER_GUIDE.md) - Comprehensive user manual
- [Quick Reference](docs/QUICK_REFERENCE.md) - Common tasks at a glance
- [Code Splitting](docs/code-splitting-implementation.md) - Performance optimization details

## Performance

The application uses route-based code splitting with React.lazy() for optimal load times:

| Metric | Value |
|--------|-------|
| Initial JS | ~58 KB |
| Initial gzipped | ~15 KB |
| Vendor chunks | React (~141 KB), Supabase (~126 KB) |
| Route chunks | 30+ lazy-loaded modules |

## User Roles

| Role | Access |
|------|--------|
| Admin | Full system access, settings, user management |
| Dispatcher | Scheduling, tickets, invoicing, customers |
| Technician | Assigned tickets, time clock, parts usage |

## License

Proprietary - All rights reserved.

## Support

For support, contact [4wardmotions Inc](mailto:support@4wardmotions.com).

---

*Powered by 4wardmotions Inc*
