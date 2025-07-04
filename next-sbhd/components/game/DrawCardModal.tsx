'use client';

import { useState } from 'react';

interface DrawCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDrawCard: (cardType: 'backstory' | 'objection') => Promise<void>;
  playerName: string;
}

export default function DrawCardModal({ isOpen, onClose, onDrawCard, playerName }: DrawCardModalProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<'backstory' | 'objection' | null>(null);

  if (!isOpen) return null;

  const handleDrawCard = async () => {
    if (!selectedCardType || isDrawing) return;
    
    setIsDrawing(true);
    try {
      await onDrawCard(selectedCardType);
      onClose();
      setSelectedCardType(null);
    } catch (error) {
      console.error('Error drawing card:', error);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleClose = () => {
    if (isDrawing) return;
    onClose();
    setSelectedCardType(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-purple-300 mb-4 text-center">
          Draw Card for {playerName}
        </h3>
        
        <div className="space-y-4 mb-6">
          <div className="text-purple-200 text-center mb-4">
            Select the type of card to draw:
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setSelectedCardType('backstory')}
              disabled={isDrawing}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedCardType === 'backstory'
                  ? 'border-green-400 bg-green-900/30 text-green-200'
                  : 'border-green-400/30 bg-green-900/10 text-green-300 hover:bg-green-900/20'
              } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-lg">🟢 Backstory Card</div>
              <div className="text-sm opacity-80">Items, quirks, or life events to include</div>
            </button>
            
            <button
              onClick={() => setSelectedCardType('objection')}
              disabled={isDrawing}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedCardType === 'objection'
                  ? 'border-gray-400 bg-gray-900/30 text-gray-200'
                  : 'border-gray-400/30 bg-gray-900/10 text-gray-300 hover:bg-gray-900/20'
              } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-lg">⚫ Objection Card</div>
              <div className="text-sm opacity-80">Interrupt others with these statements</div>
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDrawing}
            className={`flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors ${
              isDrawing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleDrawCard}
            disabled={!selectedCardType || isDrawing}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              selectedCardType && !isDrawing
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isDrawing ? 'Drawing...' : 'Draw Card'}
          </button>
        </div>
      </div>
    </div>
  );
} 
