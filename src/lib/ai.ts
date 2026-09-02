import { CSVRow, AuditEntry, ColumnSchema } from "@/types";
import { sanitizeBatch } from "./sanitizer";

interface AIResponse {
  cleanedRows: CSVRow[];
  auditEntries: AuditEntry[];
}

const BATCH_SIZE = 50;

function buildPrompt(
  rows: CSVRow[],
  columns: ColumnSchema[]
): string {
  const colInfo = columns
    .map((c) => `- ${c.name} (detected type: ${c.type})`)
    .join("\n");

  return `You are a data cleaning assistant. Clean the following CSV rows according to these rules:
1. Standardize phone numbers to E.164 format (+CountryCodeNumber)
2. Standardize all dates to ISO 8601 format (YYYY-MM-DD)
3. Fix capitalization: title case for names, lowercase for emails
4. Trim all leading/trailing whitespace
5. Standardize addresses: title case, common abbreviations (St, Ave, Blvd, Dr)
6. Remove rows that are completely empty

Columns:
${colInfo}

IMPORTANT: Output ONLY valid JSON. Do not include any text before or after the JSON.

Input rows (JSON array):
${JSON.stringify(rows)}

Return a JSON object with:
{
  "cleanedRows": [ ...same rows but cleaned... ],
  "changes": [
    { "rowIndex": 0, "field": "column_name", "old": "old_value", "new": "new_value" }
  ]
}`;
}

export async function cleanWithAI(
  rows: CSVRow[],
  columns: ColumnSchema[]
): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const allCleanedRows: CSVRow[] = [];
  const allAuditEntries: AuditEntry[] = [];
  const changeMap = new Map<string, number>();

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const sanitized = sanitizeBatch(batch);
    const prompt = buildPrompt(sanitized, columns);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const completion = await response.json();
    const content = completion.choices[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      allCleanedRows.push(...batch);
      continue;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const cleanedBatch: CSVRow[] = parsed.cleanedRows || batch;
      allCleanedRows.push(
        ...cleanedBatch.map((row: CSVRow, idx: number) => ({
          ...batch[idx],
          ...row,
        }))
      );

      const changes: Array<{ rowIndex: number; field: string; old: string; new: string }> =
        parsed.changes || [];
      for (const change of changes) {
        const key = change.field;
        changeMap.set(key, (changeMap.get(key) || 0) + 1);
      }
    } catch {
      allCleanedRows.push(...batch);
    }
  }

  for (const [field, count] of changeMap) {
    allAuditEntries.push({
      rule: "standardize_phones",
      label: `AI Standardized ${field}`,
      description: `AI cleaned ${count} values in column "${field}"`,
      rowsAffected: count,
      details: [`Standardized via Groq AI`],
    });
  }

  return { cleanedRows: allCleanedRows, auditEntries: allAuditEntries };
}
