import { Player } from '@/utils/gameUtils';

interface PlayerCardsProps {
  player: Player;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  title?: string;
}

export default function PlayerCards({ 
  player, 
  isCollapsible = false, 
  isCollapsed = false, 
  onToggleCollapse,
  title 
}: PlayerCardsProps) {
  const getCardColor = (type: string) => {
    switch (type) {
      case 'identity': return 'border-blue-400 bg-blue-900/20';
      case 'relationship': return 'border-red-400 bg-red-900/20';
      case 'backstory': return 'border-green-400 bg-green-900/20';
      case 'objection': return 'border-gray-400 bg-gray-900/20';
      default: return 'border-amber-400 bg-amber-900/20';
    }
  };

  if (!player.cards) return null;

  const content = (
    <div className="space-y-4">
      {player.cards.identity && (
        <div className={`p-4 rounded-lg border-2 ${getCardColor('identity')}`}>
          <div className="text-sm text-blue-300 font-bold mb-2">IDENTITY</div>
          <div className="text-lg">{player.cards.identity}</div>
        </div>
      )}
      
      {player.cards.relationship && (
        <div className={`p-4 rounded-lg border-2 ${getCardColor('relationship')}`}>
          <div className="text-sm text-red-300 font-bold mb-2">RELATIONSHIP</div>
          <div className="text-lg">{player.cards.relationship}</div>
        </div>
      )}
      
      {(player.cards.backstory || []).map((card, idx) => (
        <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('backstory')}`}>
          <div className="text-sm text-green-300 font-bold mb-2">BACKSTORY {idx + 1}</div>
          <div className="text-lg">{card}</div>
        </div>
      ))}
      
      {((player.cards as any).objections || []).map((card: string, idx: number) => (
        <div key={idx} className={`p-4 rounded-lg border-2 ${getCardColor('objection')}`}>
          <div className="text-sm text-gray-300 font-bold mb-2">OBJECTION {idx + 1}</div>
          <div className="text-lg">{card}</div>
        </div>
      ))}
    </div>
  );

  if (isCollapsible) {
    return (
      <div className="border border-purple-500/20 rounded-lg">
        <button
          onClick={onToggleCollapse}
          className="w-full p-4 text-left bg-purple-900/10 hover:bg-purple-900/20 rounded-t-lg transition-colors flex items-center justify-between"
        >
          <span className="text-lg font-bold text-purple-300">
            {title || '🎴 View Cards'}
          </span>
          <span className="text-purple-300">
            {isCollapsed ? '▶' : '▼'}
          </span>
        </button>
        
        {!isCollapsed && (
          <div className="p-4">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {title && (
        <h3 className="text-2xl font-bold text-amber-300 mb-6 text-center">
          {title}
        </h3>
      )}
      {content}
    </>
  );
} 
