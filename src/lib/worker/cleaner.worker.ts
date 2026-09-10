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
import { standardizeRowUppercase } from "../rules/uppercase";

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

function countChangedCells(before: CSVRow, after: CSVRow): number {
  let count = 0;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if ((before[key] || "") !== (after[key] || "")) count++;
  }
  return count;
}

function isTitleCaseEligibleValue(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) return true;
  if (/\d/.test(v)) return false;
  if (/^[A-Z]+$/.test(v) && v.length <= 4) return false;
  return v.split(/\s+/).filter(Boolean).length <= 3;
}

function handleParse(file: File) {
  storedFile = file;
  parsedRowCount = 0;
  cleanedRows = [];
  headers = [];
  installedColumns = [];
  let cols: {
    name: string;
    nullCount: number;
    totalCount: number;
    samples: string[];
    titleCaseable: boolean;
    nonEmpty: number;
  }[] = [];
  const seen = new Set<string>();
  const preview: CSVRow[] = [];
  const acc = { emptyCells: 0, duplicates: 0, totalCells: 0 };
  let rowCount = 0;

  Papa.parse<CSVRow>(file, {
    header: true,
    skipEmptyLines: "greedy",
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
          titleCaseable: true,
          nonEmpty: 0,
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
        } else {
          if (stat.samples.length < MAX_SAMPLES) {
            stat.samples.push(val.trim());
          }
          stat.nonEmpty++;
          if (stat.titleCaseable && !isTitleCaseEligibleValue(val)) {
            stat.titleCaseable = false;
          }
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
        if (
          type === "email" ||
          type === "date" ||
          type === "phone" ||
          type === "number"
        ) {
          for (const v of stat.samples) {
            const ok =
              type === "email"
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                : type === "date"
                ? /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(v)
                : type === "phone"
                ? /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v)
                : !isNaN(Number(v));
            if (!ok) invalidFormats++;
          }
        }
        return {
          name: stat.name,
          type,
          nullCount: stat.nullCount,
          totalCount: stat.totalCount,
          sampleValues: stat.samples.slice(0, 3),
          applyTitleCase: stat.titleCaseable && stat.nonEmpty > 0,
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
  const capsCache = new Map<string, Map<string, string>>();
  let removedEmpties = 0;
  let trimmedCells = 0;
  let phonesAffected = 0;
  let datesAffected = 0;
  let capsAffected = 0;
  let addrsAffected = 0;
  let emailsCleared = 0;
  let uppercaseAffected = 0;

  const emitProgress = (rule: RuleName, label: string) =>
    post({ type: "CLEAN_PROGRESS", rule, label, rowsProcessed, totalRows });

  const emitPhaseProgress = () => {
    const ratio = totalRows > 0 ? rowsProcessed / totalRows : 0;
    if (ratio < 0.34) {
      emitProgress("trim_whitespace", "Trimming whitespace & removing empty rows");
    } else if (ratio < 0.67) {
      emitProgress("standardize_phones", "Standardizing phones & dates");
    } else {
      emitProgress("standardize_addresses", "Fixing capitalization, codes & addresses");
    }
  };

  emitPhaseProgress();

  Papa.parse<CSVRow>(file, {
    header: true,
    skipEmptyLines: "greedy",
    step: (results: Papa.ParseStepResult<CSVRow>) => {
      rowsProcessed++;
      if (rowsProcessed % 5000 === 0) {
        emitPhaseProgress();
      }

      let row = trimRow(results.data);
      trimmedCells += countChangedCells(results.data, row);
      if (isEmptyRow(row)) {
        removedEmpties++;
        return;
      }

      const beforePhones = row;
      row = standardizeRowPhones(row, columns);
      phonesAffected += countChangedCells(beforePhones, row);

      const beforeDates = row;
      row = standardizeRowDates(row, columns);
      datesAffected += countChangedCells(beforeDates, row);

      const beforeCaps = row;
      row = fixRowCapitalization(row, columns, capsCache);
      capsAffected += countChangedCells(beforeCaps, row);

      const beforeUpper = row;
      row = standardizeRowUppercase(row, columns);
      uppercaseAffected += countChangedCells(beforeUpper, row);

      const beforeAddrs = row;
      row = standardizeRowAddresses(row, columns);
      addrsAffected += countChangedCells(beforeAddrs, row);

      const beforeEmails = row;
      row = validateRowEmails(row, columns);
      emailsCleared += countChangedCells(beforeEmails, row);

      const key = JSON.stringify(row);
      if (seen.has(key)) return;
      seen.add(key);

      cleaned.push(row);
    },
    complete: () => {
      let rows = cleaned;

      rowsProcessed = totalRows;
      emitPhaseProgress();

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
          description:
            trimmedCells > 0
              ? `Trimmed leading/trailing whitespace from ${trimmedCells} cells`
              : "No cells required whitespace trimming",
          rowsAffected: trimmedCells,
          details:
            trimmedCells > 0
              ? [`Removed surrounding whitespace in ${trimmedCells} cells`]
              : [],
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
          description:
            phonesAffected > 0
              ? `Normalized ${phonesAffected} phone numbers to E.164 format`
              : "No phone numbers required normalization",
          rowsAffected: phonesAffected,
          details: phonesAffected > 0 ? [`Standardized phone numbers to E.164 format`] : [],
        },
        {
          rule: "standardize_dates",
          label: "Standardize Dates",
          description:
            datesAffected > 0
              ? `Normalized ${datesAffected} date values to ISO 8601 (YYYY-MM-DD)`
              : "No date values required normalization",
          rowsAffected: datesAffected,
          details: datesAffected > 0 ? [`Normalized dates to YYYY-MM-DD format`] : [],
        },
        {
          rule: "fix_capitalization",
          label: "Fix Capitalization",
          description:
            capsAffected > 0
              ? `Fixed capitalization in ${capsAffected} cells`
              : "No capitalization issues found",
          rowsAffected: capsAffected,
          details: capsAffected > 0 ? [`Title-cased name columns and lowercased emails`] : [],
        },
        {
          rule: "uppercase_keywords",
          label: "Uppercase Code/Status Columns",
          description:
            uppercaseAffected > 0
              ? `Uppercased ${uppercaseAffected} values in status/code columns`
              : "No status/code columns required uppercasing",
          rowsAffected: uppercaseAffected,
          details:
            uppercaseAffected > 0
              ? [`Uppercased status, type, code and state/country-style values`]
              : [],
        },
        {
          rule: "standardize_addresses",
          label: "Standardize Addresses",
          description:
            addrsAffected > 0
              ? `Standardized ${addrsAffected} address values (title case + expanded abbreviations)`
              : "No address values required standardization",
          rowsAffected: addrsAffected,
          details: addrsAffected > 0 ? [`Expanded street abbreviations and title-cased addresses`] : [],
        },
        {
          rule: "validate_emails",
          label: "Validate Emails",
          description:
            emailsCleared > 0
              ? `Cleared ${emailsCleared} invalid email values`
              : "No invalid emails found",
          rowsAffected: emailsCleared,
          details:
            emailsCleared > 0
              ? [`Cleared ${emailsCleared} values that failed email format validation`]
              : [],
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
