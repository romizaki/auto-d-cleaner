"use client";

import { useCleaner } from "@/context/CleanerContext";
import { parseCSV, parseCSVFromString } from "@/lib/parser";
import { calculateHealthScore } from "@/lib/health-score";
import { runCleaningPipeline } from "@/lib/rules/engine";

export function useDataCleaner() {
  const { state, dispatch } = useCleaner();

  async function handleFileUpload(file: File) {
    try {
      dispatch({ type: "SET_STAGE", payload: "uploaded" });
      dispatch({ type: "SET_FILE_NAME", payload: file.name });
      dispatch({ type: "SET_ERROR", payload: "" });

      dispatch({ type: "SET_STAGE", payload: "analyzing" });
      const { data, columns } = await parseCSV(file);

      dispatch({ type: "SET_RAW_DATA", payload: data });
      dispatch({ type: "SET_COLUMNS", payload: columns });

      const healthScore = calculateHealthScore(data, columns);
      dispatch({ type: "SET_HEALTH_SCORE", payload: healthScore });
      dispatch({ type: "SET_STAGE", payload: "ready" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Failed to parse CSV: ${err}` });
    }
  }

  async function handleSampleData() {
    try {
      dispatch({ type: "SET_STAGE", payload: "uploaded" });
      dispatch({ type: "SET_FILE_NAME", payload: "sample-data.csv" });
      dispatch({ type: "SET_ERROR", payload: "" });

      dispatch({ type: "SET_STAGE", payload: "analyzing" });
      const response = await fetch("/sample-data.csv");
      const text = await response.text();
      const { data, columns } = parseCSVFromString(text);

      dispatch({ type: "SET_RAW_DATA", payload: data });
      dispatch({ type: "SET_COLUMNS", payload: columns });

      const healthScore = calculateHealthScore(data, columns);
      dispatch({ type: "SET_HEALTH_SCORE", payload: healthScore });
      dispatch({ type: "SET_STAGE", payload: "ready" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Failed to load sample data: ${err}` });
    }
  }

  async function cleanData() {
    try {
      dispatch({ type: "SET_STAGE", payload: "cleaning" });

      const { cleanedData, auditLog } = await runCleaningPipeline(
        state.rawData,
        state.columns
      );

      dispatch({ type: "SET_CLEANED_DATA", payload: cleanedData });
      dispatch({ type: "SET_AUDIT_LOG", payload: auditLog });
      dispatch({ type: "SET_STAGE", payload: "done" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Cleaning failed: ${err}` });
    }
  }

  function reset() {
    dispatch({ type: "RESET" });
  }

  function exportCSV(data: Record<string, string>[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h] || "";
            return val.includes(",") || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportAuditReport() {
    if (state.auditLog.length === 0) return;
    const report = [
      "=== Data Cleaning Audit Report ===",
      `File: ${state.fileName}`,
      `Date: ${new Date().toISOString()}`,
      "",
      "=== Transformations ===",
      ...state.auditLog.map(
        (entry) =>
          `\n[${entry.label}]\n  ${entry.description}\n  Rows affected: ${entry.rowsAffected}\n  Details: ${entry.details.join("; ")}`
      ),
      "",
      `=== Summary ===`,
      `Starting rows: ${state.rawData.length}`,
      `Final rows: ${state.cleanedData.length}`,
      `Rows removed: ${state.rawData.length - state.cleanedData.length}`,
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${state.fileName.replace(".csv", "")}-audit-report.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return {
    state,
    handleFileUpload,
    handleSampleData,
    cleanData,
    reset,
    exportCSV,
    exportAuditReport,
  };
}
