import Papa from "papaparse";
import { CSVRow, ColumnSchema, ColumnType } from "@/types";

function detectColumnType(values: string[]): ColumnType {
  if (values.length === 0) return "string";

  const nonEmpty = values.filter((v) => v.trim().length > 0);
  if (nonEmpty.length === 0) return "string";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailCount = nonEmpty.filter((v) => emailRegex.test(v.trim())).length;
  if (emailCount / nonEmpty.length > 0.8) return "email";

  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
  const phoneCount = nonEmpty.filter((v) => phoneRegex.test(v.trim())).length;
  if (phoneCount / nonEmpty.length > 0.8) return "phone";

  const dateRegex =
    /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
  const dateCount = nonEmpty.filter((v) => dateRegex.test(v.trim())).length;
  if (dateCount / nonEmpty.length > 0.8) return "date";

  const numCount = nonEmpty.filter((v) => !isNaN(Number(v.trim()))).length;
  if (numCount / nonEmpty.length > 0.8) return "number";

  return "string";
}

export interface ParseResult {
  data: CSVRow[];
  columns: ColumnSchema[];
  headers: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const data = results.data as CSVRow[];

        const columns: ColumnSchema[] = headers.map((header) => {
          const values = data.map((row) => row[header] || "");
          const nullCount = values.filter((v) => v.trim().length === 0).length;
          const type = detectColumnType(values);
          const sampleValues = values
            .filter((v) => v.trim().length > 0)
            .slice(0, 3);

          return {
            name: header,
            type,
            nullCount,
            totalCount: values.length,
            sampleValues,
          };
        });

        resolve({ data, columns, headers });
      },
      error(error) {
        reject(error);
      },
    });
  });
}

export function parseCSVFromString(csvText: string): ParseResult {
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = results.meta.fields || [];
  const data = results.data as CSVRow[];

  const columns: ColumnSchema[] = headers.map((header) => {
    const values = data.map((row) => row[header] || "");
    const nullCount = values.filter((v) => v.trim().length === 0).length;
    const type = detectColumnType(values);
    const sampleValues = values.filter((v) => v.trim().length > 0).slice(0, 3);

    return {
      name: header,
      type,
      nullCount,
      totalCount: values.length,
      sampleValues,
    };
  });

  return { data, columns, headers };
}
