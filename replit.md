# MLB Daily Betting Insights Platform

## Overview

This is a full-stack web application built for providing daily MLB betting insights with AI-generated game analysis. The platform displays MLB games with comprehensive odds, betting data, and AI-powered summaries to help users make informed betting decisions.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: TailwindCSS with Radix UI components (shadcn/ui)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local state with hooks
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured routes
- **Data Storage**: In-memory storage with Drizzle ORM schema definitions
- **External APIs**: Integration with sports odds APIs and OpenAI

### Data Storage Solutions
- **Primary Storage**: In-memory storage implementation (MemStorage class)
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Migration Support**: Drizzle-kit for database migrations

## Key Components

### Frontend Components
1. **Game Management**
   - GameCard: Individual game display with odds and betting options
   - BettingSlip: Shopping cart-style betting interface
   - KellyCalculator: Mathematical betting optimization tool

2. **Navigation & Layout**
   - Header: Main navigation with betting slip indicator
   - MobileNav: Bottom tab navigation for mobile devices
   - Responsive design with mobile-first approach

3. **Data Visualization**
   - Real-time odds display
   - AI confidence indicators
   - Betting statistics and performance tracking

### Backend Services
1. **Odds Service** (`server/services/odds.ts`)
   - Fetches live MLB game data and odds
   - Processes and normalizes odds data from multiple sources
   - Handles team code mapping and game scheduling

2. **OpenAI Service** (`server/services/openai.ts`)
   - Generates AI-powered game analysis and summaries
   - Calculates value betting opportunities
   - Provides confidence scoring for predictions

3. **Storage Layer** (`server/storage.ts`)
   - Manages games, odds, bets, and AI summaries
   - Implements CRUD operations for all data entities
   - Handles user management and betting history

## Data Flow

1. **Game Data Pipeline**:
   - External odds API → Odds service → Storage layer → REST API → Frontend
   - Real-time updates with configurable refresh intervals

2. **AI Analysis Pipeline**:
   - Game data → OpenAI API → Analysis processing → Storage → Frontend display

3. **Betting Flow**:
   - User selections → Betting slip → Validation → Storage → Confirmation

4. **User Interface**:
   - Responsive design adapts to mobile/desktop
   - Real-time updates via React Query
   - Toast notifications for user feedback

## External Dependencies

### Core Dependencies
- **UI Framework**: React 18+ with TypeScript
- **Styling**: TailwindCSS, Radix UI primitives
- **Data Fetching**: TanStack React Query
- **Database**: Drizzle ORM with PostgreSQL support
- **AI Integration**: OpenAI API for game analysis

### Sports Data Integration
- **Odds APIs**: The Odds API or similar services
- **Data Processing**: Real-time odds normalization and team mapping
- **Rate Limiting**: Configurable API request throttling

### Development Tools
- **Build System**: Vite with React plugin
- **Development**: Hot module replacement, error overlay
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint, Prettier (implied)

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: Full-stack development with automatic rebuilds
- **Environment Variables**: Database URL, OpenAI API key configuration

### Production Build
- **Frontend**: Static asset generation via Vite
- **Backend**: ESBuild bundling for Node.js deployment
- **Asset Management**: Optimized builds with code splitting

### Database Management
- **Migrations**: Drizzle-kit for schema management
- **Connection**: PostgreSQL with connection pooling
- **Session Storage**: Persistent session management

### Replit-Specific Features
- **Development Integration**: Replit-specific plugins and error handling
- **Asset Management**: Attached assets support
- **Environment Detection**: Automatic development/production switching

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 29, 2025. Initial setup