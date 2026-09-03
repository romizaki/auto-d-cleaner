import { CSVRow, ColumnSchema, HealthScore, AuditEntry, RuleName } from "@/types";

export type WorkerRequest =
  | { type: "PARSE"; csvText: string }
  | { type: "CLEAN"; data: CSVRow[]; columns: ColumnSchema[] };

export type WorkerResponse =
  | {
      type: "PARSE_RESULT";
      rows: CSVRow[];
      columns: ColumnSchema[];
      healthScore: HealthScore;
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
      cleanedData: CSVRow[];
      auditLog: AuditEntry[];
      aiUsed?: boolean;
    }
  | { type: "WORKER_ERROR"; message: string };
