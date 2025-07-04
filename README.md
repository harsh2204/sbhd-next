# 🎭 Somebody Has Died

> **A digital party game about arguing over a dead person's estate**

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Somebody Has Died** is a real-time multiplayer party game where players take on roles and argue over the estate of a recently deceased person. Using identity cards, relationship cards, and backstory elements, players must craft compelling arguments for why they deserve the inheritance while the Estate Keeper (game master) manages the chaos.

## 🎮 Game Overview

### How It Works
1. **Host creates a game** and shares a 4-character game code
2. **Players join** using the game code
3. **Host selects an Estate Keeper** (game master)
4. **Estate Keeper deals cards** to start the game
5. **Players argue their case** using their cards
6. **Estate Keeper awards points** and manages turns
7. **Winner takes the estate!**

### Card Types
- **🎭 Identity Cards**: Who you are (e.g., "The Ambitious Lawyer", "The Struggling Artist")
- **❤️ Relationship Cards**: Your connection to the deceased (e.g., "Ex-Partner", "Secret Child")
- **📖 Backstory Cards**: Story elements to weave in (players get 2 each)
- **⚡ Objection Cards**: Interrupt other players (awarded by Estate Keeper)

### Game Modes
- **🇬🇧 English**: Classic Western-themed cards and estates
- **🇮🇳 Desi**: South Asian-themed cards with cultural elements

## 🚀 Features

- **Real-time multiplayer** gameplay with instant updates
- **Cross-platform** - works on desktop and mobile
- **Dual language support** - English and Desi card sets
- **Role-based gameplay** - Estate Keeper vs Players
- **Live scoring system** with leaderboards
- **Event logging** for game history
- **Responsive design** with dark theme

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Styling**: Tailwind CSS with dark theme
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **Package Manager**: pnpm

## 🏗️ Architecture

### Database Schema
```sql
-- Core tables
games          # Game state, settings, deceased info, turn management
players        # Player info, cards, scores, roles  
game_events    # Event log for real-time updates and game history
card_decks     # Card definitions (future feature)
```

### Key Components
- **Game Page** (`app/game/[gameCode]/page.tsx`) - Main game interface
- **Game Utils** (`utils/gameUtils.ts`) - Core game logic and database operations
- **Card System** (`utils/gameCards.ts`) - Card definitions and game content
- **Real-time Engine** - Supabase subscriptions for live updates

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sbhd-live
   ```

2. **Navigate to the Next.js app**
   ```bash
   cd next-sbhd
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env.local` file in the `next-sbhd` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up Supabase database**
   
   Run the SQL schema in `utils/db/schemas/game.sql` in your Supabase project.

6. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Creating a Game
1. Enter your name as the host
2. Select game mode (English or Desi)
3. Click "Create Game"
4. Share the 4-character game code with players

### Joining a Game
1. Enter the game code
2. Enter your player name
3. Click "Join Game"
4. Wait for the host to select an Estate Keeper

### Playing the Game
1. **Estate Keeper** deals cards to all players
2. Players receive Identity, Relationship, and Backstory cards
3. Players take turns arguing their case for the inheritance
4. **Estate Keeper** awards points and Objection cards
5. Game continues until Estate Keeper declares a winner

## 📁 Project Structure

```
next-sbhd/
├── app/                    # Next.js App Router
│   ├── game/[gameCode]/   # Game interface
│   ├── join/              # Join game flow
│   └── page.tsx           # Home page
├── components/            # React components
│   └── game/             # Game-specific components
├── utils/                # Utilities and business logic
│   ├── db/               # Database schemas and config
│   ├── gameCards/        # Card definitions by language
│   ├── gameUtils.ts      # Core game logic
│   └── gameCards.ts      # Card system exports
├── supabase/             # Supabase configuration
└── package.json          # Dependencies and scripts
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style and patterns
- Use TypeScript for type safety
- Test real-time functionality with multiple browser tabs
- Ensure mobile responsiveness

## 🐛 Known Issues

- Game codes are case-insensitive but displayed in uppercase
- No built-in linting or type checking commands in package.json
- Real-time subscriptions may occasionally need manual refresh

## 🔮 Future Enhancements

- [ ] Additional language card sets
- [ ] Custom card creation
- [ ] Tournament mode
- [ ] Voice chat integration
- [ ] Advanced scoring algorithms
- [ ] Game replay system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Supabase](https://supabase.com/)
- Creators of original game [Someone Has Died](https://www.someonehasdiedgame.com/)
- Further inspired by party games like "The Resistance" and "Werewolf"
- Special thanks to the open-source community

---

**Ready to argue over some inheritance?** 🎭💰

[Create a game](https://sbhd.vercel.app/) • [Join a game](https://sbhd.vercel.app/join) • [Report issues](https://github.com/harsh2204/sbhd-next/issues)
