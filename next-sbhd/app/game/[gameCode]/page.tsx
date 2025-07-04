import { Suspense } from 'react';
import { Metadata } from 'next';
import GameClient from './GameClient';

interface GamePageProps {
  params: Promise<{
    gameCode: string;
  }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameCode } = await params;
  return {
    title: `Game ${gameCode.toUpperCase()} - Somebody Has Died`,
    description: `Join the inheritance dispute in game ${gameCode.toUpperCase()}`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameCode } = await params;
  return (
    <Suspense fallback={<GamePageSkeleton />}>
      <GameClient gameCode={gameCode} />
    </Suspense>
  );
}

function GamePageSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-2xl text-amber-300">Loading game...</div>
    </div>
  );
} 
