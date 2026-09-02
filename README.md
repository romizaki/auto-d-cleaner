# Automated Data Cleaner

A sleek, AI-powered web tool that transforms messy CSVs into clean, structured data in seconds.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## How It Works

A frictionless three-step workflow that delivers immediate time-to-value:

```
 ┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
 │    UPLOAD    │ ───────▶ │   CLEAN DATA     │ ───────▶ │    EXPORT    │
 │  Drop any    │          │     One Click    │          │  Download    │
 │   CSV file   │          │   - AI powered   │          │  Cleaned CSV │
 └──────────────┘          └──────────────────┘          └──────────────┘
        │                         │                            │
        ▼                         ▼                            ▼
   Auto-detects              Standardizes                 Instant audit
   column schema             phones, dates,               report of all
   & flags issues            addresses, names             transformations
```

---

## Features

- **Drag & Drop Upload** — Drop any CSV file to instantly detect schemas and flag issues
- **Data Health Score** — See at-a-glance how clean your data is (empty cells, duplicates, format issues)
- **One-Click Clean** — 8 built-in local rules + Groq AI for smart standardization
- **Before/After Split View** — Side-by-side comparison of raw vs cleaned data
- **Audit Report** — Every transformation is logged with details
- **Instant Export** — Download cleaned CSV and audit report
- **Try with Sample Data** — One-click demo with pre-loaded messy CSV
- **Zero Data Persistence** — All processing happens in browser memory + ephemeral serverless functions

---

## Processing Pipeline

```
📄 CSV Upload
      │
      ▼
🔍 Parse & Detect Columns
   (PapaParse · reuse columns as type detection)
      │
      ▼
📊 Health Score Analysis
   (completeness · duplicates · format consistency)
      │
      ▼
┌─── LOCAL RULE ENGINE ──────────────────────────────────────┐
│                                                            │
│   1. Trim Whitespace                                        │
│   2. Remove Empty Rows                                      │
│   3. Remove Duplicates (exact + fuzzy >85% similarity)      │
│   4. Standardize Phones        → E.164 format               │
│   5. Standardize Dates         → ISO 8601 (YYYY-MM-DD)      │
│   6. Fix Capitalization        → title case / lowercase     │
│   7. Standardize Addresses     → full street names          │
│   8. Validate Emails           → RFC 5322 pattern           │
│                                                            │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌─── GROQ AI ENHANCEMENT ────────────────────────────────────┐
│                                                            │
│   ✦ Smart standardization via serverless proxy             │
│   ✦ Input sanitization prevents prompt injection           │
│   ✦ Automatic fallback to local rules if not configured    │
│     or on rate-limit / network failure                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
      │
      ▼
🪄 Before / After Split View
      │
      ▼
📋 Audit Report + 💾 Export (CSV + report)
```

---

## Architecture

```
┌──────────────────────────────┐           ┌──────────────────────────────┐
│          BROWSER             │           │      VERCEL SERVERLESS       │
│                              │           │                              │
│  🗂  PapaParse ──→ CSV       │  ──────▶  │  ⚙️  /api/clean             │
│     (streaming, chunked)     │           │     Groq API proxy           │
│                              │           │                              │
│  🧩  Local Rule Engine       │           │  🔒  API key on server only   │
│     (8 regex transformations)│           │     never exposed to client  │
│                              │           │                              │
│  🖥  React UI + State        │  ◀──────  │  ⚡  Ephemeral execution      │
│     (zero persistence)       │           │     per request              │
│                              │           │                              │
└──────────────────────────────┘           └──────────────────────────────┘
```

**Key design principles:** SOLID separation of concerns — a client-side parser, an extensible local rule engine, and a decoupled API consumer hook. The serverless proxy isolates API keys, while fallback mechanisms keep the app running even if the AI service fails.

---

## Data Privacy Promise

