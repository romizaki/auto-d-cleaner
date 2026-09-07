import { CSVRow, AuditEntry, ColumnSchema } from "@/types";

function formatToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  return phone;
}

export function standardizePhones(
  rows: CSVRow[],
  columns: ColumnSchema[]
): { cleaned: CSVRow[]; audit: AuditEntry } {
  const phoneColumns = columns.filter(
    (c) => c.type === "phone" || c.name.toLowerCase().includes("phone")
  );

  if (phoneColumns.length === 0) {
    return {
      cleaned: rows,
      audit: {
        rule: "standardize_phones",
        label: "Standardize Phone Numbers",
        description: "No phone columns detected",
        rowsAffected: 0,
        details: [],
      },
    };
  }

  let affected = 0;
  const details: string[] = [];

  const cleaned = rows.map((row) => {
    const newRow = { ...row };
    for (const col of phoneColumns) {
      const val = (newRow[col.name] || "").trim();
      if (val.length > 0) {
        const formatted = formatToE164(val);
        if (formatted !== val) {
          newRow[col.name] = formatted;
          affected++;
        }
      }
    }
    return newRow;
  });

  if (affected > 0) {
    details.push(
      ...phoneColumns.map(
        (c) => `Standardized ${c.name} to E.164 format`
      )
    );
  }

  return {
    cleaned,
    audit: {
      rule: "standardize_phones",
      label: "Standardize Phone Numbers",
      description: `Standardized ${affected} phone numbers to E.164 format`,
      rowsAffected: affected,
      details,
    },
  };
}
