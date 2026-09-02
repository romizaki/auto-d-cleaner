import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmails(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const emailColumns = columns.filter(
    (c) => c.type === "email" || c.name.toLowerCase().includes("email")
  );

  if (emailColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "validate_emails",
        label: "Validate Emails",
        description: "No email columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  const cleaned = rows.filter((row) => {
    for (const col of emailColumns) {
      const val = (row[col.name] || "").trim();
      if (val.length > 0 && !EMAIL_REGEX.test(val)) {
        return false;
      }
    }
    return true;
  });

  const removed = rows.length - cleaned.length;

  return {
    cleaned,
    audit: {
      rule: "validate_emails",
      label: "Validate Emails",
      description: `Removed ${removed} rows with invalid emails`,
      rowsAffected: removed,
      details:
        removed > 0
          ? emailColumns.map(
              (c) => `Validated ${c.name}: removed ${removed} invalid entries`
            )
          : [],
    },
  };
}
