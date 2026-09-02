import { CSVRow, AuditEntry } from "@/types";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

export function removeDuplicates(rows: CSVRow[]): {
  cleaned: CSVRow[];
  audit: AuditEntry;
} {
  const seen = new Map<string, number>();
  const exactRemoved: CSVRow[] = [];
  const exactIndices = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const key = JSON.stringify(rows[i]);
    if (seen.has(key)) {
      exactRemoved.push(rows[i]);
      exactIndices.add(i);
    } else {
      seen.set(key, i);
    }
  }

  const remaining = rows.filter((_, i) => !exactIndices.has(i));
  const fuzzyRemoved: CSVRow[] = [];
  const fuzzyIndices = new Set<number>();

  for (let i = 0; i < remaining.length; i++) {
    if (fuzzyIndices.has(i)) continue;
    const rowStr = JSON.stringify(remaining[i]).toLowerCase();
    for (let j = i + 1; j < remaining.length; j++) {
      if (fuzzyIndices.has(j)) continue;
      const compStr = JSON.stringify(remaining[j]).toLowerCase();
      if (similarity(rowStr, compStr) > 0.85) {
        fuzzyRemoved.push(remaining[j]);
        fuzzyIndices.add(j);
      }
    }
  }

  const cleaned = remaining.filter((_, i) => !fuzzyIndices.has(i));
  const totalRemoved = exactRemoved.length + fuzzyRemoved.length;

  return {
    cleaned,
    audit: {
      rule: "remove_duplicates",
      label: "Removed Duplicates",
      description: `Removed ${exactRemoved.length} exact and ${fuzzyRemoved.length} fuzzy duplicate rows`,
      rowsAffected: totalRemoved,
      details: [
        `${exactRemoved.length} exact duplicates removed`,
        `${fuzzyRemoved.length} near-duplicates removed (similarity > 85%)`,
      ],
    },
  };
}
