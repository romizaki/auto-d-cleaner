import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

const DATE_FORMATS = [
  { regex: /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, parser: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` },
  { regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, parser: (m: RegExpMatchArray) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
  { regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/, parser: (m: RegExpMatchArray) => `20${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
];

function normalizeDate(val: string): string {
  const trimmed = val.trim();
  for (const fmt of DATE_FORMATS) {
    const match = trimmed.match(fmt.regex);
    if (match) {
      const iso = fmt.parser(match);
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        return iso;
      }
    }
  }
  return trimmed;
}

export function standardizeDates(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const dateColumns = columns.filter(
    (c) => c.type === "date" || c.name.toLowerCase().includes("date")
  );

  if (dateColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "standardize_dates",
        label: "Standardize Dates",
        description: "No date columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  let affected = 0;
  const details: string[] = [];

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of dateColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length > 0) {
        const normalized = normalizeDate(val);
        if (normalized !== val) {
          newRow[col.name] = normalized;
          affected++;
        }
      }
    }
    return newRow;
  });

  if (affected > 0) {
    details.push(
      ...dateColumns.map((c) => `Standardized ${c.name} to ISO 8601 (YYYY-MM-DD)`)
    );
  }

  return {
    cleaned,
    audit: {
      rule: "standardize_dates",
      label: "Standardize Dates",
      description: `Standardized ${affected} date values to ISO 8601 format`,
      rowsAffected: affected,
      details,
    },
  };
}