```
┌────────────────────────────────────────────────────────────────┐
│                                                               │
│                     Data Privacy Promise                       │
│                                                               │
│   ✓  CSV parsed entirely in browser memory                    │
│   ✓  Cleaning runs in-memory, nothing is stored               │
│   ✓  API keys stay on the server, never in the client         │
│   ✓  No data is stored, logged, or transmitted to a database  │
│   ✓  Input sanitization prevents prompt injection attacks     │
│   ✓  Serverless functions are ephemeral per-request           │
│                                                               │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js** (App Router) + TypeScript |
| Styling | **Tailwind CSS** — dark slate/emerald/amber palette |
| Typography | **Inter** (UI) + **JetBrains Mono** (data previews) |
| CSV Parsing | **PapaParse** — streaming, memory-efficient |
| AI Backend | **Groq API** — via Vercel Serverless Functions |
| Deployment | **Vercel** — unified frontend + serverless deploy |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local

# 3. Add your Groq API key (optional)
#    Edit .env.local and add:
#    GROQ_API_KEY=gsk_your_key_here

# 4. Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

> **No API key? No problem.** The app runs fully on the local rule engine. AI enhancement activates automatically once `GROQ_API_KEY` is configured.

---

## Cleaning Rules

| Rule | Description |
|---|---|
| Trim Whitespace | Remove leading/trailing spaces from all cells |
| Remove Empty Rows | Strip completely blank rows |
| Remove Duplicates | Exact + fuzzy duplicate detection (>85% similarity) |
| Standardize Phones | Normalize to E.164 format (+CountryCodeNumber) |
| Standardize Dates | Unify to ISO 8601 (YYYY-MM-DD) |
| Fix Capitalization | Title-case names, lowercase emails |
| Standardize Addresses | Title case + expand abbreviations (St, Ave, Blvd, etc.) |
| Validate Emails | Remove rows with invalid email formats |

---

## Project Structure

```
auto-d-cleaner/
├── public/
│   └── sample-data.csv                 # Built-in demo dataset
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main cleaning page
│   │   ├── layout.tsx                  # Root layout (fonts, theme)
│   │   ├── globals.css                 # Tailwind + custom animations
│   │   └── api/
│   │       └── clean/route.ts          # Serverless Groq proxy
│   ├── components/                     # 9 UI components
│   │   ├── DropZone.tsx                # Drag & drop with glow animation
│   │   ├── DataHealthScore.tsx         # Circular score ring
│   │   ├── BeforeAfterSplit.tsx        # Draggable split view
│   │   ├── DataTable.tsx               # Monospace table preview
│   │   ├── AuditReport.tsx             # Transformation log
│   │   ├── ExportButton.tsx            # CSV + report export
│   │   ├── SampleDataButton.tsx        # Demo data loader
│   │   ├── SkeletonLoader.tsx          # Shimmer loading state
│   │   └── CheckmarkAnimation.tsx      # Success animation
│   ├── context/
│   │   └── CleanerContext.tsx          # Global state management
│   ├── hooks/
│   │   └── useDataCleaner.ts           # Cleaning pipeline orchestration
│   ├── lib/
│   │   ├── parser.ts                   # PapaParse CSV parsing
│   │   ├── health-score.ts             # Data health scoring
│   │   ├── ai.ts                       # Groq API consumer
│   │   ├── sanitizer.ts                # Prompt injection protection
│   │   └── rules/                      # 8 cleaning rule modules
│   │       ├── engine.ts               # Rule orchestrator
│   │       ├── duplicates.ts           # Exact + fuzzy dedup
│   │       ├── phones.ts               # E.164 standardization
│   │       ├── dates.ts                # ISO 8601 standardization
│   │       ├── capitalization.ts       # Title case / lowercase
│   │       ├── emptyRows.ts            # Blank row removal
│   │       ├── emails.ts               # Email validation
│   │       ├── whitespace.ts           # Cell trimming
│   │       └── addresses.ts            # Address normalization
│   └── types/
│       └── index.ts                    # Shared TypeScript definitions
```

---

## Deployment

Deploy directly to Vercel:

```bash
npx vercel
```

Or connect your GitHub repository on [vercel.com](https://vercel.com) for automatic deploy-on-push.

Add the `GROQ_API_KEY` environment variable in Vercel's project settings — the serverless proxy handles the rest.