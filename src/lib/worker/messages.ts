import { CSVRow, ColumnSchema, HealthScore, AuditEntry, RuleName } from "@/types";

export type WorkerRequest =
  | { type: "PARSE"; file: File }
  | { type: "CLEAN" }
  | { type: "EXPORT_CSV" };

export type WorkerResponse =
  | {
      type: "PARSE_RESULT";
      rowCount: number;
      columns: ColumnSchema[];
      healthScore: HealthScore;
      warnings: string[];
      preview: CSVRow[];
    }
  | {
      type: "CLEAN_PROGRESS";
      rule: RuleName;
      label: string;
      rowsProcessed: number;
      totalRows: number;
    }
  | {
      type: "CLEAN_RESULT";
      cleanedRowCount: number;
      auditLog: AuditEntry[];
      cleanedPreview: CSVRow[];
    }
  | { type: "EXPORT_CSV_RESULT"; blob: Blob; fileName: string }
  | { type: "WORKER_ERROR"; message: string };
