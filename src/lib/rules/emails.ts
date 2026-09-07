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

  let totalInvalid = 0;
  const columnInvalidCounts = new Map<string, number>();

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of emailColumns) {
      const val = (row[col.name] || "").trim();
      if (val.length > 0 && !EMAIL_REGEX.test(val)) {
        newRow[col.name] = "";
        totalInvalid++;
        columnInvalidCounts.set(col.name, (columnInvalidCounts.get(col.name) || 0) + 1);
      }
    }
    return newRow;
  });

  return {
    cleaned,
    audit: {
      rule: "validate_emails",
      label: "Validate Emails",
      description: `Cleared ${totalInvalid} invalid email values`,
      rowsAffected: totalInvalid,
      details:
        totalInvalid > 0
          ? emailColumns
              .filter((c) => (columnInvalidCounts.get(c.name) || 0) > 0)
              .map(
                (c) => `Validated ${c.name}: cleared ${columnInvalidCounts.get(c.name)} invalid entries`
              )
          : [],
    },
  };
}
