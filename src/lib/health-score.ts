import { CSVRow, ColumnSchema, HealthScore } from "@/types";

export function calculateHealthScore(
  data: CSVRow[],
  columns: ColumnSchema[]
): HealthScore {
  if (data.length === 0) {
    return { score: 100, issues: { emptyCells: 0, duplicates: 0, invalidFormats: 0, totalCells: 0 } };
  }

  const totalCells = data.length * columns.length;
  let emptyCells = 0;
  let invalidFormats = 0;

  for (const row of data) {
    for (const col of columns) {
      const val = (row[col.name] || "").trim();
      if (val.length === 0) {
        emptyCells++;
      }
    }
  }

  for (const col of columns) {
    if (col.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const row of data) {
        const val = (row[col.name] || "").trim();
        if (val.length > 0 && !emailRegex.test(val)) {
          invalidFormats++;
        }
      }
    } else if (col.type === "date") {
      const dateRegex =
        /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
      for (const row of data) {
        const val = (row[col.name] || "").trim();
        if (val.length > 0 && !dateRegex.test(val)) {
          invalidFormats++;
        }
      }
    } else if (col.type === "phone") {
      const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
      for (const row of data) {
        const val = (row[col.name] || "").trim();
        if (val.length > 0 && !phoneRegex.test(val)) {
          invalidFormats++;
        }
      }
    }
  }

  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of data) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }

  const emptyRatio = totalCells > 0 ? emptyCells / totalCells : 0;
  const dupRatio = data.length > 0 ? duplicates / data.length : 0;
  const invalidRatio = totalCells > 0 ? invalidFormats / totalCells : 0;

  const penalty = emptyRatio * 30 + dupRatio * 40 + invalidRatio * 30;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty * 100)));

  return {
    score,
    issues: { emptyCells, duplicates, invalidFormats, totalCells },
  };
}
