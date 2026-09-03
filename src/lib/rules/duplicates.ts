import { CSVRow, AuditEntry } from "@/types";

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

  const threshold = remaining.length > 5000 ? 0.9 : 0.85;

  const MAX_FUZZY_ROWS = 10000;
  const doFuzzy = remaining.length <= MAX_FUZZY_ROWS;

  if (doFuzzy) {
    const rowStrCache = new Array<string>(remaining.length);
    for (let i = 0; i < remaining.length; i++) {
      rowStrCache[i] = JSON.stringify(remaining[i]).toLowerCase();
    }

    for (let i = 0; i < remaining.length; i++) {
      if (fuzzyIndices.has(i)) continue;
      const rowStr = rowStrCache[i];
      for (let j = i + 1; j < remaining.length; j++) {
        if (fuzzyIndices.has(j)) continue;
        const compStr = rowStrCache[j];
        if (similarity(rowStr, compStr, threshold)) {
          fuzzyRemoved.push(remaining[j]);
          fuzzyIndices.add(j);
        }
      }
    }
  }

  const cleaned = remaining.filter((_, i) => !fuzzyIndices.has(i));
  const totalRemoved = exactRemoved.length + fuzzyRemoved.length;

  const detailLines = [`${exactRemoved.length} exact duplicates removed`];
  if (doFuzzy) {
    detailLines.push(
      `${fuzzyRemoved.length} near-duplicates removed (similarity > ${(threshold * 100).toFixed(0)}%)`
    );
  } else {
    detailLines.push(
      `Fuzzy dedup skipped for ${remaining.length} rows (over ${MAX_FUZZY_ROWS.toLocaleString()} rows, exact-only)`
    );
  }

  return {
    cleaned,
    audit: {
      rule: "remove_duplicates",
      label: "Removed Duplicates",
      description: `Removed ${exactRemoved.length} exact and ${fuzzyRemoved.length} fuzzy duplicate rows`,
      rowsAffected: totalRemoved,
      details: detailLines,
    },
  };
}
