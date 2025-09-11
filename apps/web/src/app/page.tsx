'use client';

import { HomeHero } from '../components/HomeHero';
import { UserList } from '../components/UserList';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HomeHero />
      <div className="bg-white">
        <UserList />
      </div>
    </main>
  );
}
