# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cally (캘리) is a Korean experience campaign (체험단) aggregator service that crawls multiple campaign sites and provides unified search with Google Calendar integration. Users can search campaigns, bookmark them, track applications, and sync selections to Google Calendar.

## Development Commands

```bash
# Next.js development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Python crawler (from /crawler directory)
cd crawler
python -m venv venv && source venv/bin/activate  # Setup virtualenv
pip install -r requirements.txt
python -m crawler.main                            # Run crawler
python -m crawler.main --mode=full               # Full crawl (all pages)
python -m crawler.main --mode=incremental        # Only new campaigns
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Crawler**: Python (BeautifulSoup, requests), GitHub Actions (scheduled runs at 09:00/22:00 KST)
- **Calendar**: Google Calendar API
- **Deployment**: Vercel

### Key Directory Structure
- `app/(main)/` - Main service pages (search, my campaigns, settings)
- `app/(auth)/` - Login page
- `app/api/` - API routes (campaigns, applications, auth callbacks, admin)
- `components/ui/` - Reusable UI components (Button, Card, Header, Footer)
- `components/features/` - Feature-specific components (CampaignCard, SearchFilters, Calendar)
- `lib/` - Utilities and clients (supabase.ts for browser, supabase-server.ts for server)
- `crawler/sites/` - Site-specific crawler modules (each exports `crawl()` function)
- `types/database.ts` - Supabase database types

### Data Flow
1. **Crawler** (Python): Crawls campaign sites → stores in Supabase `campaigns` table
2. **API Routes**: Query Supabase, handle user applications/bookmarks
3. **Client Components**: Use `lib/supabase.ts` (browser client)
4. **Server Components/API**: Use `lib/supabase-server.ts` (server client with cookies)

### Authentication
- OAuth providers: Google (login + Calendar), Naver (login with session sharing for one-click campaign applications)
- Supabase Auth handles session management
- Naver login uses custom implementation (`/api/auth/naver/*`) for session sharing strategy

### Crawler Architecture
- Each site module in `crawler/sites/` implements `crawl() -> List[Campaign]`
- `crawler/main.py` orchestrates all crawlers with parallel processing
- Modes: `auto` (detects if table is empty), `full`, `incremental`
- Sites with `robots.txt` violations are commented out in `SITES` list
- Review deadline info is enriched via detail page crawling (`utils_detail.py`)

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth (login + calendar)
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` - Naver OAuth

## Code Conventions

- Korean comments and UI strings are common throughout the codebase
- Campaign status flow: 북마크(bookmark) → 신청중(applied) → 선정(selected) → 완료(completed)
- Path alias: `@/` maps to project root (e.g., `@/lib/supabase`)
- Tests are in `__tests__/` directory using Jest with React Testing Library
