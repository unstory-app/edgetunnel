type UsageCardsProps = {
  data: {
    requests: number;
    bandwidthGb: number;
    p95LatencyMs: number;
  };
};

export function UsageCards({ data }: UsageCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sea">Requests</p>
        <p className="mt-2 text-3xl font-semibold text-ink">{data.requests.toLocaleString()}</p>
      </article>
      <article className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sea">Bandwidth</p>
        <p className="mt-2 text-3xl font-semibold text-ink">{data.bandwidthGb} GB</p>
      </article>
      <article className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sea">P95 Latency</p>
        <p className="mt-2 text-3xl font-semibold text-ink">{data.p95LatencyMs} ms</p>
      </article>
    </section>
  );
}
