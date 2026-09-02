"use client";

import { HealthScore as HealthScoreType } from "@/types";

interface DataHealthScoreProps {
  healthScore: HealthScoreType;
}

export function DataHealthScore({ healthScore }: DataHealthScoreProps) {
  const { score, issues } = healthScore;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  let color = "text-emerald-400";
  let strokeColor = "#10b981";
  let bgColor = "bg-emerald-500/10";
  if (score < 50) {
    color = "text-red-400";
    strokeColor = "#ef4444";
    bgColor = "bg-red-500/10";
  } else if (score < 80) {
    color = "text-amber-400";
    strokeColor = "#fbbf24";
    bgColor = "bg-amber-500/10";
  }

  return (
    <div className={`rounded-xl ${bgColor} p-6 animate-fade-in`}>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#334155"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${color}`}>{score}</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100">
            Data Health Score
          </h3>
          <div className="mt-2 space-y-1 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Empty cells</span>
              <span className="text-slate-300 font-mono">{issues.emptyCells}</span>
            </div>
            <div className="flex justify-between">
              <span>Duplicate rows</span>
              <span className="text-slate-300 font-mono">{issues.duplicates}</span>
            </div>
            <div className="flex justify-between">
              <span>Invalid formats</span>
              <span className="text-slate-300 font-mono">{issues.invalidFormats}</span>
            </div>
            <div className="flex justify-between">
              <span>Total cells</span>
              <span className="text-slate-300 font-mono">{issues.totalCells}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
