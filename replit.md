# Restaurant POS System

## Overview

This is a full-featured Restaurant Point of Sale (POS) application built with React and TypeScript. The system handles table management, order processing, kitchen display, and billing operations for a restaurant. It features role-based access control with different interfaces for admins, waiters, cashiers, and kitchen staff. The application uses a dark professional theme optimized for long shifts and tablet touch targets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server (runs on port 5000)
- **React Router v6** for client-side routing with protected routes

### UI Components & Styling
- **Shadcn/UI** component library built on Radix UI primitives
- **Tailwind CSS** with custom design tokens for the restaurant theme
- **Class Variance Authority (CVA)** for component variant management
- Dark theme optimized for restaurant environments with warm amber primary color

### State Management
- **React Context API** for global state:
  - `AuthContext`: User authentication, login/logout, role management
  - `OrderContext`: Orders, tables, menu items, and order operations
- **TanStack Query** available for server state management (ready for API integration)
- Local storage for auth persistence

### Authentication & Authorization
- Role-based access control with four user types: admin, waiter, cashier, kitchen
- Demo credentials built into the app for testing different roles
- Protected routes that redirect based on user role permissions
- Route access controlled by `canAccessRoute` utility function

### Backend & Data Layer
- **Express.js** server with Vite middleware for development
- **PostgreSQL** database with Drizzle ORM for data persistence
- Database schema defined in `shared/schema.ts`
- Database connection in `server/db.ts`
- Configuration in `drizzle.config.ts`

#### API Endpoints
- `GET /api/orders` - Fetch all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status, items, payment info
- `DELETE /api/orders/:id` - Delete an order
- `GET /api/tables` - Fetch all tables
- `PATCH /api/tables/:id` - Update table status and current orders
- `GET /api/menu-items` - Fetch all menu items
- `GET /api/categories` - Fetch all menu categories

#### Database Scripts
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed initial data (users, menu items, tables)
- `npm run db:studio` - Open Drizzle Studio for database management

#### ID System
- Tables use `visibleId` (string like "table-1", "order-123") for client-facing IDs
- Internal serial `id` for database references

### Key Features
- **Dashboard**: Overview stats, active orders, revenue tracking
- **Table Management**: Visual table grid, status tracking, capacity display
- **Order System**: Create orders (dine-in/takeaway), add menu items, track status
- **Kitchen Display**: Real-time order queue, item status updates, priority indicators
- **Billing**: Payment processing (cash/card/UPI), bill printing, tax calculations

### Project Structure
```
server/
├── index.ts         # Express server with Vite middleware
├── routes.ts        # API route handlers
├── db.ts           # Database connection
└── seed.ts         # Database seeding script

src/
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn/UI base components
│   ├── auth/        # Authentication components
│   ├── layout/      # Page layout components
│   ├── menu/        # Menu item components
│   ├── orders/      # Order-related components
│   └── tables/      # Table management components
├── contexts/        # React Context providers
├── data/           # Mock data and utilities
├── hooks/          # Custom React hooks
├── pages/          # Route page components
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

shared/
└── schema.ts       # Drizzle ORM schema definitions
```

## External Dependencies

### UI Framework
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Lucide React for icons
- Embla Carousel for carousel functionality
- Vaul for drawer components

### Utilities
- **date-fns**: Date formatting and manipulation
- **clsx + tailwind-merge**: Conditional class name handling
- **react-hook-form + zod**: Form handling and validation
- **sonner**: Toast notifications

### Development
- **Vitest**: Testing framework with jsdom environment
- **ESLint**: Code linting with TypeScript and React plugins
- **TypeScript**: Strict type checking disabled for flexibility

### Audio
- Web Audio API for notification sounds (order ready alerts)

### Fonts
- Inter (UI text)
- JetBrains Mono (monospace elements)