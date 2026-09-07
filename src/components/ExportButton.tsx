"use client";

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportAudit: () => void;
  disabled?: boolean;
}

export function ExportButton({ onExportCSV, onExportAudit, disabled }: ExportButtonProps) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <button
        onClick={onExportCSV}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Cleaned CSV
      </button>
      <button
        onClick={onExportAudit}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 text-slate-200 font-medium text-sm hover:bg-slate-600 transition-colors border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Audit Report
      </button>
    </div>
  );
}
