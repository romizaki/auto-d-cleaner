import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

export const UPPERCASE_KEYWORDS: string[] = [
  "status",
  "type",
  "category",
  "priority",
  "level",
  "grade",
  "code",
  "flag",
  "mode",
  "phase",
  "state",
  "country",
];

function isUppercaseColumn(col: ColumnSchema): boolean {
  const name = col.name.toLowerCase();
  if (name.includes("email")) return false;
  return UPPERCASE_KEYWORDS.some((kw) => name.includes(kw));
}

export function standardizeRowUppercase(
  row: CSVRow,
  columns: ColumnSchema[]
): CSVRow {
  const uppercaseColumns = columns.filter(isUppercaseColumn);
  if (uppercaseColumns.length === 0) return row;

  const newRow = { ...row };
  for (const col of uppercaseColumns) {
    const val = (newRow[col.name] || "").trim();
    if (val.length > 0) {
      newRow[col.name] = val.toUpperCase();
    }
  }
  return newRow;
}

export function uppercaseKeywordColumns(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const uppercaseColumns = columns.filter(isUppercaseColumn);

  if (uppercaseColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "uppercase_keywords",
        label: "Uppercase Code/Status Columns",
        description: "No status/code columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  let affected = 0;

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of uppercaseColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length > 0) {
        const uppercased = val.toUpperCase();
        if (uppercased !== val) {
          newRow[col.name] = uppercased;
          affected++;
        }
      }
    }
    return newRow;
  });

  return {
    cleaned,
    audit: {
      rule: "uppercase_keywords",
      label: "Uppercase Code/Status Columns",
      description:
        affected > 0
          ? `Uppercased ${affected} values in status/code columns`
          : "No status/code values required uppercasing",
      rowsAffected: affected,
      details:
        affected > 0
          ? [
              ...uppercaseColumns.map(
                (c) => `Uppercased ${c.name} column values`
              ),
            ]
          : [],
    },
  };
}