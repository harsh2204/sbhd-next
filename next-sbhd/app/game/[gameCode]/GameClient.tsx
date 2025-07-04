'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getGameState, setEstateKeeper, dealCards, updatePlayerScore, drawCardForPlayer, nextTurn, endPlayerTurn, subscribeToGameEvents, getGameEvents, rerollDeceasedAttribute, deleteGame, GameState, Player, GameEvent, ROUND_NAMES } from '@/utils/gameUtils';
import { supabase } from '@/utils/db/supabase';
import GameHeader from '@/components/game/GameHeader';
import GameRules from '@/components/game/GameRules';
import EventsLog from '@/components/game/EventsLog';
import DeceasedInfo from '@/components/game/DeceasedInfo';
import EstateKeeperControls from '@/components/game/EstateKeeperControls';
import PlayerCards from '@/components/game/PlayerCards';

interface GameClientProps {
  gameCode: string;
}

export default function GameClient({ gameCode }: GameClientProps) {
  const router = useRouter();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [newCard, setNewCard] = useState<string>('');
  const [showEventsLog, setShowEventsLog] = useState(false);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [showSelectedPlayerCards, setShowSelectedPlayerCards] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.is_host || false;
  const isEstateKeeper = currentPlayer?.is_estate_keeper || false;
  
  // Calculate current turn player (excluding estate keeper)
  const nonEstateKeeperPlayers = gameState?.players.filter(p => !p.is_estate_keeper) || [];
  const currentTurnPlayerIndex = gameState?.current_player_turn || 0;
  const currentTurnPlayer = nonEstateKeeperPlayers[currentTurnPlayerIndex];
  const isMyTurn = currentTurnPlayer?.id === playerId;

  const loadGameState = useCallback(async () => {
    const storedPlayerId = localStorage.getItem('playerId');
    if (!storedPlayerId) {
      router.push('/');
      return;
    }

    setPlayerId(storedPlayerId);
    
    try {
      const { data: gameData } = await supabase
        .from('games')
        .select('id')
        .eq('game_code', gameCode.toUpperCase())
        .single();
      
      if (!gameData) {
        setError('Game not found');
        return;
      }

      const result = await getGameState(gameData.id, storedPlayerId);
      if (result) {
        setGameState(result.game);
        const events = await getGameEvents(gameData.id);
        setGameEvents(events);
      } else {
        setError('Game not found');
      }
    } catch (err) {
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [router, gameCode]);

  // Optimized subscription callback without console logs
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (payload.table === 'players') {
      const updatedPlayer = payload.new;
      
      if (payload.eventType === 'UPDATE' && updatedPlayer) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => 
            player.id === updatedPlayer.id 
              ? {
                  ...player,
                  score: updatedPlayer.score !== undefined ? updatedPlayer.score : player.score,
                  is_estate_keeper: updatedPlayer.is_estate_keeper !== undefined ? updatedPlayer.is_estate_keeper : player.is_estate_keeper,
                  is_ready: updatedPlayer.is_ready !== undefined ? updatedPlayer.is_ready : player.is_ready
                }
              : player
          );
          
          return { ...prevState, players: updatedPlayers };
        });
      } else if (payload.eventType === 'INSERT' && updatedPlayer) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const newPlayer: Player = {
            id: updatedPlayer.id,
            name: updatedPlayer.name,
            is_host: updatedPlayer.is_host || false,
            is_estate_keeper: updatedPlayer.is_estate_keeper || false,
            is_ready: updatedPlayer.is_ready || false,
            score: updatedPlayer.score || 0,
            cards: updatedPlayer.cards || { backstory: [] }
          };
          
          return { ...prevState, players: [...prevState.players, newPlayer] };
        });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const filteredPlayers = prevState.players.filter(player => player.id !== payload.old.id);
          return { ...prevState, players: filteredPlayers };
        });
      }
    } else if (payload.table === 'games') {
      const updatedGame = payload.new;
      
      if (payload.eventType === 'UPDATE' && updatedGame) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          return {
            ...prevState,
            status: updatedGame.status || prevState.status,
            current_round: updatedGame.current_round !== undefined ? updatedGame.current_round : prevState.current_round,
            current_player_turn: updatedGame.current_player_turn !== undefined ? updatedGame.current_player_turn : prevState.current_player_turn,
            estate_keeper_id: updatedGame.estate_keeper_id !== undefined ? updatedGame.estate_keeper_id : prevState.estate_keeper_id
          };
        });
      }
    } else if (payload.table === 'game_events') {
      const eventType = payload.new?.event_type;
      const eventData = payload.new?.event_data;
      
      if (payload.eventType === 'INSERT' && payload.new) {
        const newEvent: GameEvent = {
          id: payload.new.id,
          event_type: payload.new.event_type,
          event_data: payload.new.event_data,
          created_at: payload.new.created_at || new Date().toISOString(),
          created_by: payload.new.created_by,
          creator_name: 'System'
        };
        
        setGameEvents(prevEvents => [newEvent, ...prevEvents.slice(0, 49)]);
      }
      
      if (eventType === 'score_updated' && eventData) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => 
            player.id === eventData.player_id 
              ? { ...player, score: eventData.points }
              : player
          );
          
          return { ...prevState, players: updatedPlayers };
        });
      } else if (eventType === 'card_drawn' && eventData) {
        setNewCard(eventData.card);
        setTimeout(() => setNewCard(''), 5000);
        
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => {
            if (player.id === eventData.player_id) {
              const currentCards = player.cards || { backstory: [] };
              
              if (eventData.card_type === 'backstory') {
                return {
                  ...player,
                  cards: {
                    ...currentCards,
                    backstory: [...(currentCards.backstory || []), eventData.card]
                  }
                };
              } else if (eventData.card_type === 'objection') {
                return {
                  ...player,
                  cards: {
                    ...currentCards,
                    objections: [...((currentCards as any).objections || []), eventData.card]
                  }
                };
              } else {
                return {
                  ...player,
                  cards: {
                    ...currentCards,
                    [eventData.card_type]: eventData.card
                  }
                };
              }
            }
            return player;
          });
          
          return { ...prevState, players: updatedPlayers };
        });
      } else if (eventType === 'turn_advanced' && eventData) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          return {
            ...prevState,
            current_player_turn: eventData.new_turn,
            current_round: eventData.new_round
          };
        });
      } else if (eventType === 'estate_keeper_set' && eventData) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => ({
            ...player,
            is_estate_keeper: player.id === eventData.estate_keeper_id
          }));
          
          return { 
            ...prevState, 
            players: updatedPlayers,
            estate_keeper_id: eventData.estate_keeper_id
          };
        });
      } else if (eventType === 'deceased_rerolled' && eventData) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedState = { ...prevState };
          
          if (eventData.rerolled_attributes.includes('name') && eventData.new_name) {
            updatedState.deceased_name = eventData.new_name;
          }
          if (eventData.rerolled_attributes.includes('identity') && eventData.new_identity) {
            updatedState.deceased_identity = eventData.new_identity;
          }
          if (eventData.rerolled_attributes.includes('estate') && eventData.new_estate) {
            updatedState.deceased_estate = eventData.new_estate;
          }
          
          return updatedState;
        });
      } else if (eventType === 'cards_dealt' || eventType === 'player_joined') {
        loadGameState();
      }
    } else {
      loadGameState();
    }
  }, [loadGameState]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Sync selected player index with current turn player
  useEffect(() => {
    if (gameState && isEstateKeeper && gameState.status === 'playing') {
      setSelectedPlayerIndex(gameState.current_player_turn || 0);
    }
  }, [gameState?.current_player_turn, isEstateKeeper, gameState?.status]);

  useEffect(() => {
    if (!gameState) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = subscribeToGameEvents(gameState.id, handleRealtimeEvent);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [gameState?.id, handleRealtimeEvent]);

  const handleSetEstateKeeper = async (estateKeeperId: string) => {
    if (!gameState || !isHost) return;
    await setEstateKeeper(gameState.id, playerId, estateKeeperId);
  };

  const handleDealCards = async () => {
    if (!gameState || !isEstateKeeper) return;
    await dealCards(gameState.id, playerId);
  };

  const handleUpdateScore = async (targetPlayerId: string, points: number) => {
    if (!gameState || !isEstateKeeper) return;
    await updatePlayerScore(gameState.id, playerId, targetPlayerId, points);
  };

  const handleDrawCard = async (targetPlayerId: string, cardType: 'identity' | 'relationship' | 'backstory' | 'objection') => {
    if (!gameState || !isEstateKeeper) return;
    await drawCardForPlayer(gameState.id, playerId, targetPlayerId, cardType);
  };

  const handleNextTurn = async () => {
    if (!gameState || !isEstateKeeper) return;
    await nextTurn(gameState.id, playerId);
  };

  const handleEndTurn = async () => {
    if (!gameState) return;
    await endPlayerTurn(gameState.id, playerId);
  };

  const handleRerollDeceased = async () => {
    if (!gameState || !isEstateKeeper) return;
    await rerollDeceasedAttribute(gameState.id, playerId);
  };

  const handleDeleteGame = async () => {
    if (!gameState || !isEstateKeeper) return;
    const success = await deleteGame(gameState.id, playerId);
    if (success) {
      // Navigate back to home page after successful deletion
      router.push('/');
    } else {
      alert('Failed to delete the game. Please try again.');
    }
  };

  const navigateToPlayer = (direction: 'prev' | 'next') => {
    if (!gameState || !isEstateKeeper) return;
    
    const nonEstateKeeperPlayers = gameState.players.filter(p => !p.is_estate_keeper);
    const maxIndex = nonEstateKeeperPlayers.length - 1;
    
    if (direction === 'prev') {
      setSelectedPlayerIndex(prev => prev > 0 ? prev - 1 : maxIndex);
    } else {
      setSelectedPlayerIndex(prev => prev < maxIndex ? prev + 1 : 0);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-amber-300">Loading game...</div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="flex flex-col justify-center items-center p-4 min-h-screen">
        <div className="mb-4 text-2xl text-red-400">{error || 'Game not found'}</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  const displayPlayers = gameState.players.filter(p => !p.is_estate_keeper);
  const estateKeeper = gameState.players.find(p => p.is_estate_keeper);
  const selectedPlayerForCards = nonEstateKeeperPlayers[selectedPlayerIndex];

  return (
    <div className="p-4 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <GameHeader 
          gameCode={gameState.game_code}
          gameStatus={gameState.status}
          showRules={showRules}
          setShowRules={setShowRules}
          showEventsLog={showEventsLog}
          setShowEventsLog={setShowEventsLog}
          isEstateKeeper={isEstateKeeper}
          onDeleteGame={handleDeleteGame}
        />

        <GameRules 
          isEstateKeeper={isEstateKeeper}
          showRules={showRules}
        />

        <EventsLog 
          showEventsLog={showEventsLog}
          gameEvents={gameEvents}
          gameState={gameState}
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Game Info & Controls */}
          <div className="space-y-6">
            <DeceasedInfo 
              gameState={gameState}
              isEstateKeeper={isEstateKeeper}
              onRerollDeceased={handleRerollDeceased}
            />

            {isEstateKeeper && (
              <EstateKeeperControls
                gameState={gameState}
                playerId={playerId}
                onDealCards={handleDealCards}
                onNextTurn={handleNextTurn}
                onUpdateScore={handleUpdateScore}
                onDrawCard={handleDrawCard}
                newCard={newCard}
                selectedPlayerIndex={selectedPlayerIndex}
                onNavigatePlayer={navigateToPlayer}
                showSelectedPlayerCards={showSelectedPlayerCards}
                onToggleSelectedPlayerCards={() => setShowSelectedPlayerCards(!showSelectedPlayerCards)}
              />
            )}
          </div>

          {/* Middle Column - Player Cards */}
          {gameState.status === 'playing' && (
            <div>
              {!isEstateKeeper && currentPlayer?.cards ? (
                <div className="p-6 funeral-card-ornate">
                  <PlayerCards 
                    player={currentPlayer}
                    title="🎴 Your Cards 🎴"
                  />
                </div>
              ) : (
                isEstateKeeper && selectedPlayerForCards && (
                  <PlayerCards 
                    player={selectedPlayerForCards}
                    isCollapsible={true}
                    isCollapsed={!showSelectedPlayerCards}
                    onToggleCollapse={() => setShowSelectedPlayerCards(!showSelectedPlayerCards)}
                    title="🎴 View Cards"
                  />
                )
              )}
            </div>
          )}

          {/* Right Column - Game Status, Host Controls & Leaderboard */}
          <div className="space-y-6">
            {/* Game Status */}
            <div className="p-6 funeral-card">
              <h3 className="text-xl font-bold text-funeral-gold mb-4 text-center font-['Cinzel']">⚖️ Estate Status</h3>
              <div className="space-y-2 text-center">
                {gameState.status === 'waiting' && (
                  <div className="text-funeral-silver">
                    {isHost ? 'Select an Estate Keeper to start' : 'Waiting for host to start...'}
                  </div>
                )}
                {gameState.status === 'playing' && (
                  <div className="space-y-2">
                    <div className="font-semibold text-funeral-gold">
                      Round {gameState.current_round} of {gameState.max_rounds}: {ROUND_NAMES[gameState.current_round as keyof typeof ROUND_NAMES] || 'Unknown Round'}
                    </div>
                    {estateKeeper && (
                      <div className="text-funeral-silver">
                        Estate Keeper: <span className="font-bold text-funeral-gold">{estateKeeper.name}</span> ⚖️
                      </div>
                    )}
                    {currentTurnPlayer && (
                      <div className="text-funeral-silver">
                        Current Turn: <span className="font-bold text-funeral-gold">{currentTurnPlayer.name}</span>
                        {isMyTurn && !isEstateKeeper && (
                          <div className="mt-2">
                            <button
                              onClick={handleEndTurn}
                              className="px-4 py-2 text-sm funeral-button"
                            >
                              End My Turn
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && gameState.status === 'waiting' && (
              <div className="p-6 funeral-card">
                <h3 className="text-xl font-bold text-funeral-gold mb-4 font-['Cinzel']">👑 Host Controls</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-funeral-silver mb-2 font-['Cinzel']">Select Estate Keeper:</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="px-3 py-2 w-full rounded-lg border-2 transition-colors duration-300 bg-funeral-black/50 border-funeral-gold/50 text-funeral-bone focus:border-funeral-gold focus:outline-none"
                    >
                      <option value="">Choose player...</option>
                      {gameState.players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => selectedPlayer && handleSetEstateKeeper(selectedPlayer)}
                    disabled={!selectedPlayer}
                    className="w-full funeral-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Estate Keeper
                  </button>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div className="p-6 funeral-card">
              <h3 className="text-2xl font-bold text-funeral-gold mb-6 text-center font-['Cinzel']">
                🏆 Inheritance Leaderboard
              </h3>
              
              <div className="space-y-3">
                {displayPlayers
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border-2 ${
                      index === 0 && player.score > 0
                        ? 'border-funeral-gold bg-funeral-gold/10'
                        : currentTurnPlayer?.id === player.id
                        ? 'border-blue-400 bg-blue-900/20'
                        : 'border-funeral-silver/50 bg-funeral-black/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-bold text-funeral-gold">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-funeral-bone">
                            {player.name}
                            {player.is_host && <span className="ml-1 text-funeral-gold">👑</span>}
                            {currentTurnPlayer?.id === player.id && gameState.status === 'playing' && (
                              <span className="ml-1 text-blue-300">🔵</span>
                            )}
                            {player.id === playerId && <span className="ml-1 text-funeral-gold">(You)</span>}
                          </div>
                          {gameState.status === 'playing' && player.cards && player.id !== playerId && !isEstateKeeper && (
                            <div className="text-xs text-funeral-silver/70">
                              {player.cards.identity ? 1 : 0}I, {player.cards.relationship ? 1 : 0}R, {(player.cards.backstory || []).length}B, {((player.cards as any).objections || []).length}O
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-funeral-gold">
                          {player.score}
                        </div>
                        <div className="text-xs text-funeral-silver/70">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
