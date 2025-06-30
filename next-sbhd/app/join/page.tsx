import JoinForm from './JoinForm';

interface JoinPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const gameCode = params.code?.toUpperCase() || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-300 mb-2">
            ⚰️ Join Game ⚰️
          </h1>
          <p className="text-amber-100">
            Enter your details to join the inheritance battle!
          </p>
        </div>

        <JoinForm initialGameCode={gameCode} />

        {/* Navigation */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-amber-300 hover:text-amber-200 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 
