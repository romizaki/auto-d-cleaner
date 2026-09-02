import { NextRequest, NextResponse } from "next/server";
import { CSVRow, ColumnSchema } from "@/types";
import { sanitizeBatch } from "@/lib/sanitizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows, columns } = body as {
      rows: CSVRow[];
      columns: ColumnSchema[];
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 503 }
      );
    }

    const sanitized = sanitizeBatch(rows);

    const colInfo = columns
      .map((c) => `- ${c.name} (type: ${c.type})`)
      .join("\n");

    const prompt = `You are a data cleaning assistant. Clean these CSV rows:
1. Standardize phone numbers to E.164 format
2. Standardize dates to ISO 8601 (YYYY-MM-DD)
3. Title case names, lowercase emails
4. Trim whitespace
5. Standardize addresses (title case, expand abbreviations)

Columns:\n${colInfo}

IMPORTANT: Output ONLY valid JSON. No text before or after.

Input:\n${JSON.stringify(sanitized.slice(0, 50))}

Return: { "cleanedRows": [...], "changes": [{ "rowIndex": 0, "field": "name", "old": "old", "new": "new" }] }`;

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
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI service error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const completion = await response.json();
    const content = completion.choices[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        cleanedRows: sanitized,
        changes: [],
        aiUsed: false,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      cleanedRows: parsed.cleanedRows || sanitized,
      changes: parsed.changes || [],
      aiUsed: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
