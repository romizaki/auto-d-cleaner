import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

const ABBREVIATIONS: Record<string, string> = {
  st: "Street",
  ave: "Avenue",
  blvd: "Boulevard",
  dr: "Drive",
  ln: "Lane",
  ct: "Court",
  pl: "Place",
  rd: "Road",
  way: "Way",
  cir: "Circle",
};

const ABBREVIATION_REGEXES: { regex: RegExp; full: string }[] = Object.entries(
  ABBREVIATIONS
).map(([abbr, full]) => ({
  regex: new RegExp(`\\b${abbr}\\b`, "gi"),
  full,
}));

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function standardizeAddress(val: string): string {
  let result = titleCase(val);
  for (const { regex, full } of ABBREVIATION_REGEXES) {
    result = result.replace(regex, full);
  }
  return result;
}

function findAddressColumns(columns: ColumnSchema[]): ColumnSchema[] {
  return columns.filter(
    (c) =>
      c.name.toLowerCase().includes("address") ||
      c.name.toLowerCase().includes("city") ||
      c.name.toLowerCase().includes("street")
  );
}

export function standardizeRowAddresses(
  row: CSVRow,
  columns: ColumnSchema[]
): CSVRow {
  const addressColumns = findAddressColumns(columns);
  if (addressColumns.length === 0) return row;

  const newRow = { ...row };
  for (const col of addressColumns) {
    const val = (newRow[col.name] || "").trim();
    if (val.length > 0) {
      newRow[col.name] = standardizeAddress(val);
    }
  }
  return newRow;
}

export function standardizeAddresses(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const addressColumns = findAddressColumns(columns);

  if (addressColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "standardize_addresses",
        label: "Standardize Addresses",
        description: "No address columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  let affected = 0;
  const details: string[] = [];

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of addressColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length > 0) {
        const standardized = standardizeAddress(val);
        if (standardized !== val) {
          newRow[col.name] = standardized;
          affected++;
        }
      }
    }
    return newRow;
  });

  if (affected > 0) {
    details.push(
      ...addressColumns.map(
        (c) => `Standardized ${c.name}: title case + expanded abbreviations`
      )
    );
  }

  return {
    cleaned,
    audit: {
      rule: "standardize_addresses",
      label: "Standardize Addresses",
      description: `Standardized ${affected} address values`,
      rowsAffected: affected,
      details,
    },
  };
}
