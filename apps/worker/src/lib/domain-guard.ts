const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "169.254.169.254",
  "metadata.google.internal",
]);

export function assertAllowedTarget(target: string): void {
  const parsed = new URL(target);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("unsupported protocol");
  }

  if (BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("blocked target");
  }
}
