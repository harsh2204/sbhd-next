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
  const getCardStyle = (type: string) => {
    switch (type) {
      case 'identity': 
        return 'game-card-identity';
      case 'relationship': 
        return 'game-card-relationship';
      case 'backstory': 
        return 'game-card-backstory';
      case 'objection': 
        return 'game-card-objection';
      default: 
        return 'funeral-card';
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'identity': return '🎭';
      case 'relationship': return '💝';
      case 'backstory': return '📜';
      case 'objection': return '⚖️';
      default: return '🎴';
    }
  };

  const getCardTitle = (type: string) => {
    switch (type) {
      case 'identity': return 'IDENTITY';
      case 'relationship': return 'RELATIONSHIP';
      case 'backstory': return 'BACKSTORY';
      case 'objection': return 'OBJECTION';
      default: return 'CARD';
    }
  };

  if (!player.cards) return null;

  const content = (
    <div className="space-y-6">
      {player.cards.identity && (
        <div className={`${getCardStyle('identity')} p-6 rounded-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-4xl opacity-20 transform rotate-12 translate-x-2 -translate-y-2">
            {getCardIcon('identity')}
          </div>
          <div className="text-sm font-bold mb-3 text-blue-200 font-['Cinzel'] tracking-wider">
            {getCardIcon('identity')} {getCardTitle('identity')}
          </div>
          <div className="text-lg text-white font-['Crimson_Text'] leading-relaxed">
            {player.cards.identity}
          </div>
        </div>
      )}
      
      {player.cards.relationship && (
        <div className={`${getCardStyle('relationship')} p-6 rounded-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-4xl opacity-20 transform rotate-12 translate-x-2 -translate-y-2">
            {getCardIcon('relationship')}
          </div>
          <div className="text-sm font-bold mb-3 text-red-200 font-['Cinzel'] tracking-wider">
            {getCardIcon('relationship')} {getCardTitle('relationship')}
          </div>
          <div className="text-lg text-white font-['Crimson_Text'] leading-relaxed">
            {player.cards.relationship}
          </div>
        </div>
      )}
      
      {(player.cards.backstory || []).map((card, idx) => (
        <div key={idx} className={`${getCardStyle('backstory')} p-6 rounded-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-4xl opacity-20 transform rotate-12 translate-x-2 -translate-y-2">
            {getCardIcon('backstory')}
          </div>
          <div className="text-sm font-bold mb-3 text-green-200 font-['Cinzel'] tracking-wider">
            {getCardIcon('backstory')} {getCardTitle('backstory')} {idx + 1}
          </div>
          <div className="text-lg text-white font-['Crimson_Text'] leading-relaxed">
            {card}
          </div>
        </div>
      ))}
      
      {((player.cards as any).objections || []).map((card: string, idx: number) => (
        <div key={idx} className={`${getCardStyle('objection')} p-6 rounded-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-4xl opacity-20 transform rotate-12 translate-x-2 -translate-y-2">
            {getCardIcon('objection')}
          </div>
          <div className="text-sm font-bold mb-3 text-gray-200 font-['Cinzel'] tracking-wider">
            {getCardIcon('objection')} {getCardTitle('objection')} {idx + 1}
          </div>
          <div className="text-lg text-white font-['Crimson_Text'] leading-relaxed">
            {card}
          </div>
        </div>
      ))}
    </div>
  );

  if (isCollapsible) {
    return (
      <div className="funeral-card-ornate overflow-hidden">
        <button
          onClick={onToggleCollapse}
          className="w-full p-6 text-left bg-funeral-deep-maroon/30 hover:bg-funeral-burgundy/30 transition-colors duration-300 flex items-center justify-between"
        >
          <span className="text-xl font-bold text-funeral-gold font-['Cinzel']">
            {title || '🎴 View Your Cards'}
          </span>
          <span className="text-funeral-gold text-2xl transform transition-transform duration-300" style={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
          }}>
            ▶
          </span>
        </button>
        
        {!isCollapsed && (
          <div className="p-6 bg-funeral-black/20">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {title && (
        <h3 className="text-3xl font-bold text-funeral-gold mb-8 text-center font-['Cinzel']">
          {title}
        </h3>
      )}
      {content}
    </div>
  );
} 
