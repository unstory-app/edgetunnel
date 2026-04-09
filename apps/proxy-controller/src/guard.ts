const BLOCKED = new Set(["localhost", "127.0.0.1", "169.254.169.254"]);

export function assertAllowedTarget(target: URL): void {
  if (BLOCKED.has(target.hostname)) {
    throw new Error("Target host is blocked");
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Unsupported protocol");
  }
}
