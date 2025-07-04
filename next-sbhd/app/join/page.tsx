import JoinForm from './JoinForm';

interface JoinPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const gameCode = params.code?.toUpperCase() || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in-up">
      <div className="funeral-container max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="funeral-title text-4xl md:text-5xl mb-4">
            ⚰️ Join Estate ⚰️
          </h1>
          <p className="funeral-subtitle">
            Enter the sacred chambers to claim your inheritance
          </p>
        </div>

        <div className="funeral-card-ornate p-8">
          <JoinForm initialGameCode={gameCode} />
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="funeral-button inline-block"
          >
            ← Return to Main Hall
          </a>
        </div>
      </div>
    </div>
  );
} 
