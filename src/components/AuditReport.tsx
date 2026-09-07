"use client";

import { AuditEntry } from "@/types";

interface AuditReportProps {
  auditLog: AuditEntry[];
}

export function AuditReport({ auditLog }: AuditReportProps) {
  const totalRowsAffected = auditLog.reduce((sum, e) => sum + e.rowsAffected, 0);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Audit Report</h3>
        <span className="text-xs text-emerald-400 font-mono">
          {totalRowsAffected} total changes
        </span>
      </div>
      <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-auto">
        {auditLog.map((entry, i) => (
          <div key={i} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {entry.rowsAffected > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-200">
                  {entry.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {entry.rowsAffected} rows
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-4">
              {entry.description}
            </p>
            {entry.details.length > 0 && (
              <div className="mt-2 ml-4 space-y-1">
                {entry.details.map((detail, j) => (
                  <p key={j} className="text-xs text-slate-600 font-mono">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
