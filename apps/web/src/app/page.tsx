'use client';
export const dynamic = "force-dynamic";

import { HomeHero } from '../components/HomeHero';
import { UserList } from '../components/UserList';

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <UserList />
    </>
  );
}
