'use client';

import { useRouter } from 'next/navigation';

interface GameHeaderProps {
  gameCode: string;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  showEventsLog: boolean;
  setShowEventsLog: (show: boolean) => void;
}

export default function GameHeader({ 
  gameCode, 
  showRules, 
  setShowRules, 
  showEventsLog, 
  setShowEventsLog 
}: GameHeaderProps) {
  const router = useRouter();

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

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-amber-300 mb-2">
        ⚰️ SOMEBODY HAS DIED ⚰️
      </h1>
      <div className="text-xl text-amber-100 mb-4">
        Game Code: <span className="font-mono text-2xl text-amber-300">{gameCode}</span>
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
          onClick={handleCopyShareLink}
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
  );
} 
