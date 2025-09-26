# Overview

This is a Customer Relationship Management (CRM) system called "CRM PGK" built as a full-stack web application. The application manages clients, tasks, and categories with a sales pipeline workflow. It provides a complete business management solution for tracking client relationships, managing tasks, and organizing work by categories. The system features a modern React frontend with a comprehensive UI component library and an Express.js backend with PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: Comprehensive shadcn/ui component system built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage**: In-memory storage implementation with interface for database persistence
- **API Design**: RESTful API endpoints with JSON request/response format
- **Validation**: Zod schemas shared between frontend and backend for consistent validation

## Data Storage
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Database migrations managed through Drizzle Kit
- **Connection**: Connection pooling through @neondatabase/serverless driver

## Core Data Models
- **Categories**: Configurable client categories with color coding
- **Clients**: Client management with contact information, pipeline status, and category assignment
- **Tasks**: Task management system with priority levels, status tracking, and client associations
- **Pipeline**: Five-stage sales pipeline (nuevo, presupuesto-enviado, presupuesto-pagado, en-tareas, terminado)

## Development Architecture
- **Monorepo Structure**: Shared schemas and types between client and server
- **Development Server**: Vite development server with HMR and Express integration
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared modules

## Recent Changes

### September 26, 2025 - Complete Authentication System Implementation
- **✅ Secure Authentication**: Implemented production-ready authentication using Passport.js with local strategy
- **✅ User Management**: Created users table with secure password hashing using scrypt and per-user salts
- **✅ Session Security**: Configured Express sessions with PostgreSQL session store and security hardening:
  - HttpOnly and secure cookies for HTTPS in production
  - SameSite protection against CSRF attacks
  - Session regeneration on login to prevent session fixation
- **✅ Route Protection**: All API routes protected with requireAuth middleware
- **✅ Security Measures**: Production-ready security implemented:
  - Rate limiting on authentication endpoints (5 attempts per 15 minutes)
  - Helmet.js for security headers and CSP protection
  - Registration endpoint disabled for security (only 2 predefined users)
  - Input validation with Zod schemas
- **✅ Default Users**: Two secure users created for system access:
  - info@bizneswhiszpanii.com
  - admin@pgkhiszpania.com
- **✅ Frontend Integration**: Complete authentication flow with login page and automatic redirection
- **✅ Mobile Responsive**: Authentication works seamlessly on all device sizes
- **✅ Testing Verified**: Complete authentication flow tested and working correctly

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL hosting)
- **Authentication**: Passport.js for secure authentication with express-session persistence
- **Security**: Helmet.js for security headers, express-rate-limit for brute force protection
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Validation**: Zod for runtime type validation and schema definitions
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Replit-specific plugins for development environment integration