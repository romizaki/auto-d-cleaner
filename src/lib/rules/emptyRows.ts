import { CSVRow, AuditEntry } from "@/types";

export function removeEmptyRows(rows: CSVRow[]): {
  cleaned: CSVRow[];
  audit: AuditEntry;
} {
  const cleaned = rows.filter((row) => {
    const values = Object.values(row);
    return values.some((v) => v.trim().length > 0);
  });

  const removed = rows.length - cleaned.length;

  return {
    cleaned,
    audit: {
      rule: "remove_empty_rows",
      label: "Remove Empty Rows",
      description: `Removed ${removed} empty rows`,
      rowsAffected: removed,
      details: removed > 0 ? [`${removed} completely empty rows removed`] : [],
    },
  };
}
