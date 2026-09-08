import Papa from "papaparse";
import {
  CSVRow,
  ColumnSchema,
  HealthScore,
  AuditEntry,
  RuleName,
  PREVIEW_ROWS,
} from "@/types";
import { WorkerRequest, WorkerResponse } from "./messages";
import { detectColumnTypeFromSample } from "../detect-type";
import { trimRow } from "../rules/whitespace";
import { isEmptyRow } from "../rules/emptyRows";
import { standardizeRowPhones } from "../rules/phones";
import { standardizeRowDates } from "../rules/dates";
import { fixRowCapitalization } from "../rules/capitalization";
import { standardizeRowAddresses } from "../rules/addresses";
import { validateRowEmails } from "../rules/emails";
import { runFuzzyDedup } from "../rules/duplicates";

const MAX_SAMPLES = 1000;
const MAX_FUZZY_ROWS = 10000;
const PREVIEW_CAP = PREVIEW_ROWS;

let storedFile: File | null = null;
let headers: string[] = [];
let installedColumns: ColumnSchema[] = [];
let parsedRowCount = 0;
let cleanedRows: CSVRow[] = [];

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

function postError(err: unknown) {
  post({
    type: "WORKER_ERROR",
    message: err instanceof Error ? err.message : String(err),
  });
}

function escapeCSVRow(cells: string[]): string {
  return cells
    .map((val) => {
      const v = val || "";
      return v.includes(",") || v.includes('"') || v.includes("\n") || v.includes("\r")
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    })
    .join(",");
}

function handleParse(file: File) {
  storedFile = file;
  parsedRowCount = 0;
  cleanedRows = [];
  headers = [];
  installedColumns = [];
  let cols: { name: string; nullCount: number; totalCount: number; samples: string[] }[] = [];
  const seen = new Set<string>();
  const preview: CSVRow[] = [];
  const acc = { emptyCells: 0, duplicates: 0, totalCells: 0 };
  let rowCount = 0;

  Papa.parse<CSVRow>(file, {
    header: true,
    skipEmptyLines: true,
    step: (results: Papa.ParseStepResult<CSVRow>) => {
      const row = results.data;
      const fields = results.meta.fields || [];
      if (cols.length === 0 && fields.length > 0) {
        headers = fields;
        cols = fields.map((name) => ({
          name,
          nullCount: 0,
          totalCount: 0,
          samples: [],
        }));
      }

      rowCount++;
      const values = headers.map((h) => row[h] || "");
      values.forEach((v) => {
        if (v.trim().length === 0) acc.emptyCells++;
      });

      const key = JSON.stringify(row);
      if (seen.has(key)) acc.duplicates++;
      else seen.add(key);

      for (let i = 0; i < cols.length; i++) {
        const stat = cols[i];
        const val = values[i] ?? "";
        stat.totalCount++;
        if (val.trim().length === 0) {
          stat.nullCount++;
        } else if (stat.samples.length < MAX_SAMPLES) {
          stat.samples.push(val.trim());
        }
      }

      if (preview.length < PREVIEW_CAP) preview.push({ ...row });
    },
    complete: () => {
      parsedRowCount = rowCount;
      const totalCells = rowCount * (cols.length || 1);
      let invalidFormats = 0;
      const columns: ColumnSchema[] = cols.map((stat) => {
        const type = detectColumnTypeFromSample(stat.samples);
        if (type === "email" || type === "date" || type === "phone") {
          for (const v of stat.samples) {
            const ok =
              type === "email"
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                : type === "date"
                ? /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(v)
                : /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v);
            if (!ok) invalidFormats++;
          }
        }
        return {
          name: stat.name,
          type,
          nullCount: stat.nullCount,
          totalCount: stat.totalCount,
          sampleValues: stat.samples.slice(0, 3),
        };
      });
      installedColumns = columns;

      const healthScore = buildHealthScore(
        { emptyCells: acc.emptyCells, duplicates: acc.duplicates, invalidFormats, totalCells },
        rowCount,
        totalCells
      );

      const warnings: string[] = [];
      if (headers.length === 0) {
        warnings.push("No columns detected. The file may be empty or not a valid CSV.");
      }

      post({
        type: "PARSE_RESULT",
        rowCount,
        columns,
        healthScore,
        warnings,
        preview,
      });
    },
    error: (err: Error) => postError(err),
  });
}

function buildHealthScore(
  issues: { emptyCells: number; duplicates: number; invalidFormats: number; totalCells: number },
  rowCount: number,
  totalCells: number
): HealthScore {
  if (rowCount === 0 || totalCells === 0) {
    return { score: 100, issues: { emptyCells: 0, duplicates: 0, invalidFormats: 0, totalCells: 0 } };
  }
  const emptyRatio = issues.emptyCells / totalCells;
  const dupRatio = issues.duplicates / rowCount;
  const invalidRatio = issues.invalidFormats / totalCells;
  const penalty = emptyRatio * 30 + dupRatio * 40 + invalidRatio * 30;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty * 100)));
  return { score, issues };
}

