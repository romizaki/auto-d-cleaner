# Automated Data Cleaner

A sleek web tool that transforms messy CSVs into clean, structured data in seconds — entirely in your browser.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Web Worker](https://img.shields.io/badge/Web_Worker-0f172a?style=for-the-badge&logo=javascript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## How It Works

A frictionless three-step workflow that delivers immediate time-to-value:

```
 ┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
 │    UPLOAD    │ ───────▶ │   CLEAN DATA     │ ───────▶ │    EXPORT    │
 │  Drop any    │          │     One Click    │          │  Download    │
 │   CSV file   │          │  - local worker  │          │  Cleaned CSV │
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
- **One-Click Clean** — 8 built-in local rules, run off the main thread in a Web Worker
- **Before/After Split View** — Side-by-side comparison of raw vs cleaned data
- **Audit Report** — Every transformation is logged with details
- **Instant Export** — Download cleaned CSV and audit report
- **Try with Sample Data** — One-click demo with pre-loaded messy CSV
- **Zero Data Persistence** — All processing happens in browser memory; nothing is uploaded or stored
- **Free & Private** — No API keys, no external calls, works fully offline

---

## Processing Pipeline

```
📄 CSV Upload
      │
      ▼
🧵 Web Worker (off-main-thread)
      │
      ├── 🔍 Parse & Detect Columns
      │      (PapaParse · column type detection)
      │
      ├── 📊 Health Score Analysis
      │      (completeness · duplicates · format consistency)
      │
      └── ┌─── LOCAL RULE ENGINE ─────────────────────────────┐
          │                                                   │
          │   1. Trim Whitespace                              │
          │   2. Remove Empty Rows                            │
          │   3. Remove Duplicates (exact + fuzzy)            | 
          │   4. Standardize Phones   → E.164 format          │
          │   5. Standardize Dates    → ISO 8601 (YYYY-MM-DD) │
          │   6. Fix Capitalization   → title case / lower    │
          │   7. Standardize Addresses → full street names    │
          │   8. Validate Emails      → RFC 5322 pattern      │
          │                                                   │
      ┌───└───────────────────────────────────────────────────┘
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
┌──────────────────────────────────────────────────────────────┐
│                          BROWSER                             │
│                                                              │
│  🗂  Main Thread                                             │
│     · UI rendering (React)                                   │
│     · File read + worker messaging                           │
│                                                              │
│  🧵  Web Worker                                              │
│     · PapaParse CSV parsing (off main thread)                │
│     · Column type detection                                   │
│     · Health score calculation                                │
│     · 8 local cleaning rules (banded ~optimized dedup)        │
│     · Posts progress events back to the UI                    │
│                                                              │
│  🖥  React UI + State (zero persistence)                      │
└──────────────────────────────────────────────────────────────┘
```

**Key design principles:** SOLID separation of concerns — a client-side parser, an extensible local rule engine, and a dedicated Web Worker that keeps all heavy computation off the main thread so the UI never freezes, even on large CSVs. No external services or API keys are required.

---

## Data Privacy Promise

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                     Data Privacy Promise                       │
│                                                                │
│   ✓  CSV parsed entirely in browser memory                    │
│   ✓  Cleaning runs in an in-browser Web Worker                │
│   ✓  No data ever leaves the browser                          │
│   ✓  No API keys required · works fully offline               │
│   ✓  Nothing is stored, logged, or transmitted                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js** (App Router) + TypeScript |
| Styling | **Tailwind CSS** — dark slate/emerald/amber palette |
| Typography | **Inter** (UI) + **JetBrains Mono** (data previews) |
| CSV Parsing | **PapaParse** — memory-efficient |
| Processing | **Web Worker** — off-main-thread cleaning |
| Deployment | **Vercel** |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

> No configuration required. The app runs entirely on local rules with no API keys.

---

## Cleaning Rules

| Rule | Description |
|---|---|
| Trim Whitespace | Remove leading/trailing spaces from all cells |
| Remove Empty Rows | Strip completely blank rows |
| Remove Duplicates | Exact dedup (always) + fuzzy dedup via banded Levenshtein (auto-disabled over 10K rows) |
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
│   │   └── globals.css                 # Tailwind + custom animations
│   ├── components/                     # 10 UI components
│   │   ├── DropZone.tsx                # Drag & drop with glow animation
│   │   ├── DataHealthScore.tsx         # Circular score ring
│   │   ├── BeforeAfterSplit.tsx        # Draggable split view
│   │   ├── DataTable.tsx               # Monospace table preview
│   │   ├── AuditReport.tsx             # Transformation log
│   │   ├── ExportButton.tsx            # CSV + report export
│   │   ├── SampleDataButton.tsx        # Demo data loader
│   │   ├── SkeletonLoader.tsx          # Shimmer loading skeleton
│   │   ├── CleaningProgress.tsx        # Progress bar + rule status
│   │   └── CheckmarkAnimation.tsx      # Success animation
│   ├── context/
│   │   └── CleanerContext.tsx          # Global state management
│   ├── hooks/
│   │   └── useDataCleaner.ts           # Worker messaging + orchestration
│   ├── lib/
│   │   ├── health-score.ts             # Data health scoring
│   │   ├── worker/
│   │   │   ├── cleaner.worker.ts       # Web Worker: parse + clean pipeline
│   │   │   └── messages.ts             # Main ↔ worker message protocol
│   │   └── rules/                      # 8 cleaning rule modules
│   │       ├── duplicates.ts           # Exact + banded fuzzy dedup
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

Or connect your GitHub repository on [vercel.com](https://vercel.com) for automatic deploy-on-push. No environment variables are required.
