const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
    );
}

export async function signPayload(payload: string, secret: string): Promise<string> {
    const key = await importKey(secret);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyPayload(payload: string, signature: string, secret: string): Promise<boolean> {
    try {
        const key = await importKey(secret);
        const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
        return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
    } catch {
        return false;
    }
}
