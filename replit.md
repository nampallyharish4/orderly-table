# Restaurant POS System

## Overview

This is a full-featured Restaurant Point of Sale (POS) application built with React and TypeScript frontend, and a Java Spring Boot backend. The system handles table management, order processing, kitchen display, and billing operations for a restaurant. It features role-based access control with different interfaces for admins, waiters, cashiers, and kitchen staff.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server (runs on port 5000)
- **React Router v6** for client-side routing with protected routes
- Vite proxies all `/api/*` requests to the Spring Boot backend on port 8080

### UI Components & Styling
- **Shadcn/UI** component library built on Radix UI primitives
- **Tailwind CSS** with custom design tokens for the restaurant theme
- Dark theme optimized for restaurant environments with warm amber primary color

### State Management
- **React Context API** for global state:
  - `AuthContext`: User authentication, login/logout, role management
  - `OrderContext`: Orders, tables, menu items, and order operations
- Local storage for auth persistence

### Authentication & Authorization
- Role-based access control: admin, waiter, cashier, kitchen
- Protected routes that redirect based on user role permissions

### Backend
- **Java Spring Boot 3.2** running on port 8080
- **Spring Data JPA** with Hibernate 6 ORM
- **PostgreSQL** database (existing schema, ddl-auto=none)
- **hypersistence-utils** for JSONB column mapping
- CORS configured to allow all origins for development

#### API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/orders` - Fetch all orders (with payment info)
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status, items, payment info
- `DELETE /api/orders/:id` - Delete an order
- `GET /api/tables` - Fetch all tables
- `PATCH /api/tables/:id` - Update table status and current orders
- `GET /api/menu-items` - Fetch all menu items (with category info)
- `GET /api/categories` - Fetch all menu categories
- `POST /api/menu-items` - Create menu item
- `PATCH /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `GET /api/users` - Fetch all users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/settings` - Fetch restaurant settings
- `PATCH /api/settings` - Update settings

#### Database Scripts (Node.js)
- `npm run db:push` - Push schema changes to database (Drizzle)
- `npm run db:seed` - Seed initial data (users, menu items, tables)

#### ID System
- Entities use `visibleId` (string like "table-1", "order-123") as client-facing `id`
- Internal serial `dbId` for database primary key references

### Workflows
- **Start application**: `npx vite` — Frontend dev server on port 5000
- **Spring Boot Backend**: `cd backend && mvn spring-boot:run` — Backend API on port 8080

### Project Structure
```
backend/
├── pom.xml
└── src/main/java/com/kaveri/pos/
    ├── KaveriPosApplication.java
    ├── config/CorsConfig.java
    ├── entity/          # JPA entities (Order, RestaurantTable, MenuItem, etc.)
    ├── repository/      # Spring Data JPA repositories
    └── controller/      # REST controllers

src/
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn/UI base components
│   ├── auth/        # Authentication components
│   ├── layout/      # Page layout components
│   ├── menu/        # Menu item components
│   ├── orders/      # Order-related components
│   └── tables/      # Table management components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── pages/           # Route page components
└── utils/           # Utility functions

shared/
└── schema.ts        # Drizzle ORM schema (for migrations/seeding only)

scripts/
└── seed.ts          # Database seeding script
```

## External Dependencies

### UI Framework
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Lucide React for icons
- Sonner for toast notifications
- Recharts for analytics

### Backend (Java)
- Spring Boot 3.2.5
- Spring Data JPA / Hibernate 6
- PostgreSQL JDBC driver
- hypersistence-utils-hibernate-63 for JSONB support
- Jackson for JSON serialization
