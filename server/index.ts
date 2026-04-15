import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { router } from "./routes.js";
import { authRouter } from "./authRoutes.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT ?? "3000");

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(cors({ origin: process.env.CLIENT_URL ?? true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check — no DB dependency ─────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Static files ─────────────────────────────────────────────────────────────

const publicPath = path.join(__dirname, "..", "dist", "public");
app.use(express.static(publicPath));

// ─── SPA fallback — MUST be before session so /verify-email etc. never need DB ─

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      console.error(`Failed to serve index.html for ${req.path}:`, err);
      res.status(500).send("Server error");
    }
  });
});

// ─── Session (only API requests reach here) ───────────────────────────────────

const PgStore = connectPgSimple(session);
app.use(
  session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET ?? "1giglabs-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api", router);

// ─── Start listening ──────────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 1GigLabs running on port ${PORT}`);
  console.log(`📁 Static: ${publicPath}`);
});

// ─── DB init (async after server starts) ─────────────────────────────────────

async function init() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await db.execute(sql`SELECT 1`);
      break;
    } catch (err) {
      if (attempt === 10) { console.error("❌ DB failed:", err); process.exit(1); }
      console.warn(`⏳ DB not ready (${attempt}/10), retrying in 3s…`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, company TEXT,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE, is_active BOOLEAN NOT NULL DEFAULT TRUE,
      report_credits INTEGER NOT NULL DEFAULT 5,
      created_at TIMESTAMP DEFAULT NOW(), last_login_at TIMESTAMP)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_tokens (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, token TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY, user_id INTEGER, email TEXT, action TEXT NOT NULL,
      detail TEXT, ip_address TEXT, user_agent TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY, user_id INTEGER, company_name TEXT NOT NULL,
      company_slug TEXT NOT NULL UNIQUE, industry TEXT, report_data JSONB,
      sales_enablement_data JSONB, generated_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(), is_generating BOOLEAN DEFAULT FALSE)`);

    // Migrate existing reports table to add user_id if it doesn't exist
    await db.execute(sql`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER
    `);

    // Migrate existing reports table — add user_id if it doesn't exist yet
    await db.execute(sql`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER
    `);
    console.log("✅ Database initialised");
  } catch (err) {
    console.error("❌ Failed to create tables:", err);
    process.exit(1);
  }
}

init();
