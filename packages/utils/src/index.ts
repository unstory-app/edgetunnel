import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: undefined,
    redact: {
        paths: ["headers.authorization", "apiKey", "signature"],
        censor: "[REDACTED]",
    },
});

export function safeJsonParse<T>(value: string, fallback: T): T {
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

export function toBase64(input: Uint8Array): string {
    return Buffer.from(input).toString("base64");
}

export function fromBase64(input?: string): Buffer | undefined {
    if (!input) {
        return undefined;
    }
    return Buffer.from(input, "base64");
}

export function nowUnixSeconds(): number {
    return Math.floor(Date.now() / 1000);
}
