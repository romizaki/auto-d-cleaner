"use client";

interface SampleDataButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SampleDataButton({ onClick, disabled }: SampleDataButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 font-medium text-sm hover:bg-slate-700 hover:text-slate-200 transition-all border border-slate-600/50 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      Try with Sample Data
    </button>
  );
}
