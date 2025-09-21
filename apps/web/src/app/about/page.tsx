'use client';
export const dynamic = "force-dynamic";
export default function AboutPage() {
  return (
    <main className="container mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">About K-Saju</h1>
      <p className="text-lg text-gray-700">
        K-Saju is a modern monorepo using Next.js (web), Expo (mobile), and shared packages (UI/API).
      </p>
    </main>
  );
}
