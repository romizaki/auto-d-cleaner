"use client";

import { useState } from "react";
import { CSVRow } from "@/types";
import { DataTable } from "./DataTable";

interface BeforeAfterSplitProps {
  rawData: CSVRow[];
  cleanedData: CSVRow[];
}

export function BeforeAfterSplit({ rawData, cleanedData }: BeforeAfterSplitProps) {
  const [splitPosition, setSplitPosition] = useState(50);

  const handleMouseDown = () => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(20, Math.min(80, x)));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="animate-fade-in">
      <div id="split-container" className="relative flex gap-0 rounded-xl overflow-hidden border border-slate-700/50">
        <div className="overflow-hidden" style={{ width: `${splitPosition}%` }}>
          <DataTable data={rawData} title="Before (Raw)" maxHeight="350px" />
        </div>

        <div
          className="relative w-1 bg-slate-600 cursor-col-resize hover:bg-emerald-500 transition-colors flex-shrink-0 z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-500 hover:border-emerald-500 transition-colors">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        <div className="overflow-hidden" style={{ width: `${100 - splitPosition}%` }}>
          <DataTable data={cleanedData} title="After (Cleaned)" maxHeight="350px" />
        </div>
      </div>
    </div>
  );
}
