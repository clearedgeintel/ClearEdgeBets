# ClearEdge Bets - MLB Betting Intelligence Platform

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
- **Primary Storage**: PostgreSQL database with Drizzle ORM (DatabaseStorage class)
- **Database Schema**: Full PostgreSQL implementation with all tables created
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

- June 30, 2025: Complete platform rebrand to "BetEdge" with new visual identity
  - Replaced "ClearEdge Bets" branding with modern "BetEdge" identity throughout platform
  - Updated logo and brand messaging to "Sports Intelligence" tagline
  - Created comprehensive feature assessment document against user requirements
  - Confirmed Free Tier is 100% complete: daily games, top 3 picks, AI reasoning, mobile-first UI
  - Identified Pro Tier gaps: missing email/Telegram alerts and odds comparison functionality
  - Documented Elite Tier implementation needs: live line movement, prop finder, parlay builder
  - Maintained dark theme aesthetic with clean, professional appearance
  - Updated header, footer, and home page with new BetEdge branding elements
- June 30, 2025: Enhanced betting interface with comprehensive result displays
  - Added game results to Games page showing final scores when available
  - Enhanced Daily Picks page with WIN/LOSS/PUSH result badges for settled picks
  - Updated My Bets page with detailed game information (team matchups vs game IDs)
  - Added game score display in game cards for completed games
  - Removed public betting percentage boxes from game cards per user request
  - Fixed AI analysis display when clicked - now properly shows content for authenticated users
  - Enhanced betting slip with team matchup format and bet type information
  - All pages now show authentic game results and betting outcomes consistently
- June 30, 2025: Successfully integrated RapidAPI American Football API for authentic CFL data
  - Replaced mock CFL data with real API integration using americanfootballapi.p.rapidapi.com
  - Fixed API URL format to proper day/month/year structure (removed incorrect "31" prefix)
  - API now returns authentic CFL games for any date: 6 games found for June 29, 2025
  - Real games include: Toronto Argonauts @ Ottawa Redblacks, European League games
  - Date filtering and target date parsing working correctly with proper API parameters
  - System displays authentic CFL odds, team codes, and scheduling data from real API source
- June 29, 2025: Integrated real MLB data API for authentic game scores and results
  - Connected to Major League Baseball RapidAPI for live game data and final scores
  - Performance page now displays actual MLB scores when available (e.g., Phillies 2, Braves 1)
  - Added MLB game data endpoint (`/api/mlb/games/:date`) with comprehensive game information
  - Real scores take priority over generated scores, fallback to realistic simulation when API unavailable
  - Fixed core scoring accuracy issue - betting results now reflect actual game outcomes
  - Enhanced Performance tracking with date selection and realistic game scores
  - Fixed date selection bug - Performance page now correctly loads different games for each selected date
  - Updated CFL schedule generation to match actual 2025 season structure (June 5 - October 25)
  - Implemented realistic CFL game timing patterns (Thursday/Friday/Saturday/Sunday) 
  - Added proper week numbering and special events (Labour Day Classic, Stampede Bowl)
- June 29, 2025: Built comprehensive admin backend system for user management and tier assignment
  - Created complete Admin Panel (`/admin`) with user management interface showing subscription tiers, status, and Stripe data
  - Implemented admin-only navigation in sidebar (visible for elite users only)
  - Added admin API endpoints: `/api/admin/stats`, `/api/admin/users`, `/api/admin/update-tier`
  - Built user management with search/filter capabilities and individual tier assignment controls
  - Added admin dashboard with user statistics (total users, tier breakdown, active subscriptions, revenue tracking)
  - Created user cards showing subscription status, end dates, Stripe customer data, and management controls
  - Populated system with sample users across all tiers for testing admin functionality
  - Enhanced result management on both Baseball and CFL picks pages with manual result setting and bulk operations
