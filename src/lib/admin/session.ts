/**
 * Admin session tokens — HMAC-SHA256 signed, stored in an httpOnly cookie.
 * Uses the Web Crypto API so it runs in both Edge and Node runtimes.
 * The token payload is: base64url(JSON) + "." + base64url(HMAC signature).
 * ADMIN_PASSWORD is the signing key and must be set in environment variables.
 */

export const ADMIN_COOKIE = "admin_token";
export const SESSION_HOURS = 8;

// ─── helpers ───────────────────────────────────────────────────────────────

const enc = new TextEncoder();

function b64urlEncode(buf: Uint8Array | ArrayBuffer): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// ─── public API ─────────────────────────────────────────────────────────────

/**
 * Creates a signed admin session token for the given email.
 * Throws if ADMIN_PASSWORD is not set.
 */
export async function createAdminToken(email: string): Promise<string> {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) throw new Error("ADMIN_PASSWORD is not set");

  const payload = JSON.stringify({
    email,
    exp: Date.now() + SESSION_HOURS * 3_600_000,
  });
  const data = b64urlEncode(enc.encode(payload));
  const key = await importKey(password);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64urlEncode(sigBuf)}`;
}

/**
 * Verifies a token and returns the session payload, or null if invalid/expired.
 * Returns null (never throws) so it is safe to call in middleware.
 */
export async function verifyAdminToken(
  token: string | null | undefined,
): Promise<{ email: string } | null> {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || !token) return null;

  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const key = await importKey(password);
    const sigBytes = b64urlDecode(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as BufferSource,
      enc.encode(data),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.email !== "string") return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}
