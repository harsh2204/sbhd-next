'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame, joinGame } from '@/utils/gameUtils';

export default function HomePage() {
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [gameMode, setGameMode] = useState<'english' | 'desi'>('english');
  const router = useRouter();

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createGame(hostName.trim(), gameMode);
      if (result) {
        localStorage.setItem('playerId', result.playerId);
        router.push(`/game/${result.game.game_code}`);
      } else {
        setError('Failed to create game. Please try again.');
      }
    } catch (err) {
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim() || !playerName.trim()) {
      setError('Please enter both game code and your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await joinGame(joinCode.trim(), playerName.trim());
      if (result) {
        localStorage.setItem('playerId', result.playerId);
        router.push(`/game/${result.game.game_code}`);
      } else {
        setError('Failed to join game. Check the game code and try again.');
      }
    } catch (err) {
      setError('Failed to join game. Check the game code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-screen animate-fade-in-up">
      <div className="w-full funeral-container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 funeral-title animate-ornate-glow">
            ⚰️ SOMEBODY HAS DIED ⚰️
          </h1>
          <p className="mb-8 funeral-subtitle">
            The most wickedly entertaining party game about arguing over a dead person's estate
          </p>
          <button
            onClick={() => setShowRules(!showRules)}
            className="funeral-button"
          >
            {showRules ? 'Hide the Sacred Rules' : 'Reveal the Sacred Rules'}
          </button>
        </div>

        {/* Rules */}
        {showRules && (
          <div className="mb-12 funeral-section animate-fade-in-up">
            <h2 className="text-3xl font-bold text-funeral-gold mb-6 text-center font-['Cinzel']">
              📜 The Sacred Rules of Inheritance 📜
            </h2>
            <div className="grid gap-6 md:grid-cols-3 text-funeral-bone">
              <div className="p-6 funeral-card">
                <h3 className="text-xl font-bold text-funeral-gold mb-4 font-['Cinzel']">⚱️ Setup</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 2-12 players (one becomes the Estate Keeper)</li>
                  <li>• Each player receives: 1 Identity + 1 Relationship + 2 Backstory cards</li>
                  <li>• The Estate Keeper controls all Objection cards</li>
                </ul>
              </div>
              <div className="p-6 funeral-card">
                <h3 className="text-xl font-bold text-funeral-gold mb-4 font-['Cinzel']">⚖️ Gameplay</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Players take turns presenting their inheritance claims</li>
                  <li>• Use your cards to craft compelling (or ridiculous) arguments</li>
                  <li>• Estate Keeper may challenge with Objection cards</li>
                  <li>• Arguments scored: 4 points (masterful) to 1 point (pathetic)</li>
                </ul>
              </div>
              <div className="p-6 funeral-card">
                <h3 className="text-xl font-bold text-funeral-gold mb-4 font-['Cinzel']">👑 Victory</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Play 3 rounds of inheritance battles</li>
                  <li>• Highest total score claims the estate</li>
                  <li>• May the most cunning mourner prevail!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Game Options */}
        <div className="grid gap-8 mb-12 md:grid-cols-2">
          {/* Create Game */}
          <div className="p-8 funeral-card-ornate">
            <h2 className="text-2xl font-bold text-funeral-gold mb-6 text-center font-['Cinzel']">
              🏰 Establish Your Estate
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
                  Your Noble Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Enter your distinguished name..."
                  className="px-4 py-3 w-full rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone placeholder-funeral-silver/50 focus:border-funeral-gold focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
                  Choose Your Realm
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGameMode('english')}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 font-semibold relative ${
                      gameMode === 'english'
                        ? 'bg-gradient-to-br from-funeral-gold/30 to-funeral-gold/10 text-funeral-gold border-funeral-gold shadow-lg shadow-funeral-gold/30 ring-2 ring-funeral-gold/50'
                        : 'bg-funeral-black/30 border-funeral-silver/30 text-funeral-silver hover:border-funeral-gold/50 hover:text-funeral-gold'
                    }`}
                  >
                    {gameMode === 'english' && (
                      <div className="absolute inset-0 rounded-lg border bg-funeral-gold/5 border-funeral-gold/20"></div>
                    )}
                    <span className="relative z-10">
                      🇬🇧 English Manor {gameMode === 'english' && '✓'}
                    </span>
                  </button>
                  <button
                    onClick={() => setGameMode('desi')}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 font-semibold relative ${
                      gameMode === 'desi'
                        ? 'bg-gradient-to-br from-funeral-gold/30 to-funeral-gold/10 text-funeral-gold border-funeral-gold shadow-lg shadow-funeral-gold/30 ring-2 ring-funeral-gold/50'
                        : 'bg-funeral-black/30 border-funeral-silver/30 text-funeral-silver hover:border-funeral-gold/50 hover:text-funeral-gold'
                    }`}
                  >
                    {gameMode === 'desi' && (
                      <div className="absolute inset-0 rounded-lg border bg-funeral-gold/5 border-funeral-gold/20"></div>
                    )}
                    <span className="relative z-10">
                      🇮🇳 Desi Haveli {gameMode === 'desi' && '✓'}
                    </span>
                  </button>
                </div>
                <div className="mt-3">
                  <button
                    disabled={true}
                    className="p-3 w-full font-semibold rounded-lg border-2 transition-all duration-300 cursor-not-allowed bg-funeral-black/20 border-funeral-silver/20 text-funeral-silver/40"
                  >
                    🤖 AI Dream Realm (Coming Soon)
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleCreateGame}
                disabled={loading}
                className="w-full funeral-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Establishing Estate...' : 'Create Your Estate'}
              </button>
            </div>
          </div>

          {/* Join Game */}
          <div className="p-8 funeral-card-ornate">
            <h2 className="text-2xl font-bold text-funeral-gold mb-6 text-center font-['Cinzel']">
              ⚔️ Join the Battle
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
                  Estate Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter the sacred code..."
                  className="px-4 py-3 w-full font-mono tracking-wider rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone placeholder-funeral-silver/50 focus:border-funeral-gold focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="px-4 py-3 w-full rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone placeholder-funeral-silver/50 focus:border-funeral-gold focus:outline-none"
                />
              </div>
              
              <button
                onClick={handleJoinGame}
                disabled={loading}
                className="w-full funeral-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entering the Fray...' : 'Join the Battle'}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/join')}
                  className="text-sm underline transition-colors duration-300 text-funeral-silver hover:text-funeral-gold"
                >
                  Use the dedicated joining chamber →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-8 border-red-500 funeral-card bg-red-900/20 animate-fade-in-up">
            <div className="font-semibold text-center text-red-300">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-funeral-silver/70">
          <p className="font-['Cinzel'] text-lg">
            ⚱️ Supports 2-12 players • Real-time multiplayer • No registration required ⚱️
          </p>
        </div>
      </div>
    </div>
  );
}
