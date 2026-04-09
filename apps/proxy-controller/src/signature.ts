import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64");
}

export function verifyPayload(payload: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(signPayload(payload, secret));
  const provided = Buffer.from(signature || "");

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}
