import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db.js";
import { users, emailTokens, auditLogs } from "../shared/schema.js";
import { eq, and, gt } from "drizzle-orm";
import type { User } from "../shared/schema.js";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ADMIN_EMAIL = "andrew.mccreath@1giglabs.com";
const FREE_CREDITS = 5;

// Common personal/free email domains to block
const BLOCKED_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "outlook.com", "live.com",
  "msn.com", "aol.com", "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me", "tutanota.com", "zohomail.com",
  "yandex.com", "yandex.ru", "mail.com", "gmx.com", "gmx.net",
]);

export function isBusinessEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !BLOCKED_DOMAINS.has(domain);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createEmailToken(userId: number, type: "verify" | "reset"): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (type === "reset" ? 1 : 24));

  await db.insert(emailTokens).values({ userId, token, type, expiresAt });
  return token;
}

export async function consumeToken(token: string, type: "verify" | "reset"): Promise<User | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.token, token),
        eq(emailTokens.type, type),
        gt(emailTokens.expiresAt, now),
      )
    )
    .limit(1);

  if (!rows[0] || rows[0].usedAt) return null;

  // Mark token used
  await db.update(emailTokens).set({ usedAt: now }).where(eq(emailTokens.token, token));

  // Return the user
  const userRows = await db.select().from(users).where(eq(users.id, rows[0].userId)).limit(1);
  return userRows[0] ?? null;
}

// ─── User management ──────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  company?: string
): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;

  const [user] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    company,
    isVerified: false,
    isActive: true,
    // Admin gets unlimited credits (represented as very high number)
    reportCredits: isAdmin ? 999999 : FREE_CREDITS,
  }).returning();

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function markEmailVerified(userId: number): Promise<void> {
  await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));
}

export async function updatePassword(userId: number, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateLastLogin(userId: number): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

export async function decrementCredits(userId: number): Promise<number> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const newCredits = Math.max(0, user.reportCredits - 1);
  await db.update(users).set({ reportCredits: newCredits }).where(eq(users.id, userId));
  return newCredits;
}

export function isAdmin(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL;
}

// ─── Audit logging ────────────────────────────────────────────────────────────

export async function writeAuditLog(
  action: string,
  detail?: string,
  userId?: number,
  email?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: userId ?? null,
      email: email ?? null,
      action,
      detail: detail ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  } catch (err) {
    // Never let audit logging crash the main flow
    console.error("Audit log write failed:", err);
  }
}
