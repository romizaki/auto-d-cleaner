import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isLikelyName(colName: string): boolean {
  const name = colName.toLowerCase();
  return name.includes("name");
}

function isAddressOwned(colName: string): boolean {
  const name = colName.toLowerCase();
  return (
    name.includes("address") ||
    name.includes("city") ||
    name.includes("street")
  );
}

function isTitleCaseEligibleValue(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) return true;
  if (/\d/.test(v)) return false;
  if (/^[A-Z]+$/.test(v) && v.length <= 4) return false;
  return v.split(/\s+/).filter(Boolean).length <= 3;
}

function columnAllowsTitleCase(col: ColumnSchema): boolean {
  if (col.type !== "string") return false;
  if (isAddressOwned(col.name)) return false;
  return isLikelyName(col.name) || col.applyTitleCase === true;
}

function getColumnCache(
  cache: Map<string, Map<string, string>> | undefined,
  colName: string
): Map<string, string> {
  if (!cache) return new Map<string, string>();
  let colCache = cache.get(colName);
  if (!colCache) {
    colCache = new Map<string, string>();
    cache.set(colName, colCache);
  }
  return colCache;
}

function titleCaseColumnValue(
  val: string,
  colCache: Map<string, string>
): string {
  let mapped = colCache.get(val);
  if (mapped === undefined) {
    mapped = titleCase(val);
    colCache.set(val, mapped);
  }
  return mapped;
}

function applyToRow(
  row: CSVRow,
  columns: ColumnSchema[],
  cache?: Map<string, Map<string, string>>
): CSVRow {
  const titleCaseColumns = columns.filter(columnAllowsTitleCase);
  const emailColumns = columns.filter(
    (c) => c.type === "email" || c.name.toLowerCase().includes("email")
  );
  if (titleCaseColumns.length === 0 && emailColumns.length === 0) return row;

  const newRow = { ...row };
  for (const col of titleCaseColumns) {
    const val = (newRow[col.name] || "").trim();
    if (val.length === 0) continue;
    newRow[col.name] = titleCaseColumnValue(val, getColumnCache(cache, col.name));
  }
  const lowerCaseColumns = emailColumns.filter(
    (c) => !titleCaseColumns.includes(c)
  );
  for (const col of lowerCaseColumns) {
    const val = (newRow[col.name] || "").trim();
    if (val.length === 0) continue;
    newRow[col.name] = val.toLowerCase();
  }
  return newRow;
}

function assertTitleCaseEligibility(rows: CSVRow[], col: ColumnSchema): boolean {
  if (col.applyTitleCase !== undefined) return col.applyTitleCase;
  for (const row of rows) {
    const val = (row[col.name] || "").trim();
    if (val.length > 0 && !isTitleCaseEligibleValue(val)) return false;
  }
  return true;
}

export function fixRowCapitalization(
  row: CSVRow,
  columns: ColumnSchema[],
  cache?: Map<string, Map<string, string>>
): CSVRow {
  return applyToRow(row, columns, cache);
}

export function fixCapitalization(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const titleCaseColumns = columns.filter(
    (c) => columnAllowsTitleCase(c) && assertTitleCaseEligibility(rows, c)
  );
  const emailColumns = columns.filter(
    (c) => c.type === "email" || c.name.toLowerCase().includes("email")
  );

  if (titleCaseColumns.length === 0 && emailColumns.length === 0) {
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
  const cache = new Map<string, Map<string, string>>();

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of titleCaseColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length === 0) continue;
      const fixed = titleCaseColumnValue(val, getColumnCache(cache, col.name));
      if (fixed !== val) {
        newRow[col.name] = fixed;
        affected++;
      }
    }
    const lowerCaseColumns = emailColumns.filter(
      (c) => !titleCaseColumns.includes(c)
    );
    for (const col of lowerCaseColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length === 0) continue;
      const fixed = val.toLowerCase();
      if (fixed !== val) {
        newRow[col.name] = fixed;
        affected++;
      }
    }
    return newRow;
  });

  const affectedCols = [...titleCaseColumns, ...emailColumns];

  return {
    cleaned,
    audit: {
      rule: "fix_capitalization",
      label: "Fix Capitalization",
      description:
        affected > 0
          ? `Fixed capitalization in ${affected} cells`
          : "No capitalization issues found",
      rowsAffected: affected,
      details:
        affected > 0
          ? affectedCols.map((c) => {
              if (c.type === "email") return `Lowercased ${c.name}`;
              return `Title-cased ${c.name}`;
            })
          : [],
    },
  };
}