import Papa from "papaparse";
import { CSVRow, ColumnSchema, HealthScore, AuditEntry, RuleName } from "@/types";
import { WorkerRequest, WorkerResponse } from "./messages";
import { calculateHealthScore } from "../health-score";
import { trimWhitespace } from "../rules/whitespace";
import { removeEmptyRows } from "../rules/emptyRows";
import { removeDuplicates } from "../rules/duplicates";
import { standardizePhones } from "../rules/phones";
import { standardizeDates } from "../rules/dates";
import { fixCapitalization } from "../rules/capitalization";
import { standardizeAddresses } from "../rules/addresses";
import { validateEmails } from "../rules/emails";

function detectColumnType(values: string[]): ColumnSchema["type"] {
  if (values.length === 0) return "string";

  const nonEmpty = values.filter((v) => v.trim().length > 0);
  if (nonEmpty.length === 0) return "string";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailCount = nonEmpty.filter((v) => emailRegex.test(v.trim())).length;
  if (emailCount / nonEmpty.length > 0.8) return "email";

  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
  const phoneCount = nonEmpty.filter((v) => phoneRegex.test(v.trim())).length;
  if (phoneCount / nonEmpty.length > 0.8) return "phone";

  const dateRegex =
    /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
  const dateCount = nonEmpty.filter((v) => dateRegex.test(v.trim())).length;
  if (dateCount / nonEmpty.length > 0.8) return "date";

  const numCount = nonEmpty.filter((v) => !isNaN(Number(v.trim()))).length;
  if (numCount / nonEmpty.length > 0.8) return "number";

  return "string";
}

function extractColumns(headers: string[], data: CSVRow[]): ColumnSchema[] {
  return headers.map((header) => {
    const values = data.map((row) => row[header] || "");
    const nullCount = values.filter((v) => v.trim().length === 0).length;
    const type = detectColumnType(values);
    const sampleValues = values
      .filter((v) => v.trim().length > 0)
      .slice(0, 3);

    return {
      name: header,
      type,
      nullCount,
      totalCount: values.length,
      sampleValues,
    };
  });
}

function parseCSV(csvText: string): { data: CSVRow[]; columns: ColumnSchema[] } {
  const results = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = results.meta.fields || [];
  const data = results.data as CSVRow[];
  const columns = extractColumns(headers, data);

  return { data, columns };
}

interface RuleStep {
  name: RuleName;
  label: string;
  run: (rows: CSVRow[], cols: ColumnSchema[]) => { cleaned: CSVRow[]; audit: AuditEntry };
}

function runCleaningPipeline(
  data: CSVRow[],
  columns: ColumnSchema[],
  onProgress: (rule: RuleName, label: string, rowsProcessed: number, totalRows: number) => void
): { cleanedData: CSVRow[]; auditLog: AuditEntry[] } {
  const auditLog: AuditEntry[] = [];
  let current = [...data];

  const steps: RuleStep[] = [
    { name: "trim_whitespace", label: "Trimming whitespace", run: trimWhitespace },
    { name: "remove_empty_rows", label: "Removing empty rows", run: removeEmptyRows },
    { name: "remove_duplicates", label: "Removing duplicates", run: removeDuplicates },
    { name: "standardize_phones", label: "Standardizing phone numbers", run: standardizePhones },
    { name: "standardize_dates", label: "Standardizing dates", run: standardizeDates },
    { name: "fix_capitalization", label: "Fixing capitalization", run: fixCapitalization },
    { name: "standardize_addresses", label: "Standardizing addresses", run: standardizeAddresses },
    { name: "validate_emails", label: "Validating emails", run: validateEmails },
  ];

  const totalRows = current.length;
  for (const step of steps) {
    onProgress(step.name, step.label, totalRows - current.length, totalRows);
    const result = step.run(current, columns);
    current = result.cleaned;
    auditLog.push(result.audit);
  }
  onProgress("validate_emails", "Finalizing", current.length, totalRows);

  return { cleanedData: current, auditLog };
}

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    if (req.type === "PARSE") {
      const { data, columns } = parseCSV(req.csvText);
      const healthScore: HealthScore = calculateHealthScore(data, columns);
      post({ type: "PARSE_RESULT", rows: data, columns, healthScore });
    } else if (req.type === "CLEAN") {
      const { cleanedData, auditLog } = runCleaningPipeline(
        req.data,
        req.columns,
        (rule: RuleName, label: string, rowsProcessed: number, totalRows: number) => {
          post({ type: "CLEAN_PROGRESS", rule, label, rowsProcessed, totalRows });
        }
      );
      post({ type: "CLEAN_RESULT", cleanedData, auditLog });
    }
  } catch (err) {
    post({ type: "WORKER_ERROR", message: err instanceof Error ? err.message : String(err) });
  }
};

export {};