- June 29, 2025: Enhanced Games pages with date navigation and renamed to reflect expanded functionality
  - Added date navigation controls (Previous/Next/Today buttons) to both Baseball and CFL Games pages
  - Users can now view games from any date, not just today's games
  - Updated page titles from "Today's Games" to "Games" reflecting broader date range capability
  - Enhanced empty state messages to show specific dates when no games are scheduled
  - Improved query keys to include selected date for proper data fetching and caching
  - Updated sidebar navigation label from "Today's Games" to "Games" with improved description
- June 29, 2025: Removed Daily Digest pages from both Baseball and CFL sections
  - Eliminated `/daily-digest` and `/cfl/digest` routes due to slow rendering performance
  - Updated sidebar navigation to remove Daily Digest links from both sports
  - Cleaned up unused imports in App.tsx routing configuration
  - Streamlined navigation structure focusing on Games and Picks for better user experience
- June 29, 2025: Created complete CFL sub-pages matching Baseball structure
  - Built CFL Games page (`/cfl/games`) with live odds, team matchups, and betting options
  - Created CFL Daily Picks page (`/cfl/picks`) with AI-powered betting recommendations and confidence scoring
  - Developed CFL Daily Digest page (`/cfl/digest`) with comprehensive analysis, weather alerts, and trending topics
  - Updated sidebar navigation to include all CFL sub-pages (Hub, Games, Picks, Digest)
  - Added routing for new CFL pages in App.tsx with proper hierarchical structure
  - Fixed contrast issues on subscribe page pricing using semantic color variables
  - Enhanced team name visibility in game cards using proper foreground colors
- June 29, 2025: Major platform overhaul - Dark theme and hierarchical multi-sport structure
  - Implemented dark theme by default for premium sports betting aesthetic
  - Restructured sidebar navigation with hierarchical sports organization:
    - Baseball as primary sport with existing MLB features as sub-items
    - Football category with CFL as featured offering and NFL "Coming Soon"
  - Created comprehensive CFL Hub as centerpiece for Canadian Football League coverage
  - Updated color scheme to dark background with green/blue/orange accent colors
  - Added expandable/collapsible sports categories with chevron indicators
  - Enhanced branding throughout with actual ClearEdge Bets logo integration
  - Built foundation for ultimate CFL betting intelligence platform
- June 29, 2025: Complete platform rebrand and redesign with ClearEdge Bets
  - Built entirely new home page with modern hero section, stats dashboard, and game cards
  - Replaced old layout with clean header/footer structure and improved navigation
  - Implemented professional color scheme: dark green (hsl(142, 76%, 36%)) and cyan blue (hsl(195, 84%, 45%))
  - Integrated actual ClearEdge Bets logo throughout platform (header, footer, hero, sidebar)
  - Removed all gradients for cleaner, more professional appearance
  - Added comprehensive footer with branding, navigation, and legal information
  - Enhanced search and filtering capabilities on main dashboard
  - Redesigned game cards with improved AI analysis display and betting options
  - Returned to sidebar layout with multi-sport navigation structure (Baseball primary, other sports coming soon)
  - Added blurred AI analysis content with signup prompts for non-authenticated users
  - Complete site-wide rebranding from "MLB Insights" to "ClearEdge Bets"
- June 29, 2025: Implementing subscription-based betting intelligence platform
  - Added user authentication system with email/password login
  - Implemented tiered subscription model (Free, Pro $9.99/mo, Elite $19.99/mo)
  - Integrated Stripe payment processing for subscription management
  - Updated user schema with subscription fields and Stripe customer data
  - Building tiered content access control system
  - Enhanced AI analysis to prioritize pitching statistics (70% weight) over team performance (30%)
- June 29, 2025: Added PostgreSQL database integration
  - Migrated from in-memory storage to persistent PostgreSQL database
  - Created DatabaseStorage class implementing full CRUD operations
  - Successfully migrated all data models with Drizzle ORM
  - Enhanced data persistence for games, odds, AI summaries, bets, and consensus data
- June 29, 2025: Implemented left sidebar navigation and automatic AI analysis
  - Built comprehensive left sidebar with betting slip summary and live odds status
  - Automatic AI-powered game analysis generation for all MLB games by default
  - Enhanced betting insights with public sentiment tracking and consensus data
- June 29, 2025: Initial setup