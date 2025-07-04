import { GameState } from "@/utils/gameUtils";

interface DeceasedInfoProps {
  gameState: GameState;
  isEstateKeeper: boolean;
  onRerollDeceased: () => void;
}

export default function DeceasedInfo({
  gameState,
  isEstateKeeper,
  onRerollDeceased,
}: DeceasedInfoProps) {
  const shouldShowDeceasedInfo =
    (isEstateKeeper && gameState.status === "waiting") ||
    gameState.status === "playing";

  return (
    <div className="p-6 rounded-xl border backdrop-blur-sm bg-black/30 border-amber-500/20">
      <h3 className="mb-4 text-2xl font-bold text-center text-amber-300">
        💀 The Deceased 💀
      </h3>

      {shouldShowDeceasedInfo ? (
        <div className="space-y-2 text-center">
          <div className="text-xl font-bold text-amber-200">
            {gameState.deceased_name}
          </div>
          <div className="text-amber-100">
            <strong>Identity:</strong> {gameState.deceased_identity}
          </div>
          <div className="text-amber-100">
            <strong>Estate:</strong> {gameState.deceased_estate}
          </div>
          {gameState.game_settings?.mode === "desi" && (
            <div className="mt-2 text-xs text-green-300">
              🏠 Desi Mode Active
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-amber-200">
          <div className="mb-2 text-lg">🤫 Deceased details hidden</div>
          <div className="text-sm text-amber-300">
            The Estate Keeper is preparing the case...
          </div>
          {gameState.game_settings?.mode === "desi" && (
            <div className="mt-2 text-xs text-green-300">
              🏠 Desi Mode Active
            </div>
          )}
        </div>
      )}

      {/* Re-roll controls - only visible to estate keeper during waiting */}
      {isEstateKeeper && gameState.status === "waiting" && (
        <div className="pt-4 mt-6 border-t border-purple-500/20">
          <button
            onClick={onRerollDeceased}
            className="px-4 py-3 w-full font-semibold text-white bg-purple-600 rounded-lg transition-colors hover:bg-purple-700"
          >
            🎲 Generate New Deceased
          </button>
        </div>
      )}
    </div>
  );
}
