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
