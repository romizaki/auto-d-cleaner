const MAX_FIELD_LENGTH = 500;
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now/i,
  /system\s*:\s*/i,
  /act\s+as/i,
  /pretend\s+you/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
];

export function sanitizeField(value: string): string {
  let cleaned = value.slice(0, MAX_FIELD_LENGTH);
  cleaned = cleaned.replace(/[<>]/g, "");
  for (const pattern of SUSPICIOUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[REDACTED]");
  }
  return cleaned;
}

export function sanitizeRow(row: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeField(value || "");
  }
  return sanitized;
}

export function sanitizeBatch(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.map(sanitizeRow);
}
