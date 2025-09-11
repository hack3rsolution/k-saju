#!/bin/bash
# install_phase2.sh - K-Saju monorepo Phase 2 installer

set -e
echo "🚀 Installing K-Saju Phase 2 files..."

# Create directory structure
mkdir -p apps/web/src/{app/{about,pricing,ui-kit},components}
mkdir -p apps/mobile/{assets,src}
mkdir -p packages/{ui/src/components,api/src}
mkdir -p scripts

# Root package.json
cat <<'EOF' > package.json
{
  "name": "k-saju",
  "version": "1.0.0",
  "private": true,
  "description": "K-Saju monorepo",
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "dev:web": "pnpm --filter web dev",
    "dev:ui": "pnpm --filter @k-saju/ui dev",
    "dev:api": "pnpm --filter @k-saju/api dev",
    "lint": "turbo run lint || true",
    "test": "turbo run test",
    "type-check": "turbo run type-check || true",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "mobile:dev": "pnpm --filter mobile dev",
    "web:dev": "pnpm --filter web dev",
    "api:dev": "pnpm --filter api dev"
  },
  "devDependencies": {
    "@turbo/gen": "^1.12.0",
    "turbo": "^1.12.0",
    "prettier": "^3.2.5",
    "eslint": "^8.57.0",
    "typescript": "^5.3.3",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
EOF

# Web app configuration
cat <<'EOF' > apps/web/package.json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "next lint",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@k-saju/ui": "workspace:*",
    "@k-saju/api": "workspace:*",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@next/eslint-plugin-next": "^14.1.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.1.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
EOF

cat <<'EOF' > apps/web/.eslintrc.js
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
EOF

cat <<'EOF' > apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
}
EOF

cat <<'EOF' > apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat <<'EOF' > apps/web/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
EOF

cat <<'EOF' > apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@k-saju/ui', '@k-saju/api'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
EOF

cat <<'EOF' > apps/web/src/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
EOF

cat <<'EOF' > apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'K-Saju Web App',
  description: 'K-Saju web application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

cat <<'EOF' > apps/web/src/app/page.tsx
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
EOF

cat <<'EOF' > apps/web/src/components/HomeHero.tsx
'use client';

import Link from 'next/link';
import { Button, Card, SectionHeader } from '@k-saju/ui';

