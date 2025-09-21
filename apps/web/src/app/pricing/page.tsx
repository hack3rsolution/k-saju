'use client';
export const dynamic = "force-dynamic";
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
