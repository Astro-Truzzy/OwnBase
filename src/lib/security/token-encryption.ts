import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SCRYPT_SALT = "ownbase-github-token-v1";

function resolveKey(): Buffer | null {
  const secret = process.env.GITHUB_TOKEN_ENCRYPTION_KEY?.trim();
  if (!secret) return null;

  if (/^[0-9a-f]{64}$/i.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  if (/^[A-Za-z0-9+/]{43}=$/.test(secret) || secret.length >= 32) {
    try {
      const decoded = Buffer.from(secret, "base64");
      if (decoded.length === 32) return decoded;
    } catch {
      /* fall through to scrypt */
    }
  }

  return scryptSync(secret, SCRYPT_SALT, 32);
}

function requireKeyInProduction(): Buffer | null {
  const key = resolveKey();
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY is required in production to store GitHub tokens.",
    );
  }
  return key;
}

/**
 * Encrypts a GitHub OAuth token for storage. Legacy plaintext values are still readable.
 */
export function encryptToken(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (!trimmed) return trimmed;

  const key = requireKeyInProduction();
  if (!key) return trimmed;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]).toString("base64url");
  return `${PREFIX}${payload}`;
}

/**
 * Decrypts a stored token. Returns plaintext as-is when not encrypted (migration).
 */
export function decryptToken(stored: string): string {
  const value = stored.trim();
  if (!value || !value.startsWith(PREFIX)) return value;

  const key = resolveKey();
  if (!key) {
    throw new Error(
      "Cannot decrypt GitHub token: GITHUB_TOKEN_ENCRYPTION_KEY is not configured.",
    );
  }

  const raw = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted token payload.");
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  return decrypted;
}
