"use client";

export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-700/50">
              <div className="h-4 w-24 animate-shimmer rounded" />
            </div>
            <div className="p-4 space-y-2">
              <div className="h-8 w-full animate-shimmer rounded" />
              <div className="h-8 w-3/4 animate-shimmer rounded" />
              <div className="h-8 w-5/6 animate-shimmer rounded" />
              <div className="h-8 w-2/3 animate-shimmer rounded" />
              <div className="h-8 w-4/5 animate-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center py-4">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm">Processing your data...</span>
        </div>
      </div>
    </div>
  );
}
