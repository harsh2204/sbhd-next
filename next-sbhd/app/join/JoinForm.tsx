'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { joinGame } from '@/utils/gameUtils';

interface JoinFormProps {
  initialGameCode: string;
}

export default function JoinForm({ initialGameCode }: JoinFormProps) {
  const [gameCode, setGameCode] = useState(initialGameCode);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Update game code if initialGameCode changes
  useEffect(() => {
    setGameCode(initialGameCode);
  }, [initialGameCode]);

  // Auto-focus on name input if game code is pre-filled
  useEffect(() => {
    if (initialGameCode) {
      const timer = setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder="Enter your name..."]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialGameCode]);

  const handleJoinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError('Please enter both game code and your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await joinGame(gameCode.trim(), playerName.trim());
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinGame();
    }
  };

  return (
    <>
      {/* Join Form */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20">
        {initialGameCode && (
          <div className="bg-blue-900/50 border border-blue-400 text-blue-200 px-4 py-2 rounded-lg text-center mb-6">
            🔗 Game code pre-filled from share link! Just enter your name to join.
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label className="block text-amber-200 font-semibold mb-2">
              Game Code
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:border-amber-400 focus:outline-none uppercase tracking-wider text-center text-xl font-mono"
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
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:border-amber-400 focus:outline-none"
              placeholder="Enter your name..."
              maxLength={50}
            />
          </div>
          
          <button
            onClick={handleJoinGame}
            disabled={loading || !gameCode.trim() || !playerName.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}
    </>
  );
} 
