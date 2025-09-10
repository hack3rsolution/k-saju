"use client";

import { Button } from '@k-saju/ui';

export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">K-Saju Web App</h1>
      <p className="text-lg mb-4">Welcome to the K-Saju web application.</p>
      <Button onClick={() => alert('Hello from shared UI!')}>Click me!</Button>
    </main>
  );
}

