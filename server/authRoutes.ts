import { Router } from "express";
import { z } from "zod";
import {
  createUser, getUserByEmail, getUserById, verifyPassword,
  markEmailVerified, updatePassword, updateLastLogin,
  createEmailToken, consumeToken, isBusinessEmail, isAdmin,
  writeAuditLog, ADMIN_EMAIL,
} from "./auth.js";
import {
  sendVerificationEmail, sendPasswordResetEmail,
} from "./email.js";
import { db } from "./db.js";
import { auditLogs, users } from "../shared/schema.js";
import { desc, eq } from "drizzle-orm";
import {
  RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema,
} from "../shared/schema.js";

export const authRouter = Router();

// ─── Middleware: require authenticated + verified user ────────────────────────

export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId || !req.session?.isAdmin) {
    return res.status(403).json({ error: "Not authorised" });
  }
  next();
}

// Helper to get client IP
function getIp(req: any): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket?.remoteAddress
    ?? "unknown";
}

// ─── Register ─────────────────────────────────────────────────────────────────

authRouter.post("/register", async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors[0].message });

  const { email, password, firstName, lastName, company } = parse.data;

  if (!isBusinessEmail(email)) {
    return res.status(400).json({
      error: "Please use a business email address. Personal email domains (Gmail, Hotmail, Yahoo etc) are not accepted.",
    });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    // Don't leak whether account exists — send generic message
    return res.json({ message: "If this email is not already registered, you will receive a verification email shortly." });
  }

  try {
    const user = await createUser(email, password, firstName, lastName, company);
    const token = await createEmailToken(user.id, "verify");
    await sendVerificationEmail(email, firstName, token);

    await writeAuditLog("REGISTER", `New registration: ${email}`, user.id, email, getIp(req), req.headers["user-agent"]);

    res.json({ message: "Account created. Please check your email to verify your account." });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── Verify Email ─────────────────────────────────────────────────────────────

authRouter.post("/verify-email", async (req, res) => {
  const { token } = z.object({ token: z.string() }).parse(req.body);

  const user = await consumeToken(token, "verify");
  if (!user) {
    return res.status(400).json({ error: "This verification link is invalid or has expired." });
  }

  await markEmailVerified(user.id);
  await writeAuditLog("EMAIL_VERIFIED", undefined, user.id, user.email, getIp(req));

  res.json({ message: "Email verified. You can now log in." });
});

// ─── Login ────────────────────────────────────────────────────────────────────

authRouter.post("/login", async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors[0].message });

  const { email, password } = parse.data;
  const user = await getUserByEmail(email);

  if (!user || !(await verifyPassword(user, password))) {
    await writeAuditLog("LOGIN_FAILED", `Failed login attempt: ${email}`, undefined, email, getIp(req));
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      error: "Please verify your email address before logging in. Check your inbox for the verification link.",
      unverified: true,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Your account has been deactivated. Contact contact@1giglabs.com." });
  }

  await updateLastLogin(user.id);

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.isAdmin = isAdmin(user.email);

  await writeAuditLog("LOGIN", undefined, user.id, user.email, getIp(req), req.headers["user-agent"]);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      reportCredits: user.reportCredits,
      isAdmin: isAdmin(user.email),
    },
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

authRouter.post("/logout", async (req, res) => {
  const userId = req.session?.userId;
  const email = req.session?.email;

  req.session.destroy(() => {});

  if (userId) {
    await writeAuditLog("LOGOUT", undefined, userId, email, getIp(req));
  }

  res.json({ message: "Logged out." });
});

// ─── Me (current session) ─────────────────────────────────────────────────────

authRouter.get("/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });

  const user = await getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      reportCredits: user.reportCredits,
      isAdmin: isAdmin(user.email),
    },
  });
});

// ─── Resend verification ──────────────────────────────────────────────────────

authRouter.post("/resend-verification", async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await getUserByEmail(email);

  // Always return same message to prevent enumeration
  if (user && !user.isVerified) {
    const token = await createEmailToken(user.id, "verify");
    await sendVerificationEmail(email, user.firstName, token);
  }

  res.json({ message: "If an unverified account exists, a new verification email has been sent." });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

authRouter.post("/forgot-password", async (req, res) => {
  const parse = ForgotPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors[0].message });

  const { email } = parse.data;
  const user = await getUserByEmail(email);

  if (user && user.isVerified) {
    const token = await createEmailToken(user.id, "reset");
    await sendPasswordResetEmail(email, user.firstName, token);
    await writeAuditLog("PASSWORD_RESET_REQUESTED", undefined, user.id, email, getIp(req));
  }

  // Always return same message
  res.json({ message: "If an account exists for this email, you will receive a password reset link shortly." });
});

// ─── Reset Password ───────────────────────────────────────────────────────────

authRouter.post("/reset-password", async (req, res) => {
  const parse = ResetPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors[0].message });

  const { token, password } = parse.data;
  const user = await consumeToken(token, "reset");

  if (!user) {
    return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
  }

  await updatePassword(user.id, password);
  await writeAuditLog("PASSWORD_RESET_COMPLETE", undefined, user.id, user.email, getIp(req));

  res.json({ message: "Password updated. You can now log in with your new password." });
});

// ─── Audit Log (admin only) ───────────────────────────────────────────────────

authRouter.get("/audit-log", async (req, res) => {
  const page = parseInt(req.query.page as string ?? "1") || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ logs, page, limit });
});
