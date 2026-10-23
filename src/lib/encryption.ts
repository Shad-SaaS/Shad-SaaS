import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from environment or fallback secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "shad-store-default-secure-fallback-encryption-key-32b";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a string (or JSON string) using AES-256-GCM
 * Output format: iv_hex:tag_hex:ciphertext_hex
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string using AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  
  // If not in encrypted format (e.g. legacy plain text), return as is safely
  if (!encryptedText.includes(":")) {
    return encryptedText;
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    return encryptedText;
  }

  const [ivHex, tagHex, contentHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(contentHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Safely masks a sensitive secret (API Key / Token) for display in the Admin UI
 * Example: "sk_live_1234567890abcdef" -> "••••••••cdef"
 */
export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  const lastFour = secret.slice(-4);
  return `••••••••${lastFour}`;
}
