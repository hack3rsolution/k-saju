'use client';
export const dynamic = "force-dynamic";
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
