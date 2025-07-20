'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameHeaderProps {
  gameCode: string;
  gameStatus: 'waiting' | 'setup' | 'playing' | 'finished';
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  showEventsLog: boolean;
  setShowEventsLog: (show: boolean) => void;
  isEstateKeeper?: boolean;
  onDeleteGame?: () => void;
}

export default function GameHeader({ 
  gameCode, 
  gameStatus,
  showRules, 
  setShowRules, 
  showEventsLog, 
  setShowEventsLog,
  isEstateKeeper = false,
  onDeleteGame
}: GameHeaderProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/join?code=${gameCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('bg-green-600');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 2000);
    }).catch(() => {
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
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDeleteGame?.();
  };

  return (
    <>
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="funeral-title text-4xl md:text-5xl mb-4 whitespace-nowrap">
          ⚰️ SOMEBODY HAS DIED ⚰️
        </h1>
        
        {/* Only show game code when game is waiting for players */}
        {gameStatus === 'waiting' && (
          <div className="funeral-subtitle mb-6">
            Estate Code: <span className="font-mono text-3xl text-funeral-gold tracking-wider bg-funeral-black/50 px-4 py-2 rounded-lg border border-funeral-gold/30">{gameCode}</span>
          </div>
        )}
        
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setShowRules(!showRules)}
            className="funeral-button text-sm px-6 py-3"
          >
            {showRules ? 'Hide Sacred Rules' : 'Show Sacred Rules'}
          </button>
          <button
            onClick={() => setShowEventsLog(!showEventsLog)}
            className="funeral-button text-sm px-6 py-3"
            style={{
              background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
              borderColor: '#8b5cf6'
            }}
          >
            {showEventsLog ? 'Hide Chronicles' : 'Show Chronicles'}
          </button>
          
          {/* Only show copy invite button when game is waiting for players */}
          {gameStatus === 'waiting' && (
            <button
              onClick={handleCopyShareLink}
              className="funeral-button text-sm px-6 py-3"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                borderColor: '#3b82f6'
              }}
            >
              📋 Copy Invitation
            </button>
          )}
          
          {/* Estate Keeper delete button */}
          {isEstateKeeper && onDeleteGame && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="funeral-button text-sm px-6 py-3"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                borderColor: '#f87171'
              }}
            >
              🗑️ Destroy Estate
            </button>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="funeral-button text-sm px-6 py-3"
            style={{
              background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
              borderColor: '#6b7280'
            }}
          >
            🚪 Depart Estate
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-funeral-black border-2 border-funeral-gold rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-funeral-gold mb-4 font-['Cinzel']">
                Destroy Estate Forever?
              </h3>
              <p className="text-funeral-silver mb-6">
                This will permanently delete the entire estate and all its records. 
                All players will be removed and this action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="funeral-button px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="funeral-button px-6 py-3"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    borderColor: '#f87171'
                  }}
                >
                  Yes, Destroy Estate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
