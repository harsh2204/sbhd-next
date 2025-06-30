'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGameState, setEstateKeeper, dealCards, updatePlayerScore, drawCardForPlayer, nextTurn, endPlayerTurn, subscribeToGameEvents, GameState, Player } from '@/utils/gameUtils';
import { drawRandomCard, GAME_CARDS } from '@/utils/gameCards';
import { supabase } from '@/utils/db/supabase';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.gameCode as string;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [newCard, setNewCard] = useState<string>('');
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
      // We need to get the game by code first, then get the full state
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
      } else {
        setError('Game not found');
      }
    } catch (err) {
      console.error('Error loading game state:', err);
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [router, gameCode]);

  // Optimized subscription callback that updates only changed data
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('🔥 FULL PAYLOAD RECEIVED:', JSON.stringify(payload, null, 2));
    console.log('🔥 Event table:', payload.table);
    console.log('🔥 Event type:', payload.eventType);
    console.log('🔥 New data:', payload.new);
    console.log('🔥 Old data:', payload.old);
    
    // Handle different types of events with targeted updates
    if (payload.table === 'players') {
      console.log('👥 Player table change detected');
      const updatedPlayer = payload.new;
      
      if (payload.eventType === 'UPDATE' && updatedPlayer) {
        console.log('👥 UPDATE event for player:', updatedPlayer.id);
        // Update specific player in state
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => 
            player.id === updatedPlayer.id 
              ? {
                  ...player,
                  score: updatedPlayer.score !== undefined ? updatedPlayer.score : player.score,
                  cards: updatedPlayer.cards || player.cards,
                  is_estate_keeper: updatedPlayer.is_estate_keeper !== undefined ? updatedPlayer.is_estate_keeper : player.is_estate_keeper,
                  is_ready: updatedPlayer.is_ready !== undefined ? updatedPlayer.is_ready : player.is_ready
                }
              : player
          );
          
          console.log('👥 Updated players:', updatedPlayers);
          return { ...prevState, players: updatedPlayers };
        });
      } else if (payload.eventType === 'INSERT' && updatedPlayer) {
        console.log('👥 INSERT event for new player:', updatedPlayer.name);
        // Add new player
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
        console.log('👥 DELETE event for player:', payload.old.id);
        // Remove player
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const filteredPlayers = prevState.players.filter(player => player.id !== payload.old.id);
          return { ...prevState, players: filteredPlayers };
        });
      }
    } else if (payload.table === 'games') {
      console.log('🎲 Game table change detected');
      const updatedGame = payload.new;
      
      if (payload.eventType === 'UPDATE' && updatedGame) {
        console.log('🎲 UPDATE event for game:', updatedGame);
        // Update specific game fields
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
      // Game events - handle specific event types
      const eventType = payload.new?.event_type;
      const eventData = payload.new?.event_data;
      console.log('🎮 Game event type:', eventType);
      console.log('🎮 Game event data:', eventData);
      
      if (eventType === 'score_updated' && eventData) {
        console.log('🎯 Handling score update event for player:', eventData.player_id, 'new score:', eventData.points);
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          const updatedPlayers = prevState.players.map(player => 
            player.id === eventData.player_id 
              ? { ...player, score: eventData.points }
              : player
          );
          
          console.log('🎯 Updated players after score change:', updatedPlayers);
          return { ...prevState, players: updatedPlayers };
        });
      } else if (eventType === 'card_drawn' && eventData) {
        console.log('🎴 Handling card drawn event');
        setNewCard(eventData.card);
        setTimeout(() => setNewCard(''), 5000);
        
        // Update player cards
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
        console.log('🔄 Handling turn advanced event');
        setGameState(prevState => {
          if (!prevState) return prevState;
          
          return {
            ...prevState,
            current_player_turn: eventData.new_turn,
            current_round: eventData.new_round
          };
        });
      } else if (eventType === 'estate_keeper_set' && eventData) {
        console.log('⚖️ Handling estate keeper set event');
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
      } else if (eventType === 'cards_dealt') {
        console.log('🎴 Cards dealt - need full refresh for initial card data');
        // Only for cards dealt, we need a full refresh since it's initial card distribution
        loadGameState();
      } else if (eventType === 'player_joined') {
        console.log('👋 Player joined - need full refresh to get player data');
        // Only for player joined, we need a full refresh to get the new player data
        loadGameState();
      } else {
        console.log('❓ Unknown event type:', eventType, 'falling back to full refresh');
        loadGameState();
      }
    } else {
      console.log('❓ Unknown table:', payload.table, 'falling back to full refresh');
      loadGameState();
    }
  }, [loadGameState]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  useEffect(() => {
    if (!gameState) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
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
    
    const success = await setEstateKeeper(gameState.id, playerId, estateKeeperId);
    if (success) {
      // Don't manually reload - let real-time updates handle it
    }
  };

  const handleDealCards = async () => {
    if (!gameState || !isEstateKeeper) return;
    
    const success = await dealCards(gameState.id, playerId);
    if (success) {
      // Don't manually reload - let real-time updates handle it
    }
  };

  const handleUpdateScore = async (targetPlayerId: string, points: number) => {
    if (!gameState || !isEstateKeeper) return;
    
    console.log('🎯 Updating score for player:', targetPlayerId, 'to points:', points);
    const success = await updatePlayerScore(gameState.id, playerId, targetPlayerId, points);
    console.log('🎯 Score update result:', success);
    if (success) {
      // Don't manually reload - let real-time updates handle it
      console.log('✅ Score updated successfully, waiting for real-time update...');
    } else {
      console.error('❌ Failed to update score');
    }
  };

  const handleDrawCard = async (targetPlayerId: string, cardType: 'identity' | 'relationship' | 'backstory' | 'objection') => {
    if (!gameState || !isEstateKeeper) return;
    
    const card = await drawCardForPlayer(gameState.id, playerId, targetPlayerId, cardType);
    if (card) {
      // The real-time event will handle showing the new card
    }
  };

  const handleNextTurn = async () => {
    if (!gameState || !isEstateKeeper) return;
    
    const success = await nextTurn(gameState.id, playerId);
    if (success) {
      // Don't manually reload - let real-time updates handle it
    }
  };

  const handleEndTurn = async () => {
    if (!gameState) return;
    
    const success = await endPlayerTurn(gameState.id, playerId);
    if (success) {
      // Turn ended successfully - estate keeper will advance the turn
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'identity': return 'border-blue-400 bg-blue-900/20';
      case 'relationship': return 'border-red-400 bg-red-900/20';
      case 'backstory': return 'border-green-400 bg-green-900/20';
      case 'objection': return 'border-gray-400 bg-gray-900/20';
      default: return 'border-amber-400 bg-amber-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-amber-300">Loading game...</div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-2xl text-red-400 mb-4">{error || 'Game not found'}</div>
        <button
          onClick={() => router.push('/')}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Filter out estate keeper from player display
  const displayPlayers = gameState.players.filter(p => !p.is_estate_keeper);
  const estateKeeper = gameState.players.find(p => p.is_estate_keeper);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-300 mb-2">
            ⚰️ SOMEBODY HAS DIED ⚰️
          </h1>
          <div className="text-xl text-amber-100 mb-4">
            Game Code: <span className="font-mono text-2xl text-amber-300">{gameState.game_code}</span>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowRules(!showRules)}
              className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>

        {/* Rules */}
        {showRules && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Game Rules</h2>
            <div className="grid md:grid-cols-2 gap-6 text-amber-100">
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Estate Keeper Role:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Manage the game flow</li>
                  <li>Hold all Objection cards</li>
                  <li>Judge inheritance arguments</li>
                  <li>Award 4-1 points per round</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Player Role:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Argue for your inheritance</li>
                  <li>Use your cards creatively</li>
                  <li>Survive objections</li>
                  <li>Score the most points to win</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Game Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Game Info & Controls */}
          <div className="space-y-6">
            {/* Deceased Info */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
              <h3 className="text-2xl font-bold text-amber-300 mb-4 text-center">💀 The Deceased 💀</h3>
              <div className="text-center space-y-2">
                <div className="text-xl font-bold text-amber-200">{gameState.deceased_name}</div>
                <div className="text-amber-100">
                  <strong>Identity:</strong> {gameState.deceased_identity}
                </div>
                <div className="text-amber-100">
                  <strong>Estate:</strong> {gameState.deceased_estate}
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
              <h3 className="text-xl font-bold text-amber-300 mb-4 text-center">Game Status</h3>
              <div className="text-center space-y-2">
                {gameState.status === 'waiting' && (
                  <div className="text-amber-200">
                    {isHost ? 'Select an Estate Keeper to start' : 'Waiting for host to start...'}
                  </div>
                )}
                {gameState.status === 'playing' && (
                  <div className="space-y-2">
                    <div className="text-green-200">
                      Round {gameState.current_round} of {gameState.max_rounds}
                    </div>
                    {estateKeeper && (
                      <div className="text-purple-200">
                        Estate Keeper: <span className="font-bold">{estateKeeper.name}</span> ⚖️
                      </div>
                    )}
                    {currentTurnPlayer && (
                      <div className="text-blue-200">
                        Current Turn: <span className="font-bold text-blue-300">{currentTurnPlayer.name}</span>
                        {isMyTurn && !isEstateKeeper && (
                          <div className="mt-2">
                            <button
                              onClick={handleEndTurn}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
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
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
                <h3 className="text-xl font-bold text-amber-300 mb-4">Host Controls</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-amber-200 mb-2">Select Estate Keeper:</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50"
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
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Set Estate Keeper
                  </button>
                </div>
              </div>
            )}

            {/* Estate Keeper Controls */}
            {isEstateKeeper && (
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Estate Keeper Controls</h3>
                <div className="space-y-4">
                  {gameState.status === 'waiting' && (
                    <button
                      onClick={handleDealCards}
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
                          onClick={handleNextTurn}
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
            )}
          </div>

          {/* Middle Column - My Cards (if not estate keeper) */}
          {!isEstateKeeper && gameState.status === 'playing' && currentPlayer?.cards && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
              <h3 className="text-2xl font-bold text-amber-300 mb-6 text-center">
                🎴 Your Cards 🎴
              </h3>
              
              <div className="space-y-4">
                {currentPlayer.cards.identity && (
                  <div className={`p-4 rounded-lg border-2 ${getCardColor('identity')}`}>
                    <div className="text-sm text-blue-300 font-bold mb-2">IDENTITY</div>
                    <div className="text-lg">{currentPlayer.cards.identity}</div>
                  </div>
                )}
                
                {currentPlayer.cards.relationship && (
                  <div className={`p-4 rounded-lg border-2 ${getCardColor('relationship')}`}>
                    <div className="text-sm text-red-300 font-bold mb-2">RELATIONSHIP</div>
                    <div className="text-lg">{currentPlayer.cards.relationship}</div>
                  </div>
                )}
                
                {(currentPlayer.cards.backstory || []).map((card, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('backstory')}`}>
                    <div className="text-sm text-green-300 font-bold mb-2">BACKSTORY {idx + 1}</div>
                    <div className="text-lg">{card}</div>
                  </div>
                ))}
                
                {((currentPlayer.cards as any).objections || []).map((card: string, idx: number) => (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('objection')}`}>
                    <div className="text-sm text-gray-300 font-bold mb-2">OBJECTION {idx + 1}</div>
                    <div className="text-lg">{card}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column - Other Players */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <h3 className="text-2xl font-bold text-amber-300 mb-6 text-center">
              Players ({displayPlayers.length}/12)
            </h3>
            
            <div className="space-y-4">
              {displayPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    player.is_host 
                      ? 'border-amber-400 bg-amber-900/20'
                      : currentTurnPlayer?.id === player.id
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-gray-400 bg-gray-900/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">
                        {player.name}
                        {player.is_host && <span className="text-amber-300 ml-2">👑</span>}
                        {currentTurnPlayer?.id === player.id && gameState.status === 'playing' && (
                          <span className="text-blue-300 ml-2">🔵</span>
                        )}
                        {player.id === playerId && <span className="text-green-300 ml-2">(You)</span>}
                      </div>
                      <div className="text-lg font-bold text-amber-200">
                        {player.score} points
                      </div>
                    </div>
                  </div>

                  {/* Show card counts for others, full cards for self */}
                  {gameState.status === 'playing' && player.cards && player.id !== playerId && (
                    <div className="mt-2 text-sm text-gray-400">
                      Cards: {player.cards.identity ? 1 : 0} Identity, {player.cards.relationship ? 1 : 0} Relationship, {(player.cards.backstory || []).length} Backstory, {((player.cards as any).objections || []).length} Objection
                    </div>
                  )}

                  {/* Estate Keeper Controls for Scoring */}
                  {isEstateKeeper && gameState.status === 'playing' && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-purple-300 font-semibold">AWARD POINTS:</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(points => (
                          <button
                            key={points}
                            onClick={() => handleUpdateScore(player.id, player.score + points)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            +{points}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-purple-300 font-semibold mt-2">REMOVE POINTS:</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(points => (
                          <button
                            key={points}
                            onClick={() => handleUpdateScore(player.id, Math.max(0, player.score - points))}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            -{points}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-purple-300 font-semibold mt-2">DRAW CARDS:</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDrawCard(player.id, 'backstory')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          Backstory
                        </button>
                        <button
                          onClick={() => handleDrawCard(player.id, 'objection')}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          Objection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
