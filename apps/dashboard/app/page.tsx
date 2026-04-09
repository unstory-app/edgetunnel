import { Suspense } from "react";
import { UsageCards } from "../components/dashboard/usage-cards";
import { getUsageSummary } from "../lib/metrics";

async function DashboardContent() {
  const summary = await getUsageSummary();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.28em] text-sea">EdgeTunnel</p>
        <h1 className="mt-2 text-4xl font-semibold">Proxy Command Center</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Issue API keys, monitor bandwidth, and keep p95 latency low across your global proxy fleet.
        </p>
      </header>
      <UsageCards data={summary} />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl p-8">Loading dashboard...</main>}>
      <DashboardContent />
    </Suspense>
  );
}
