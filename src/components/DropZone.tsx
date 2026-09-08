"use client";

import { useCallback, useState } from "react";

const WARN_LARGE_MB = 100;

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAccept = useCallback((file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    if (file.size > WARN_LARGE_MB * 1024 * 1024) {
      setError(
        `Large file (${(file.size / (1024 * 1024)).toFixed(1)} MB). Processing may take a while and use significant memory.`
      );
    }
    onFile(file);
  }, [onFile]);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
      } else if (e.type === "dragleave") {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const files = e.dataTransfer.files;
      if (files?.[0]) {
        validateAndAccept(files[0]);
      }
    },
    [validateAndAccept, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        validateAndAccept(files[0]);
      }
    },
    [validateAndAccept]
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl border-2 border-dashed p-12 text-center
        transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
            : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl animate-pulse-glow pointer-events-none" />
      )}

      <div className="flex flex-col items-center gap-4">
        <div
          className={`
          w-16 h-16 rounded-2xl flex items-center justify-center
          ${isDragging ? "bg-emerald-500/20" : "bg-slate-700/50"}
          transition-colors duration-300
        `}
        >
          <svg
            className={`w-8 h-8 transition-colors duration-300 ${
              isDragging ? "text-emerald-400" : "text-slate-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-slate-200">
            {isDragging ? "Drop your CSV here" : "Drag & drop your CSV file"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            or{" "}
            <label className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline underline-offset-2">
              browse files
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                disabled={disabled}
              />
            </label>
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Supports CSV files of any size (streaming, in-memory processing)
        </p>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