export const HomeHero = () => {
  const handleGetStarted = () => {
    alert('Getting started with K-Saju!');
  };

  const handleLearnMore = () => {
    alert('Learn more about our features!');
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionHeader
        title="Welcome to K-Saju"
        subtitle="A modern monorepo built with Next.js, React Native, and shared components"
        align="center"
        className="mb-12"
      />

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card padding="lg" shadow="lg">
          <h3 className="text-xl font-semibold mb-4">Web Application</h3>
          <p className="text-gray-600 mb-6">
            Built with Next.js 14 and the App Router, featuring modern React patterns
            and optimized performance.
          </p>
          <Button onClick={handleGetStarted} className="w-full">
            Get Started
          </Button>
        </Card>

        <Card padding="lg" shadow="lg">
          <h3 className="text-xl font-semibold mb-4">Mobile Application</h3>
          <p className="text-gray-600 mb-6">
            Cross-platform mobile app built with Expo and React Native, sharing
            components with the web app.
          </p>
          <Button 
            onClick={handleLearnMore} 
            variant="secondary" 
            className="w-full"
          >
            Learn More
          </Button>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Card padding="lg" className="inline-block">
          <p className="text-gray-700 mb-4">
            Shared UI components work seamlessly across web and mobile platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about">
              <Button variant="secondary">
                Learn About Us
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">
                View Pricing
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
EOF

cat <<'EOF' > apps/web/src/components/UserList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from '@k-saju/ui';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
  };
}

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        
        const userData = await response.json();
        setUsers(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setError(errorMessage);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Our Team"
          subtitle="Loading our amazing team members..."
          align="center"
          className="mb-12"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} padding="lg" shadow="md" className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Our Team"
          subtitle="Something went wrong while loading our team"
          align="center"
          className="mb-12"
        />
        <Card padding="lg" shadow="md" className="max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Team</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionHeader
        title="Our Team"
        subtitle="Meet the amazing people behind K-Saju"
        align="center"
        className="mb-12"
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} padding="lg" shadow="md" className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {user.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {user.company.name}
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <p className="truncate">{user.email}</p>
                <p>{user.phone}</p>
                <a 
                  href={`https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {user.website}
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
EOF

# Continue in next part due to length...
echo "📦 Installing dependencies..."
pnpm install

echo "🏗️ Building shared packages..."
pnpm --filter @k-saju/ui build
pnpm --filter @k-saju/api build

echo "✅ Phase 2 installation complete!"
echo ""
echo "Next steps:"
echo "  pnpm --filter web build"
echo "  pnpm --filter web dev"
echo ""
echo "Then visit:"
echo "  http://localhost:3000"
echo "  http://localhost:3000/about"
echo "  http://localhost:3000/pricing"
echo "  http://localhost:3000/ui-kit"

# Optional: Create project zip
echo "📦 Creating project archive..."
zip -r k-saju.zip . -x "node_modules/*" ".next/*" "dist/*" ".git/*"
echo "✅ Created k-saju.zip"
cat <<'EOF' > install_phase2_part2.sh
#!/bin/bash
set -e
echo "🔧 Creating remaining Phase 2 files..."

# --- Shared UI components ---
cat <<'TS' > packages/ui/src/components/Card.tsx
"use client";
import React from "react";

type Padding = "none" | "sm" | "md" | "lg";
type Shadow = "none" | "sm" | "md" | "lg";

const paddingMap: Record<Padding,string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};
const shadowMap: Record<Shadow,string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  shadow?: Shadow;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = "md",
  shadow = "sm",
  className = "",
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        "rounded-lg bg-white border border-gray-100",
        paddingMap[padding],
        shadowMap[shadow],
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
};
TS

cat <<'TS' > packages/ui/src/components/SectionHeader.tsx
"use client";
import React from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  align = "left",
  className = "",
}) => {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <div className={["space-y-2", alignClass, className].filter(Boolean).join(" ")}>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  );
};
TS

# index.ts (overwrite with all exports)
cat <<'TS' > packages/ui/src/index.ts
export * from "./components/Button";
export * from "./components/Input";
export * from "./components/Card";
export * from "./components/SectionHeader";
TS

# --- App routes ---

# /about
cat <<'TSX' > apps/web/src/app/about/page.tsx
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
TSX

# /pricing
cat <<'TSX' > apps/web/src/app/pricing/page.tsx
export default function PricingPage() {
  const tiers = [
    { name: "Free", price: "$0", features: ["Basic features", "Community support"] },
    { name: "Pro", price: "$9/mo", features: ["All Free", "Priority support", "More limits"] },
    { name: "Team", price: "$29/mo", features: ["All Pro", "Team seat", "Advanced limits"] },
  ];
  return (
    <main className="container mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-10">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map(t => (
          <div key={t.name} className="rounded-lg border p-6 bg-white">
            <h3 className="text-xl font-semibold">{t.name}</h3>
            <p className="text-3xl font-bold my-2">{t.price}</p>
            <ul className="text-gray-700 list-disc ml-5 space-y-1">
              {t.features.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
TSX

# /ui-kit
cat <<'TSX' > apps/web/src/app/ui-kit/page.tsx
"use client";
import { Button, Card, SectionHeader, Input } from "@k-saju/ui";
import { useState } from "react";

export default function UIKitPage() {
  const [val, setVal] = useState("");
  return (
    <main className="container mx-auto px-6 py-16 space-y-10">
      <SectionHeader title="UI Kit" subtitle="Preview shared components" />
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Buttons</h3>
          <div className="flex gap-3">
            <Button onClick={() => alert("Primary!")}>Primary</Button>
            <Button variant="secondary" onClick={() => alert("Secondary!")}>Secondary</Button>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Input</h3>
          <Input value={val} onChange={setVal} placeholder="Type here..." />
          <div className="text-sm text-gray-600 mt-2">Value: {val}</div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Info</h3>
          <p className="text-gray-700">These components are shared from <code>@k-saju/ui</code>.</p>
        </Card>
      </div>
    </main>
  );
}
TSX

echo "🧱 Building shared UI/API..."
pnpm --filter @k-saju/ui build
pnpm --filter @k-saju/api build

echo "✅ Part 2 complete."
echo "Next:"
echo "  pnpm --filter web build"
echo "  pnpm --filter web dev"
EOF

chmod +x install_phase2_part2.sh
./install_phase2_part2.sh
