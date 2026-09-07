import { CSVRow, AuditEntry } from "@/types";

export function trimWhitespace(rows: CSVRow[]): {
  cleaned: CSVRow[];
  audit: AuditEntry;
} {
  let affected = 0;

  const cleaned = rows.map((row) => {
    const newRow: CSVRow = {};
    for (const [key, value] of Object.entries(row)) {
      const trimmed = (value || "").trim();
      if (trimmed !== (value || "")) {
        affected++;
      }
      newRow[key] = trimmed;
    }
    return newRow;
  });

  return {
    cleaned,
    audit: {
      rule: "trim_whitespace",
      label: "Trim Whitespace",
      description: `Trimmed whitespace from ${affected} cells`,
      rowsAffected: affected,
      details: affected > 0 ? [`Removed leading/trailing whitespace from ${affected} cells`] : [],
    },
  };
}
