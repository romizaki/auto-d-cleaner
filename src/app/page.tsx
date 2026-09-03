"use client";

import { CleanerProvider } from "@/context/CleanerContext";
import { useDataCleaner } from "@/hooks/useDataCleaner";
import { DropZone } from "@/components/DropZone";
import { DataHealthScore } from "@/components/DataHealthScore";
import { DataTable } from "@/components/DataTable";
import { BeforeAfterSplit } from "@/components/BeforeAfterSplit";
import { AuditReport } from "@/components/AuditReport";
import { CleaningProgress } from "@/components/CleaningProgress";
import { CheckmarkAnimation } from "@/components/CheckmarkAnimation";
import { ExportButton } from "@/components/ExportButton";
import { SampleDataButton } from "@/components/SampleDataButton";
import { TrustBadge } from "@/components/TrustBadge";

function CleanerApp() {
  const {
    state,
    handleFileUpload,
    handleSampleData,
    cleanData,
    reset,
    exportCSV,
    exportAuditReport,
  } = useDataCleaner();

  const isProcessing = state.stage === "analyzing" || state.stage === "cleaning";

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                Automated Data Cleaner
              </h1>
              <p className="text-xs text-slate-500">
                Transform messy CSVs into clean, structured data
              </p>
            </div>
          </div>
          <TrustBadge />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-xl px-6">
              <CleaningProgress progress={state.progress} totalRows={state.rawData.length} />
            </div>
          </div>
        )}

        {state.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
            {state.error}
            <button
              onClick={reset}
              className="ml-3 text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {state.stage === "idle" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-100">
                Clean your data in seconds
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                Upload a CSV file, let our cleaning engine detect issues and
                normalize your data automatically. Everything runs locally in
                your browser. No data is ever stored on our servers.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <DropZone onFile={handleFileUpload} disabled={isProcessing} />
              <div className="flex justify-center">
                <SampleDataButton onClick={handleSampleData} disabled={isProcessing} />
              </div>
            </div>
          </div>
        )}

        {state.stage === "analyzing" && (
          <div className="space-y-6" />
        )}

        {state.stage === "ready" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Data Ready for Cleaning
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="font-mono text-emerald-400">{state.fileName}</span>
                  {" "}&middot;{" "}
                  {state.rawData.length} rows &middot;{" "}
                  {state.columns.length} columns
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Over
                </button>
                <button
                  onClick={cleanData}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Clean Data
                </button>
              </div>
            </div>

            {state.healthScore && (
              <DataHealthScore healthScore={state.healthScore} />
            )}

            <div className="grid grid-cols-1 gap-4">
              <DataTable data={state.rawData} title="Preview (Raw Data)" maxHeight="300px" />
            </div>

            <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Detected Columns
              </h3>
              <div className="flex flex-wrap gap-2">
                {state.columns.map((col) => (
                  <span
                    key={col.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-700/50 text-slate-300 border border-slate-600/30"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      col.type === "email" ? "bg-emerald-400"
                        : col.type === "phone" ? "bg-blue-400"
                        : col.type === "date" ? "bg-purple-400"
                        : col.type === "number" ? "bg-amber-400"
                        : "bg-slate-400"
                    }`} />
                    {col.name}
                    <span className="text-slate-500">{col.type}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.stage === "cleaning" && (
          <div className="space-y-6">
            <CleaningProgress progress={state.progress} totalRows={state.rawData.length} />
          </div>
        )}

        {state.stage === "done" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckmarkAnimation />
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Data Cleaned Successfully
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {state.rawData.length} rows → {state.cleanedData.length} rows
                    {" "}&middot;{" "}
                    {state.rawData.length - state.cleanedData.length} rows removed
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clean Another File
              </button>
            </div>

            <BeforeAfterSplit
              rawData={state.rawData}
              cleanedData={state.cleanedData}
            />

            <AuditReport auditLog={state.auditLog} />

            <ExportButton
              onExportCSV={() =>
                exportCSV(state.cleanedData, `cleaned-${state.fileName}`)
              }
              onExportAudit={exportAuditReport}
              disabled={isProcessing}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <span>Automated Data Cleaner</span>
          <span>All processing happens in your browser. No data is uploaded or stored.</span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <CleanerProvider>
      <CleanerApp />
    </CleanerProvider>
  );
}
