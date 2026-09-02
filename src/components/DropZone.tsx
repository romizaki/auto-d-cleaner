"use client";

import { useCallback, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

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
        const file = files[0];
        if (file.name.endsWith(".csv")) {
          onFile(file);
        }
      }
    },
    [onFile, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        onFile(files[0]);
      }
    },
    [onFile]
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
          Supports CSV files up to 50MB
        </p>
      </div>
    </div>
  );
}
