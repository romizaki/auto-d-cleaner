"use client";

import { useEffect, useState } from "react";
import { CleanProgress } from "@/types";

interface CleaningProgressProps {
  progress: CleanProgress | null;
  totalRows: number;
}

export function CleaningProgress({
  progress,
  totalRows,
}: CleaningProgressProps) {
const [dummyProgress, setDummyProgress] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setDummyProgress((current) => {
    if (current >= 20) {
      return 20;
    }

    return current + 1;
  });
}, 3000);

return () => clearInterval(interval);

}, []);

const label = progress?.label ?? "Processing your data...";
const rowsProcessed = progress?.rowsProcessed ?? 0;

const realPercent =
  totalRows > 0
    ? Math.round((rowsProcessed / totalRows) * 100)
    : 0;

// Always show at least the dummy progress.
// Once the real process moves beyond 20%, use the real progress.
const percent = Math.max(dummyProgress, realPercent);

return (
<div className="w-full max-w-xl mx-auto space-y-5 animate-fade-in">
<div className="flex flex-col items-center gap-3 text-slate-300">
<svg className="w-6 h-6 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24" >
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

      {totalRows > 0 && (
        <p className="text-xs text-slate-500 mt-1 font-mono">
          {rowsProcessed.toLocaleString()} /{" "}
          {totalRows.toLocaleString()} rows
        </p>
      )}
    </div>
  </div>

  <div className="space-y-2">
    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>

    <div className="flex justify-between text-xs text-slate-500 font-mono">
      <span>{percent}%</span>
      <span>
        Cleaning... Please don&apos;t close this page
      </span>
    </div>
  </div>
</div>
);
}
