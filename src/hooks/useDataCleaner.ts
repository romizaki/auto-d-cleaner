"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCleaner } from "@/context/CleanerContext";
import { WorkerRequest, WorkerResponse } from "@/lib/worker/messages";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useDataCleaner() {
  const { state, dispatch } = useCleaner();
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(
      new URL("@/lib/worker/cleaner.worker", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "PARSE_RESULT") {
        dispatch({ type: "SET_ROW_COUNT", payload: msg.rowCount });
        dispatch({ type: "SET_COLUMNS", payload: msg.columns });
        dispatch({ type: "SET_HEALTH_SCORE", payload: msg.healthScore });
        dispatch({ type: "SET_WARNINGS", payload: msg.warnings });
        dispatch({ type: "SET_PREVIEW", payload: msg.preview });
        dispatch({ type: "SET_STAGE", payload: "ready" });
      } else if (msg.type === "CLEAN_PROGRESS") {
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            rule: msg.rule,
            label: msg.label,
            rowsProcessed: msg.rowsProcessed,
            totalRows: msg.totalRows,
          },
        });
      } else if (msg.type === "CLEAN_RESULT") {
        dispatch({ type: "SET_CLEANED_ROW_COUNT", payload: msg.cleanedRowCount });
        dispatch({ type: "SET_AUDIT_LOG", payload: msg.auditLog });
        dispatch({ type: "SET_CLEANED_PREVIEW", payload: msg.cleanedPreview });
        dispatch({ type: "SET_PROGRESS", payload: null });
        dispatch({ type: "SET_STAGE", payload: "done" });
      } else if (msg.type === "EXPORT_CSV_RESULT") {
        triggerDownload(msg.blob, msg.fileName);
      } else if (msg.type === "WORKER_ERROR") {
        dispatch({ type: "SET_ERROR", payload: msg.message });
      }
    };

    worker.onerror = (e) => {
      dispatch({
        type: "SET_ERROR",
        payload: e.message || "Worker error occurred",
      });
    };

    workerRef.current = worker;
    return worker;
  }, [dispatch]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  async function handleFileUpload(file: File) {
    try {
      dispatch({ type: "SET_STAGE", payload: "uploaded" });
      dispatch({ type: "SET_FILE_NAME", payload: file.name });
      dispatch({ type: "SET_FILE_SIZE", payload: file.size });
      dispatch({ type: "SET_ERROR", payload: "" });
      dispatch({ type: "SET_WARNINGS", payload: [] });

      dispatch({ type: "SET_STAGE", payload: "analyzing" });
      getWorker().postMessage({ type: "PARSE", file } satisfies WorkerRequest);
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Failed to read CSV: ${err}` });
    }
  }

  async function handleSampleData() {
    try {
      dispatch({ type: "SET_STAGE", payload: "uploaded" });
      dispatch({ type: "SET_FILE_NAME", payload: "sample-data.csv" });
      dispatch({ type: "SET_ERROR", payload: "" });
      dispatch({ type: "SET_WARNINGS", payload: [] });

      dispatch({ type: "SET_STAGE", payload: "analyzing" });
      const response = await fetch("/sample-data.csv");
      const blob = await response.blob();
      const file = new File([blob], "sample-data.csv", { type: "text/csv" });
      dispatch({ type: "SET_FILE_SIZE", payload: file.size });
      getWorker().postMessage({ type: "PARSE", file } satisfies WorkerRequest);
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Failed to load sample data: ${err}` });
    }
  }

  function cleanData() {
    if (state.rowCount === 0) return;
    dispatch({ type: "SET_STAGE", payload: "cleaning" });
    dispatch({ type: "SET_PROGRESS", payload: null });

    getWorker().postMessage({ type: "CLEAN" } satisfies WorkerRequest);
  }

  function reset() {
    workerRef.current?.terminate();
    workerRef.current = null;
    dispatch({ type: "RESET" });
  }

  function exportCSV() {
    getWorker().postMessage({ type: "EXPORT_CSV" } satisfies WorkerRequest);
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
      `Starting rows: ${state.rowCount}`,
      `Final rows: ${state.cleanedRowCount}`,
      `Rows removed: ${state.rowCount - state.cleanedRowCount}`,
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain;charset=utf-8;" });
    triggerDownload(blob, `${state.fileName.replace(".csv", "")}-audit-report.txt`);
  }

  return {
    state,
    handleFileUpload,
    handleSampleData,
    cleanData,
    reset,
    exportCSV,
    exportAuditReport,
    formatBytes,
  };
}
