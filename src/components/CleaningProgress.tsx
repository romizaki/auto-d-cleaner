"use client";

import { CleanProgress } from "@/types";

interface CleaningProgressProps {
  progress: CleanProgress | null;
  totalRows: number;
}

export function CleaningProgress({
  progress,
  totalRows,
}: CleaningProgressProps) {
  const label = progress?.label ?? "Processing your data...";
  const rowsProcessed = progress?.rowsProcessed ?? 0;

  const knownTotal = progress !== null && totalRows > 0 && progress.totalRows > 0;
  const realPercent = knownTotal
    ? Math.round((progress.rowsProcessed / progress.totalRows) * 100)
    : null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col items-center gap-3 text-slate-300">
        <svg className="w-6 h-6 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-200">
            {label}
          </p>

          <p className="text-xs text-slate-500 mt-1 font-mono">
            {realPercent !== null &&
              `${rowsProcessed.toLocaleString()} / ${progress!.totalRows.toLocaleString()} rows`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          {realPercent !== null ? (
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, realPercent)}%` }}
            />
          ) : (
            <div className="h-full rounded-full overflow-hidden">
              <div className="animate-indeterminate h-full w-1/3 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-slate-500 font-mono">
          <span>
            {realPercent !== null ? `${Math.min(100, realPercent)}%` : "Analyzing..."}
          </span>
          <span>
            Cleaning... Please don&apos;t close this page
          </span>
        </div>
      </div>
    </div>
  );
}