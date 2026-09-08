import { CSVRow } from "@/types";

function bandedLevenshtein(a: string, b: string, maxDist: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Uint32Array(n + 1);
  let curr = new Uint32Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr.fill(maxDist + 1);
    curr[0] = i;
    const rowMin = Math.max(1, i - maxDist);
    const rowMax = Math.min(n, i + maxDist);
    let rowLow = maxDist + 1;

    for (let j = rowMin; j <= rowMax; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = maxDist + 1;
      const up = prev[j] + 1;
      const left = j > 0 ? curr[j - 1] + 1 : maxDist + 1;
      const diag = prev[j - 1] + cost;
      if (up < best) best = up;
      if (left < best) best = left;
      if (diag < best) best = diag;
      curr[j] = best;
      if (best < rowLow) rowLow = best;
    }

    if (rowLow > maxDist) return maxDist + 1;

    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

function similarity(a: string, b: string, threshold: number): boolean {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  if (Math.abs(a.length - b.length) > maxLen * (1 - threshold)) return false;
  const maxDist = Math.floor(maxLen * (1 - threshold));
  const dist = bandedLevenshtein(a, b, maxDist);
  return dist <= maxDist;
}

export function exactDedupeRows(rows: CSVRow[]): {
  cleaned: CSVRow[];
  removedCount: number;
} {
  const seen = new Set<string>();
  const cleaned: CSVRow[] = [];
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(row);
    }
  }
  return { cleaned, removedCount: rows.length - cleaned.length };
}

export function runFuzzyDedup(rows: CSVRow[]): {
  cleaned: CSVRow[];
  removedCount: number;
} {
  const threshold = rows.length > 5000 ? 0.9 : 0.85;
  const fuzzyIndices = new Set<number>();
  const removed: CSVRow[] = [];

  const rowStrCache = new Array<string>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    rowStrCache[i] = JSON.stringify(rows[i]).toLowerCase();
  }

  for (let i = 0; i < rows.length; i++) {
    if (fuzzyIndices.has(i)) continue;
    const rowStr = rowStrCache[i];
    for (let j = i + 1; j < rows.length; j++) {
      if (fuzzyIndices.has(j)) continue;
      const compStr = rowStrCache[j];
      if (similarity(rowStr, compStr, threshold)) {
        removed.push(rows[j]);
        fuzzyIndices.add(j);
      }
    }
  }

  const cleaned = rows.filter((_, i) => !fuzzyIndices.has(i));
  return { cleaned, removedCount: removed.length };
}