function handleClean() {
  const file = storedFile;
  const columns = installedColumns;
  if (!file) {
    post({ type: "WORKER_ERROR", message: "No file is loaded to clean." });
    return;
  }
  if (parsedRowCount === 0) {
    post({ type: "WORKER_ERROR", message: "The loaded file has no rows to clean." });
    return;
  }

  const totalRows = parsedRowCount;
  let rowsProcessed = 0;

  const cleaned: CSVRow[] = [];
  const seen = new Set<string>();
  let removedEmpties = 0;

  const emitProgress = (rule: RuleName, label: string) =>
    post({ type: "CLEAN_PROGRESS", rule, label, rowsProcessed, totalRows });

  emitProgress("trim_whitespace", "Reading and cleaning rows");

  Papa.parse<CSVRow>(file, {
    header: true,
    skipEmptyLines: true,
    step: (results: Papa.ParseStepResult<CSVRow>) => {
      rowsProcessed++;
      if (rowsProcessed % 5000 === 0) {
        emitProgress("trim_whitespace", "Reading and cleaning rows");
      }

      let row = trimRow(results.data);
      if (isEmptyRow(row)) {
        removedEmpties++;
        return;
      }

      row = standardizeRowPhones(row, columns);
      row = standardizeRowDates(row, columns);
      row = fixRowCapitalization(row, columns);
      row = standardizeRowAddresses(row, columns);
      row = validateRowEmails(row, columns);

      const key = JSON.stringify(row);
      if (seen.has(key)) return;
      seen.add(key);

      cleaned.push(row);
    },
    complete: () => {
      let rows = cleaned;

      const fuzzySkipped = rows.length > MAX_FUZZY_ROWS;
      let fuzzyRemoved = 0;
      if (!fuzzySkipped) {
        const fuzzy = runFuzzyDedup(rows);
        rows = fuzzy.cleaned;
        fuzzyRemoved = fuzzy.removedCount;
      }

      cleanedRows = rows;

      const exactRemoved = totalRows - removedEmpties - cleaned.length;

      const auditLog: AuditEntry[] = [
        {
          rule: "trim_whitespace",
          label: "Trim Whitespace",
          description: "Trimmed leading/trailing whitespace from all cells",
          rowsAffected: 0,
          details: [],
        },
        {
          rule: "remove_empty_rows",
          label: "Remove Empty Rows",
          description: `Removed ${removedEmpties} empty rows`,
          rowsAffected: removedEmpties,
          details: removedEmpties > 0 ? [`${removedEmpties} completely empty rows removed`] : [],
        },
        {
          rule: "remove_duplicates",
          label: "Removed Duplicates",
          description: `Removed ${exactRemoved} exact and ${fuzzyRemoved} fuzzy duplicate rows`,
          rowsAffected: exactRemoved + fuzzyRemoved,
          details: [
            `${exactRemoved} exact duplicates removed`,
            fuzzyRemoved > 0
              ? `${fuzzyRemoved} near-duplicates removed (similarity > 85%)`
              : fuzzySkipped
              ? `Fuzzy dedup skipped for ${rows.length.toLocaleString()} rows (over ${MAX_FUZZY_ROWS.toLocaleString()} rows, exact-only)`
              : "No near-duplicates found",
          ],
        },
        {
          rule: "standardize_phones",
          label: "Standardize Phone Numbers",
          description: "Normalized detected phone columns to E.164 format",
          rowsAffected: 0,
          details: [],
        },
        {
          rule: "standardize_dates",
          label: "Standardize Dates",
          description: "Normalized detected date columns to ISO 8601 (YYYY-MM-DD)",
          rowsAffected: 0,
          details: [],
        },
        {
          rule: "fix_capitalization",
          label: "Fix Capitalization",
          description: "Title-cased name columns and lowercased email columns",
          rowsAffected: 0,
          details: [],
        },
        {
          rule: "standardize_addresses",
          label: "Standardize Addresses",
          description: "Normalized address columns (title case + expanded abbreviations)",
          rowsAffected: 0,
          details: [],
        },
        {
          rule: "validate_emails",
          label: "Validate Emails",
          description: "Cleared invalid email values in detected email columns",
          rowsAffected: 0,
          details: [],
        },
      ];

      post({
        type: "CLEAN_RESULT",
        cleanedRowCount: rows.length,
        auditLog,
        cleanedPreview: rows.slice(0, PREVIEW_CAP),
      });
    },
    error: (err: Error) => postError(err),
  });
}

function handleExport() {
  const file = storedFile;
  if (!file) {
    post({ type: "WORKER_ERROR", message: "No data to export." });
    return;
  }
  if (cleanedRows.length === 0) {
    post({
      type: "WORKER_ERROR",
      message: "No cleaned data available yet. Run Clean Data before exporting.",
    });
    return;
  }

  const rows = cleanedRows;
  const headersK = headers.length > 0 ? headers : Object.keys(rows[0] || {});
  const parts: string[] = [];
  parts.push(escapeCSVRow(headersK));

  const BATCH = 5000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batchRows = rows.slice(i, i + BATCH);
    parts.push(
      batchRows
        .map((r) => escapeCSVRow(headersK.map((h) => r[h] || "")))
        .join("\n")
    );
  }

  post({
    type: "EXPORT_CSV_RESULT",
    blob: new Blob(parts, { type: "text/csv;charset=utf-8;" }),
    fileName: `cleaned-${file.name || "data.csv"}`,
  });
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    if (req.type === "PARSE") {
      handleParse(req.file);
    } else if (req.type === "CLEAN") {
      handleClean();
    } else if (req.type === "EXPORT_CSV") {
      handleExport();
    }
  } catch (err) {
    postError(err);
  }
};

export {};
