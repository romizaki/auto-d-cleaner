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

  let invalidCount = 0;

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of emailColumns) {
      const val = (row[col.name] || "").trim();
      if (val.length > 0 && !EMAIL_REGEX.test(val)) {
        newRow[col.name] = "";
        invalidCount++;
      }
    }
    return newRow;
  });

  return {
    cleaned,
    audit: {
      rule: "validate_emails",
      label: "Validate Emails",
      description: `Cleared ${invalidCount} invalid email values`,
      rowsAffected: invalidCount,
      details:
        invalidCount > 0
          ? emailColumns.map(
              (c) => `Validated ${c.name}: cleared ${invalidCount} invalid entries`
            )
          : [],
    },
  };
}
