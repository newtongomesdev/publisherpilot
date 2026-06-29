import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKeyMaterial() {
  return createHash("sha256").update(process.env.AUTH_SECRET ?? "publisherpilot-local-dev-secret").digest();
}

export function encryptSecret(value: string) {
  if (!value) {
    return "";
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string | null | undefined) {
  if (!payload) {
    return "";
  }

  const [ivBase64, tagBase64, encryptedBase64] = payload.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    return payload;
  }

  const decipher = createDecipheriv("aes-256-gcm", getKeyMaterial(), Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
