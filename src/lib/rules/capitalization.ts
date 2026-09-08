import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isLikelyName(colName: string): boolean {
  const name = colName.toLowerCase();
  return (
    name.includes("name") ||
    name.includes("city") ||
    name.includes("address") ||
    name.includes("country") ||
    name.includes("state")
  );
}

function applyToRow(row: CSVRow, columns: ColumnSchema[]): CSVRow {
  const nameColumns = columns.filter(
    (c) =>
      (c.type === "string" && isLikelyName(c.name)) ||
      c.type === "email"
  );
  if (nameColumns.length === 0) return row;

  const newRow = { ...row };
  for (const col of nameColumns) {
    const val = (newRow[col.name] || "").trim();
    if (val.length === 0) continue;

    if (col.type === "email" || col.name.toLowerCase().includes("email")) {
      newRow[col.name] = val.toLowerCase();
    } else {
      newRow[col.name] = titleCase(val);
    }
  }
  return newRow;
}

export function fixRowCapitalization(
  row: CSVRow,
  columns: ColumnSchema[]
): CSVRow {
  return applyToRow(row, columns);
}

export function fixCapitalization(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const nameColumns = columns.filter(
    (c) =>
      (c.type === "string" && isLikelyName(c.name)) ||
      c.type === "email"
  );

  if (nameColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "fix_capitalization",
        label: "Fix Capitalization",
        description: "No applicable columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  let affected = 0;
  const details: string[] = [];

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of nameColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length === 0) continue;

      let fixed: string;
      if (col.type === "email" || col.name.toLowerCase().includes("email")) {
        fixed = val.toLowerCase();
      } else {
        fixed = titleCase(val);
      }

      if (fixed !== val) {
        newRow[col.name] = fixed;
        affected++;
      }
    }
    return newRow;
  });

  if (affected > 0) {
    details.push(
      ...nameColumns.map((c) => {
        if (c.type === "email") return `Lowercased ${c.name}`;
        return `Title-cased ${c.name}`;
      })
    );
  }

  return {
    cleaned,
    audit: {
      rule: "fix_capitalization",
      label: "Fix Capitalization",
      description: `Fixed capitalization in ${affected} cells`,
      rowsAffected: affected,
      details,
    },
  };
}
