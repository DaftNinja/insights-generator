# 1GigLabs Insight Generator

Strategic business intelligence platform powered by Claude AI. Enter any company name and get a comprehensive 10-section report — financials, strategy, market analysis, tech spend, ESG, SWOT, growth opportunities, risk assessment, digital transformation, and sales enablement — in under 60 seconds.

---

## Stack

- **AI**: Anthropic Claude (`claude-sonnet-4-5`)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Express 5 + TypeScript + Node 20
- **Database**: PostgreSQL + Drizzle ORM
- **Routing**: Wouter
- **Deploy**: Railway (Nixpacks)

---

## Local Development

### Prerequisites

- Node 20+
- PostgreSQL instance (local or remote)
- Anthropic API key

### Setup

```bash
# Clone
git clone https://github.com/DaftNinja/1GigLabs-Insight-Generator.git
cd 1GigLabs-Insight-Generator

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and DATABASE_URL

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173` (Vite) with the API proxied to `http://localhost:3000`.

---

## Railway Deployment

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) → New Project
2. Choose **Deploy from GitHub repo** → select this repo
3. Railway will auto-detect Nixpacks from `nixpacks.toml`

### 2. Add PostgreSQL plugin

In your Railway project:
1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically injects `DATABASE_URL` into your service — no manual config needed

### 3. Set environment variables

In your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` from [console.anthropic.com](https://console.anthropic.com) |
| `SESSION_SECRET` | Any random 32+ character string |
| `NODE_ENV` | `production` |

`DATABASE_URL` and `PORT` are set automatically by Railway.

### 4. Deploy

Railway will trigger a build on every push to `main`. The build process:
1. Installs dependencies (`npm install`)
2. Builds frontend (`vite build` → `dist/public/`)
3. Bundles server (`esbuild` → `dist/server.js`)
4. Starts server (`node dist/server.js`)

The server initialises the `reports` table on first boot — no manual migration needed.

---

## Project Structure

```
client/
  src/
    pages/          Home, Reports, Dashboard, Mission, Presentation, Batch
    components/     Layout, MetricCard, SWOTGrid, RiskMatrix, charts/
    lib/            api.ts, export.ts, utils.ts

server/
  index.ts          Express entry point + DB bootstrap
  routes.ts         All API endpoints
  storage.ts        DB abstraction layer
  claude.ts         Anthropic AI service
  db.ts             Drizzle + pg pool

shared/
  schema.ts         Drizzle table defs + Zod schemas + TypeScript types
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reports/generate` | Generate or return cached report |
| `GET` | `/api/reports` | List all reports |
| `GET` | `/api/reports/:slug` | Get single report |
| `DELETE` | `/api/reports/:id` | Delete report |
| `POST` | `/api/reports/:slug/sales-enablement` | Generate sales brief |
| `POST` | `/api/reports/:slug/investor-presentation` | Generate investor deck |
| `POST` | `/api/reports/batch` | Batch generate up to 50 reports |

---

## Report Caching

Reports are cached for **2 months**. On generation:
- If a report exists and is < 2 months old → return immediately from DB
- If expired or missing → call Claude → save → return
- Use `forceRefresh: true` in the generate request to bypass cache

---

## Export Formats

From any report page:
- **PDF** — `html2canvas` + `jsPDF` browser-side rendering
- **PPTX** — `pptxgenjs` structured slide deck (cover + exec summary + financials + SWOT + risk)
- **HTML** — Self-contained dark-themed HTML file

---

## Licence

Private / proprietary — 1GigLabs © 2025
