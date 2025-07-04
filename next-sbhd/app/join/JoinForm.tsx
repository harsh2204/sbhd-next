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

  useEffect(() => {
    setGameCode(initialGameCode);
  }, [initialGameCode]);

  useEffect(() => {
    if (initialGameCode) {
      const timer = setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder="Enter your distinguished name..."]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialGameCode]);

  const handleJoinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError('Please enter both estate code and your name');
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
        setError('Failed to join estate. Verify the code and try again.');
      }
    } catch (err) {
      setError('Failed to join estate. Verify the code and try again.');
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
    <div className="animate-fade-in-up">
      {initialGameCode && (
        <div className="p-4 mb-6 border-blue-400 funeral-card bg-blue-900/30">
          <div className="text-center text-blue-200 font-semibold font-['Cinzel']">
            🔗 Estate code received from invitation! Simply enter your name to join the battle.
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
            Estate Code
          </label>
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="px-4 py-3 w-full font-mono text-xl tracking-wider text-center rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone placeholder-funeral-silver/50 focus:border-funeral-gold focus:outline-none"
            placeholder="Enter the sacred code..."
          />
        </div>
        
        <div>
          <label className="block text-funeral-silver font-semibold mb-3 font-['Cinzel']">
            Your Distinguished Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="px-4 py-3 w-full rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone placeholder-funeral-silver/50 focus:border-funeral-gold focus:outline-none"
            placeholder="Enter your distinguished name..."
          />
        </div>
        
        <button
          onClick={handleJoinGame}
          disabled={loading || !gameCode.trim() || !playerName.trim()}
          className="w-full funeral-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entering the Estate...' : 'Join the Battle for Inheritance'}
        </button>
      </div>

      {error && (
        <div className="p-4 mt-6 border-red-500 funeral-card bg-red-900/20 animate-fade-in-up">
          <div className="font-semibold text-center text-red-300">
            ⚠️ {error}
          </div>
        </div>
      )}
    </div>
  );
} 
