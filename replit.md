# ClearEdge Bets - MLB Betting Intelligence Platform

## Overview
ClearEdge Bets is a full-stack web application providing daily MLB betting insights augmented by AI-generated game analysis. The platform aims to display MLB games with comprehensive odds, betting data, and AI-powered summaries to empower users in making informed betting decisions. It focuses on delivering professional-grade betting intelligence through authentic data integration and sophisticated analytical tools, positioning itself as a comprehensive solution for sports bettors seeking an edge.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: TailwindCSS with Radix UI components (shadcn/ui)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local state with hooks
- **Build Tool**: Vite
- **UI/UX**: Patriotic red, white, and blue theme; dark theme by default; no gradients; clean, professional appearance; mobile-first responsive design; traditional betting layout format with stacked teams and odds buttons; integrated betting slip for easy management.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API
- **Data Storage**: PostgreSQL database with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL session store
- **Key Services**:
    - **Odds Service**: Fetches, processes, and normalizes live MLB game data and odds.
    - **OpenAI Service**: Generates AI-powered game analysis, summaries, and identifies value betting opportunities with confidence scoring.
    - **Storage Layer**: Manages all data entities (games, odds, bets, AI summaries, users, betting history, virtual bets, groups, referral data).

### Core Features
- **Game Management**: Displays games with odds, betting options, AI analysis, suggested bets, and real-time score updates.
- **Betting System**: Supports individual and parlay bets; virtual sportsbook for paper trading; comprehensive bankroll management; automatic bet settlement and reconciliation.
- **AI Integration**: AI-powered game analysis, daily picks, suggested bets, and an interactive AI Betting Assistant for contextual insights.
- **Analytics & Tools**: Kelly Calculator for bet sizing; Enhanced Odds Analysis with implied probabilities and vig calculations; Team Power Scores with matchup analysis; Performance Analytics.
- **User Management**: Tiered subscription model (Free, Pro, Elite) with access control; user authentication; admin panel for user and API management.
- **Community Features**: Groups functionality with creation, joining, and management.
- **Referral System**: Tracks commissions and manages payouts.
- **Multi-Sport Expansion**: Foundation for additional sports like CFL, NHL, and NBA.

## External Dependencies

- **UI Framework**: React
- **Styling**: TailwindCSS, Radix UI primitives
- **Data Fetching**: TanStack React Query
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Sports Data APIs**: The Odds API, Major League Baseball RapidAPI (for live scores, game data, pitcher stats), RapidAPI MLB picks endpoint, American Football API (for CFL data), Baseball Reference (for team power scoring data).
- **Payment Processing**: Stripe
- **News/Content**: ESPN MLB News
- **Weather Data**: OpenWeatherMap
- **Scheduling**: Node-cron (for automated tasks like daily picks generation and bet settlement)