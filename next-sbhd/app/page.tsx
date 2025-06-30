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
        // Store player ID in localStorage
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
        // Store player ID in localStorage
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-300 mb-4 drop-shadow-lg">
            ⚰️ SOMEBODY HAS DIED ⚰️
          </h1>
          <p className="text-xl text-amber-100 mb-6">
            The hilarious party game about arguing over a dead person's stuff
          </p>
          <button
            onClick={() => setShowRules(!showRules)}
            className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {showRules ? 'Hide Rules' : 'Show Rules'}
          </button>
        </div>

        {/* Rules */}
        {showRules && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">How to Play</h2>
            <div className="space-y-4 text-amber-100">
              <div>
                <h3 className="font-bold text-amber-200">Setup:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>2-12 players (one is the Estate Keeper)</li>
                  <li>Each player gets: 1 Identity + 1 Relationship + 2 Backstory cards</li>
                  <li>Estate Keeper gets all Objection cards</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-amber-200">Gameplay:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Players take turns arguing why they deserve the inheritance</li>
                  <li>Use your cards to build compelling (or ridiculous) arguments</li>
                  <li>Estate Keeper can play Objection cards to challenge arguments</li>
                  <li>Estate Keeper scores each argument: 4 points (best) to 1 point (worst)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-amber-200">Winning:</h3>
                <p className="ml-4">Play 3 rounds, then whoever has the most points inherits the estate!</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Game */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20">
            <h2 className="text-3xl font-bold text-amber-300 mb-6 text-center">
              Create New Game
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-amber-200 font-semibold mb-2">
                  Your Name (Host)
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:border-amber-400 focus:outline-none"
                  placeholder="Enter your name..."
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-amber-200 font-semibold mb-2">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGameMode('english')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      gameMode === 'english'
                        ? 'border-amber-400 bg-amber-900/30 text-amber-200'
                        : 'border-amber-500/30 bg-slate-800 text-amber-100 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="font-semibold">English</div>
                    <div className="text-sm opacity-80">Original cards</div>
                  </button>
                  <button
                    onClick={() => setGameMode('desi')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      gameMode === 'desi'
                        ? 'border-amber-400 bg-amber-900/30 text-amber-200'
                        : 'border-amber-500/30 bg-slate-800 text-amber-100 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="font-semibold">Desi Mode</div>
                    <div className="text-sm opacity-80">Family-friendly</div>
                  </button>
                </div>
                <div className="text-xs text-amber-300/70 mt-2">
                  {gameMode === 'desi' 
                    ? 'Hindi/Urdu cards with familiar family situations' 
                    : 'Original English cards with Western references'
                  }
                </div>
              </div>
              
              <button
                onClick={handleCreateGame}
                disabled={loading || !hostName.trim()}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>

          {/* Join Game */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20">
            <h2 className="text-3xl font-bold text-amber-300 mb-6 text-center">
              Join Existing Game
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-amber-200 font-semibold mb-2">
                  Game Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:border-amber-400 focus:outline-none uppercase tracking-wider"
                  placeholder="ABCDEF"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-amber-200 font-semibold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:border-amber-400 focus:outline-none"
                  placeholder="Enter your name..."
                  maxLength={50}
                />
              </div>
              <button
                onClick={handleJoinGame}
                disabled={loading || !joinCode.trim() || !playerName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  onClick={() => router.push('/join')}
                  className="text-purple-300 hover:text-purple-200 underline text-sm"
                >
                  Use dedicated join page →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-amber-300/70">
          <p>Supports 2-12 players • Real-time multiplayer • No registration required</p>
        </div>
      </div>
    </div>
  );
}
