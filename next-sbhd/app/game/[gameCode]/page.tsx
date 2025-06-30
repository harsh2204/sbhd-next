'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGameState, setEstateKeeper, dealCards, updatePlayerScore, drawCardForPlayer, nextTurn, endPlayerTurn, subscribeToGameEvents, getGameEvents, GameState, Player, GameEvent } from '@/utils/gameUtils';
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
        // Also load game events
        const events = await getGameEvents(gameData.id);
        setGameEvents(events);
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
      
      // Add new event to events log
      if (payload.eventType === 'INSERT' && payload.new) {
        const newEvent: GameEvent = {
          id: payload.new.id,
          event_type: payload.new.event_type,
          event_data: payload.new.event_data,
          created_at: payload.new.created_at || new Date().toISOString(),
          created_by: payload.new.created_by,
          creator_name: 'System' // We'll update this if needed
        };
        
        setGameEvents(prevEvents => [newEvent, ...prevEvents.slice(0, 49)]);
      }
      
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

  // Sync selected player index with current turn player
  useEffect(() => {
    if (gameState && isEstateKeeper && gameState.status === 'playing') {
      setSelectedPlayerIndex(gameState.current_player_turn || 0);
    }
  }, [gameState?.current_player_turn, isEstateKeeper, gameState?.status]);

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

  const formatEventMessage = (event: GameEvent) => {
    const eventData = event.event_data || {};
    const playerName = gameState?.players.find(p => p.id === eventData.player_id)?.name || 'Unknown Player';
    const targetPlayerName = gameState?.players.find(p => p.id === eventData.target_player_id)?.name || 'Unknown Player';
    
    switch (event.event_type) {
      case 'player_joined':
        return `${eventData.player_name} joined the game`;
      case 'estate_keeper_set':
        const estateKeeperName = gameState?.players.find(p => p.id === eventData.estate_keeper_id)?.name || 'Unknown Player';
        return `${estateKeeperName} was set as Estate Keeper`;
      case 'cards_dealt':
        return 'Cards have been dealt and game started';
      case 'score_updated':
        return `${playerName} scored ${eventData.points} points`;
      case 'card_drawn':
        return `${playerName} drew a ${eventData.card_type} card`;
      case 'turn_advanced':
        const nextPlayerName = gameState?.players.filter(p => !p.is_estate_keeper)[eventData.new_turn]?.name || 'Unknown Player';
        return `Turn advanced to ${nextPlayerName} (Round ${eventData.new_round})`;
      case 'player_turn_ended':
        return `${playerName} ended their turn`;
      default:
        return `${event.event_type}: ${JSON.stringify(eventData)}`;
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setShowRules(!showRules)}
              className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
            <button
              onClick={() => setShowEventsLog(!showEventsLog)}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showEventsLog ? 'Hide Events' : 'Show Events'}
            </button>
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/join?code=${gameState.game_code}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  // Show success feedback
                  const button = document.activeElement as HTMLButtonElement;
                  const originalText = button.textContent;
                  button.textContent = 'Copied!';
                  button.classList.add('bg-green-600');
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('bg-green-600');
                  }, 2000);
                }).catch(() => {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = shareUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  
                  const button = document.activeElement as HTMLButtonElement;
                  const originalText = button.textContent;
                  button.textContent = 'Copied!';
                  button.classList.add('bg-green-600');
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('bg-green-600');
                  }, 2000);
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📋 Copy Share Link
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-amber-300">Game Rules</h2>
              <a
                href="https://www.someonehasdiedgame.com/howtoplay"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                📖 Full Official Rules
              </a>
            </div>
            
            {isEstateKeeper ? (
              <div className="text-amber-100 space-y-4">
                <div>
                  <h3 className="font-bold text-purple-300 mb-3">Your Role as Estate Keeper:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Game Master & Judge:</strong> Guide players through the experience and decide who wins</li>
                    <li><strong>Objection Cards:</strong> Award objection cards to players who say something funny or clever</li>
                    <li><strong>Scoring:</strong> Award 1-4 points based on how compelling or entertaining each argument is</li>
                    <li><strong>Turn Management:</strong> Control the flow between rounds and advance turns</li>
                    <li><strong>Final Decision:</strong> Choose the winner based on who made the best case (or entertained you most!)</li>
                  </ul>
                </div>
                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
                  <h4 className="font-bold text-purple-200 mb-2">Game Flow:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li><strong>Opening Statements:</strong> Players introduce themselves and their claim</li>
                    <li><strong>Interrogation:</strong> Ask each player one direct question</li>
                    <li><strong>Recess:</strong> Players question each other "off the record"</li>
                    <li><strong>Final Statements:</strong> Last chance for players to make their case</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-amber-100 space-y-4">
                <div>
                  <h3 className="font-bold text-amber-200 mb-3">Your Role as Player:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Craft Your Character:</strong> Use ALL cards in your hand to create a compelling story</li>
                    <li><strong>Make Your Case:</strong> Convince the estate keeper you deserve the inheritance</li>
                    <li><strong>Use Cards Creatively:</strong> Incorporate identity, relationship, backstory, and objection cards</li>
                    <li><strong>Interact & Object:</strong> Use objection cards during others' turns (max 2 per turn)</li>
                    <li><strong>Defend Your Story:</strong> Respond to objections - you cannot declare them false!</li>
                  </ul>
                </div>
                <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20">
                  <h4 className="font-bold text-amber-200 mb-2">Card Types:</h4>
                  <ul className="text-sm space-y-1">
                    <li><span className="text-blue-300">🔵 Identity:</span> Your occupation or character description</li>
                    <li><span className="text-red-300">🔴 Relationship:</span> How you knew the deceased</li>
                    <li><span className="text-green-300">🟢 Backstory:</span> Items, quirks, or life events to include</li>
                    <li><span className="text-gray-300">⚫ Objection:</span> Interrupt others with these statements</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Log */}
        {showEventsLog && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-purple-300 mb-4">📜 Game Events Log</h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {gameEvents.length === 0 ? (
                <div className="text-purple-200 text-center py-4">No events yet...</div>
              ) : (
                gameEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-black/20 rounded-lg p-3 border border-purple-500/10"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-purple-100 text-sm flex-1">
                        {formatEventMessage(event)}
                      </div>
                      <div className="text-purple-300 text-xs font-mono shrink-0">
                        {formatEventTime(event.created_at)}
                      </div>
                    </div>
                    {event.creator_name && event.creator_name !== 'System' && (
                      <div className="text-purple-400 text-xs mt-1">
                        by {event.creator_name}
                      </div>
                    )}
                  </div>
                ))
              )}
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
                {gameState.game_settings?.mode === 'desi' && (
                  <div className="text-xs text-green-300 mt-2">
                    🏠 Desi Mode Active
                  </div>
                )}
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

          {/* Middle Column - My Cards (if not estate keeper) or Player Cards (if estate keeper) */}
          {gameState.status === 'playing' && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
              {!isEstateKeeper ? (
                // Regular player view - show their own cards
                currentPlayer?.cards && (
                  <>
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
                  </>
                )
              ) : (
                // Estate keeper view - show selected player's details with navigation
                (() => {
                  const nonEstateKeeperPlayers = gameState.players.filter(p => !p.is_estate_keeper);
                  const selectedPlayer = nonEstateKeeperPlayers[selectedPlayerIndex];
                  
                  return selectedPlayer ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => navigateToPlayer('prev')}
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
                          onClick={() => navigateToPlayer('next')}
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
                                  onClick={() => handleUpdateScore(selectedPlayer.id, selectedPlayer.score + points)}
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
                                  onClick={() => handleUpdateScore(selectedPlayer.id, Math.max(0, selectedPlayer.score - points))}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded transition-colors"
                                >
                                  -{points}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-300 font-semibold mb-2">DRAW CARDS:</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDrawCard(selectedPlayer.id, 'backstory')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded transition-colors"
                              >
                                Backstory
                              </button>
                              <button
                                onClick={() => handleDrawCard(selectedPlayer.id, 'objection')}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded transition-colors"
                              >
                                Objection
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Cards Section */}
                      {selectedPlayer.cards && (
                        <div className="border border-purple-500/20 rounded-lg">
                          <button
                            onClick={() => setShowSelectedPlayerCards(!showSelectedPlayerCards)}
                            className="w-full p-4 text-left bg-purple-900/10 hover:bg-purple-900/20 rounded-t-lg transition-colors flex items-center justify-between"
                          >
                            <span className="text-lg font-bold text-purple-300">
                              🎴 View Cards
                            </span>
                            <span className="text-purple-300">
                              {showSelectedPlayerCards ? '▼' : '▶'}
                            </span>
                          </button>
                          
                          {showSelectedPlayerCards && (
                            <div className="p-4 space-y-4">
                              {selectedPlayer.cards.identity && (
                                <div className={`p-4 rounded-lg border-2 ${getCardColor('identity')}`}>
                                  <div className="text-sm text-blue-300 font-bold mb-2">IDENTITY</div>
                                  <div className="text-lg">{selectedPlayer.cards.identity}</div>
                                </div>
                              )}
                              
                              {selectedPlayer.cards.relationship && (
                                <div className={`p-4 rounded-lg border-2 ${getCardColor('relationship')}`}>
                                  <div className="text-sm text-red-300 font-bold mb-2">RELATIONSHIP</div>
                                  <div className="text-lg">{selectedPlayer.cards.relationship}</div>
                                </div>
                              )}
                              
                              {(selectedPlayer.cards.backstory || []).map((card, idx) => (
                                <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('backstory')}`}>
                                  <div className="text-sm text-green-300 font-bold mb-2">BACKSTORY {idx + 1}</div>
                                  <div className="text-lg">{card}</div>
                                </div>
                              ))}
                              
                              {((selectedPlayer.cards as any).objections || []).map((card: string, idx: number) => (
                                <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('objection')}`}>
                                  <div className="text-sm text-gray-300 font-bold mb-2">OBJECTION {idx + 1}</div>
                                  <div className="text-lg">{card}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-purple-200">
                      No player selected
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Right Column - Leaderboard */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <h3 className="text-2xl font-bold text-amber-300 mb-6 text-center">
              🏆 Leaderboard
            </h3>
            
            <div className="space-y-3">
              {displayPlayers
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border ${
                    index === 0 && player.score > 0
                      ? 'border-amber-400 bg-amber-900/20'
                      : currentTurnPlayer?.id === player.id
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-gray-400 bg-gray-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-amber-200">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-bold">
                          {player.name}
                          {player.is_host && <span className="text-amber-300 ml-1">👑</span>}
                          {currentTurnPlayer?.id === player.id && gameState.status === 'playing' && (
                            <span className="text-blue-300 ml-1">🔵</span>
                          )}
                          {player.id === playerId && <span className="text-green-300 ml-1">(You)</span>}
                        </div>
                        {gameState.status === 'playing' && player.cards && player.id !== playerId && !isEstateKeeper && (
                          <div className="text-xs text-gray-400">
                            {player.cards.identity ? 1 : 0}I, {player.cards.relationship ? 1 : 0}R, {(player.cards.backstory || []).length}B, {((player.cards as any).objections || []).length}O
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-200">
                        {player.score}
                      </div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {gameState.status === 'playing' && (
              <div className="mt-6 pt-4 border-t border-amber-500/20">
                <div className="text-center text-sm text-amber-200">
                  Round {gameState.current_round} of {gameState.max_rounds}
                </div>
                {estateKeeper && (
                  <div className="text-center text-xs text-purple-200 mt-1">
                    Estate Keeper: {estateKeeper.name} ⚖️
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
