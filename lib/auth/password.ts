import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 32);
  const stored = Buffer.from(storedHash, "hex");

  if (candidate.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(candidate, stored);
}
