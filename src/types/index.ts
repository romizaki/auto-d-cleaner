export type ColumnType = "string" | "number" | "date" | "email" | "phone" | "unknown";

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullCount: number;
  totalCount: number;
  sampleValues: string[];
}

export interface CSVRow {
  [key: string]: string;
}

export type RuleName =
  | "remove_duplicates"
  | "standardize_phones"
  | "standardize_dates"
  | "fix_capitalization"
  | "remove_empty_rows"
  | "validate_emails"
  | "trim_whitespace"
  | "standardize_addresses";

export interface CleaningRule {
  name: RuleName;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AuditEntry {
  rule: RuleName;
  label: string;
  description: string;
  rowsAffected: number;
  details: string[];
}

export interface HealthScore {
  score: number;
  issues: {
    emptyCells: number;
    duplicates: number;
    invalidFormats: number;
    totalCells: number;
  };
}

export type AppStage =
  | "idle"
  | "uploaded"
  | "analyzing"
  | "ready"
  | "cleaning"
  | "done"
  | "error";

export interface CleanProgress {
  rule: RuleName;
  label: string;
  rowsProcessed: number;
  totalRows: number;
}

export const PREVIEW_ROWS = 100;

export interface CleanerState {
  stage: AppStage;
  fileName: string;
  fileSize: number;
  rowCount: number;
  cleanedRowCount: number;
  columns: ColumnSchema[];
  healthScore: HealthScore | null;
  auditLog: AuditEntry[];
  progress: CleanProgress | null;
  error: string | null;
  warnings: string[];
  preview: CSVRow[];
  cleanedPreview: CSVRow[];
}
