"use client";

import { CSVRow } from "@/types";

interface DataTableProps {
  data: CSVRow[];
  title: string;
  maxHeight?: string;
}

export function DataTable({ data, title, maxHeight = "400px" }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No data to display
      </div>
    );
  }

  const headers = Object.keys(data[0]);
  const displayRows = data.slice(0, 100);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <span className="text-xs text-slate-500 font-mono">
          {data.length} rows
        </span>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-slate-800">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider border-b border-slate-700/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                  i % 2 === 0 ? "bg-slate-800/30" : "bg-transparent"
                }`}
              >
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 text-slate-300 max-w-[200px] truncate">
                    {row[h] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
