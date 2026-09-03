import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

const DATE_FORMATS = [
  { regex: /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, yearIndex: 0, monthIndex: 1, dayIndex: 2, twoDigitYear: false },
  { regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, yearIndex: 2, monthIndex: 0, dayIndex: 1, twoDigitYear: false },
  { regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/, yearIndex: 2, monthIndex: 0, dayIndex: 1, twoDigitYear: true },
];

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

function normalizeDate(val: string): string {
  const trimmed = val.trim();
  for (const fmt of DATE_FORMATS) {
    const match = trimmed.match(fmt.regex);
    if (match) {
      let year = parseInt(match[fmt.yearIndex], 10);
      const month = parseInt(match[fmt.monthIndex], 10);
      const day = parseInt(match[fmt.dayIndex], 10);
      if (fmt.twoDigitYear) year += 2000;
      if (isValidDate(year, month, day)) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
