import { GameEvent, GameState } from '@/utils/gameUtils';

interface EventsLogProps {
  showEventsLog: boolean;
  gameEvents: GameEvent[];
  gameState: GameState;
}

export default function EventsLog({ showEventsLog, gameEvents, gameState }: EventsLogProps) {
  if (!showEventsLog) return null;

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
      case 'deceased_rerolled':
        const attributes = eventData.rerolled_attributes || [];
        if (attributes.length === 3) {
          return `Estate Keeper re-rolled all deceased attributes`;
        } else {
          return `Estate Keeper re-rolled deceased ${attributes.join(', ')}`;
        }
      default:
        return `${event.event_type}: ${JSON.stringify(eventData)}`;
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
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
  );
} 
