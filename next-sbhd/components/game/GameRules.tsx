interface GameRulesProps {
  isEstateKeeper: boolean;
  showRules: boolean;
}

export default function GameRules({ isEstateKeeper, showRules }: GameRulesProps) {
  if (!showRules) return null;

  return (
    <div className="p-6 mb-8 rounded-xl border backdrop-blur-sm bg-black/30 border-amber-500/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-amber-300">Game Rules</h2>
        <a
          href="https://www.someonehasdiedgame.com/howtoplay"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-sm text-white bg-amber-600 rounded transition-colors hover:bg-amber-700"
        >
          📖 Full Official Rules
        </a>
      </div>
      
      {isEstateKeeper ? (
        <div className="flex flex-row gap-4 justify-evenly text-amber-100">
          <div>
            <h3 className="mb-3 font-bold text-purple-300">Your Role as Estate Keeper:</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Game Master & Judge:</strong> Guide players through the experience and decide who wins</li>
              <li><strong>Objection Cards:</strong> Award objection cards to players who say something funny or clever</li>
              <li><strong>Scoring:</strong> Award 1-4 points based on how compelling or entertaining each argument is</li>
              <li><strong>Turn Management:</strong> Control the flow between rounds and advance turns</li>
              <li><strong>Final Decision:</strong> Choose the winner based on who made the best case (or entertained you most!)</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border bg-purple-900/20 border-purple-500/20">
            <h4 className="mb-2 font-bold text-purple-200">Game Flow (4 Rounds):</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Round 1 - Opening Statements:</strong> Players introduce themselves and their claim</li>
              <li><strong>Round 2 - Interrogation:</strong> Ask each player one direct question</li>
              <li><strong>Round 3 - Recess:</strong> Players question each other "off the record"</li>
              <li><strong>Round 4 - Final Statements:</strong> Last chance for players to make their case</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-4 justify-evenly text-amber-100">
          <div>
            <h3 className="mb-3 font-bold text-amber-200">Your Role as Player:</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Craft Your Character:</strong> Use ALL cards in your hand to create a compelling story</li>
              <li><strong>Make Your Case:</strong> Convince the estate keeper you deserve the inheritance</li>
              <li><strong>Use Cards Creatively:</strong> Incorporate identity, relationship, backstory, and objection cards</li>
              <li><strong>Interact & Object:</strong> Use objection cards during others' turns (max 2 per turn)</li>
              <li><strong>Defend Your Story:</strong> Respond to objections - you cannot declare them false!</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border bg-amber-900/20 border-amber-500/20">
            <h4 className="mb-2 font-bold text-amber-200">Card Types:</h4>
            <ul className="space-y-1 text-sm">
              <li><span className="text-blue-300">🔵 Identity:</span> Your occupation or character description</li>
              <li><span className="text-red-300">🔴 Relationship:</span> How you knew the deceased</li>
              <li><span className="text-green-300">🟢 Backstory:</span> Items, quirks, or life events to include</li>
              <li><span className="text-gray-300">⚫ Objection:</span> Interrupt others with these statements</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 
