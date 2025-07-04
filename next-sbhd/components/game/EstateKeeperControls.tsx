'use client';

import { useState } from 'react';
import { GameState, Player } from '@/utils/gameUtils';
import DrawCardModal from './DrawCardModal';

interface EstateKeeperControlsProps {
  gameState: GameState;
  playerId: string;
  onDealCards: () => void;
  onNextTurn: () => void;
  onUpdateScore: (targetPlayerId: string, points: number) => void;
  onDrawCard: (targetPlayerId: string, cardType: 'identity' | 'relationship' | 'backstory' | 'objection') => Promise<void>;
  newCard: string;
  selectedPlayerIndex: number;
  onNavigatePlayer: (direction: 'prev' | 'next') => void;
  showSelectedPlayerCards: boolean;
  onToggleSelectedPlayerCards: () => void;
}

export default function EstateKeeperControls({
  gameState,
  playerId,
  onDealCards,
  onNextTurn,
  onUpdateScore,
  onDrawCard,
  newCard,
  selectedPlayerIndex,
  onNavigatePlayer,
  showSelectedPlayerCards,
  onToggleSelectedPlayerCards
}: EstateKeeperControlsProps) {
  const [showDrawCardModal, setShowDrawCardModal] = useState(false);
  const [drawCardTargetPlayer, setDrawCardTargetPlayer] = useState<Player | null>(null);

  const nonEstateKeeperPlayers = gameState.players.filter(p => !p.is_estate_keeper);
  const selectedPlayer = nonEstateKeeperPlayers[selectedPlayerIndex];

  const handleDrawCardClick = (player: Player) => {
    setDrawCardTargetPlayer(player);
    setShowDrawCardModal(true);
  };

  const handleDrawCardConfirm = async (cardType: 'backstory' | 'objection') => {
    if (drawCardTargetPlayer) {
      await onDrawCard(drawCardTargetPlayer.id, cardType);
    }
    setShowDrawCardModal(false);
    setDrawCardTargetPlayer(null);
  };

  return (
    <>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-xl font-bold text-purple-300 mb-4">Estate Keeper Controls</h3>
        <div className="space-y-4">
          {gameState.status === 'waiting' && (
            <button
              onClick={onDealCards}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Deal Cards & Start Game
            </button>
          )}
          
          {gameState.status === 'playing' && (
            <>
              <div>
                <h4 className="text-purple-200 font-semibold mb-2">Turn Management</h4>
                <button
                  onClick={onNextTurn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Next Turn / Next Round
                </button>
              </div>
              
              {newCard && (
                <div className="bg-gray-900/50 border border-gray-400 rounded-lg p-3">
                  <div className="text-purple-200 font-semibold mb-1">Last Card Drawn:</div>
                  <div className="text-gray-200">{newCard}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Player Management Section - Only during playing */}
      {gameState.status === 'playing' && selectedPlayer && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigatePlayer('prev')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
              disabled={nonEstateKeeperPlayers.length <= 1}
            >
              ← Prev
            </button>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-300 mb-1">
                ⚖️ {selectedPlayer.name}
              </h3>
              <div className="text-sm text-purple-200">
                Player {selectedPlayerIndex + 1} of {nonEstateKeeperPlayers.length}
                {selectedPlayerIndex === (gameState.current_player_turn || 0) && (
                  <span className="text-blue-300 ml-2">(Current Turn)</span>
                )}
              </div>
              <div className="text-lg font-bold text-amber-200 mt-1">
                {selectedPlayer.score} points
              </div>
            </div>
            
            <button
              onClick={() => onNavigatePlayer('next')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
              disabled={nonEstateKeeperPlayers.length <= 1}
            >
              Next →
            </button>
          </div>

          {/* Scoring Controls */}
          <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <div className="text-sm text-purple-300 font-semibold mb-3">SCORING CONTROLS</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-purple-300 font-semibold mb-2">AWARD POINTS:</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(points => (
                    <button
                      key={points}
                      onClick={() => onUpdateScore(selectedPlayer.id, selectedPlayer.score + points)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      +{points}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-300 font-semibold mb-2">REMOVE POINTS:</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(points => (
                    <button
                      key={points}
                      onClick={() => onUpdateScore(selectedPlayer.id, Math.max(0, selectedPlayer.score - points))}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      -{points}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-300 font-semibold mb-2">DRAW CARD:</div>
                <button
                  onClick={() => handleDrawCardClick(selectedPlayer)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded transition-colors"
                >
                  Draw Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DrawCardModal
        isOpen={showDrawCardModal}
        onClose={() => setShowDrawCardModal(false)}
        onDrawCard={handleDrawCardConfirm}
        playerName={drawCardTargetPlayer?.name || ''}
      />
    </>
  );
} 
