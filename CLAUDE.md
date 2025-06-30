# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Somebody Has Died" - a digital party game about arguing over a dead person's estate. It's a multiplayer real-time game built with Next.js and Supabase, featuring:

- **Real-time multiplayer gameplay** using Supabase real-time subscriptions
- **Role-based game mechanics** with Estate Keeper (game master) and Players
- **Card-based storytelling** with Identity, Relationship, Backstory, and Objection cards
- **Multi-language support** with English and Desi (South Asian) card sets
- **Turn-based rounds** with scoring and leaderboards

## Development Commands

The project is located in the `next-sbhd/` directory. All commands should be run from there:

```bash
cd next-sbhd/
```

### Core Commands
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server

### Development Notes
- No linting or type checking commands are configured in package.json
- Uses pnpm for package management (pnpm-lock.yaml present)
- TypeScript configuration exists (tsconfig.json)

## Architecture Overview

### Database Layer (Supabase)
- **games** table: Game state, settings, deceased info, turn management
- **players** table: Player info, cards, scores, roles
- **game_events** table: Event log for real-time updates and game history
- **card_decks** table: Not currently used (cards handled in memory)

### Key Files and Structure
- `app/page.tsx` - Home page for creating/joining games
- `app/join/` - Game joining flow with JoinForm component
- `app/game/[gameCode]/page.tsx` - Main game interface (1000+ lines)
- `utils/gameUtils.ts` - Core game logic and database operations
- `utils/gameCards.ts` - Card definitions and game content
- `utils/db/supabase.ts` - Database client configuration
- `utils/database.types.ts` - TypeScript types generated from Supabase

### Game Flow
1. **Host creates game** → generates deceased character and game code
2. **Players join** using 4-character game code
3. **Host selects Estate Keeper** (game master role)
4. **Estate Keeper deals cards** → game starts
5. **Turn-based gameplay** with real-time updates
6. **Scoring and round management** by Estate Keeper

### Real-time Architecture
The game uses Supabase's real-time features extensively:
- `subscribeToGameEvents()` in gameUtils.ts sets up multi-table subscriptions
- Optimized event handling in game page to minimize full state refreshes
- Event-driven updates for scores, cards, turns, and player actions

### Card System
- **Identity cards**: Character roles/occupations
- **Relationship cards**: Connection to deceased
- **Backstory cards**: Story elements to incorporate (players get 2)
- **Objection cards**: Interrupt other players (awarded by Estate Keeper)
- Supports both English and Desi (South Asian) themed card sets

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Common Development Patterns

### Database Operations
- All game actions go through utils/gameUtils.ts functions
- Operations require role validation (host/estate keeper permissions)
- Events are emitted to game_events table for real-time sync
- Player state is managed in localStorage for session persistence

### Real-time Updates
- Subscription setup in useEffect with cleanup
- Optimized event handlers that update specific state slices
- Fall back to full refresh only for complex events like initial card dealing

### Game State Management
- React state for local UI state
- Supabase for persistent game state
- Real-time subscriptions bridge the two
- Players filtered by role (estate keeper vs regular players)

### Error Handling
- Database operations return boolean success indicators
- UI shows loading states during async operations
- Game codes are case-insensitive but stored/displayed uppercase

## Styling
- Uses Tailwind CSS with dark theme
- Gradient backgrounds (slate-900 to purple-900)
- Card components with color coding by type
- Responsive design with mobile support
- Backdrop blur effects for UI panels