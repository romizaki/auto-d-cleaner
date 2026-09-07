"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCleaner } from "@/context/CleanerContext";
import { WorkerRequest, WorkerResponse } from "@/lib/worker/messages";

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
        dispatch({ type: "SET_RAW_DATA", payload: msg.rows });
        dispatch({ type: "SET_COLUMNS", payload: msg.columns });
        dispatch({ type: "SET_HEALTH_SCORE", payload: msg.healthScore });
        dispatch({ type: "SET_WARNINGS", payload: msg.warnings });
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
        dispatch({ type: "SET_CLEANED_DATA", payload: msg.cleanedData });
        dispatch({ type: "SET_AUDIT_LOG", payload: msg.auditLog });
        dispatch({ type: "SET_PROGRESS", payload: null });
        dispatch({ type: "SET_STAGE", payload: "done" });
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
      dispatch({ type: "SET_ERROR", payload: "" });
      dispatch({ type: "SET_WARNINGS", payload: [] });

      dispatch({ type: "SET_STAGE", payload: "analyzing" });
      const csvText = await file.text();

      const request: WorkerRequest = { type: "PARSE", csvText };
      getWorker().postMessage(request);
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
      const csvText = await response.text();

      const request: WorkerRequest = { type: "PARSE", csvText };
      getWorker().postMessage(request);
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Failed to load sample data: ${err}` });
    }
  }

  function cleanData() {
    if (state.rawData.length === 0) return;
    dispatch({ type: "SET_STAGE", payload: "cleaning" });
    dispatch({ type: "SET_PROGRESS", payload: null });

    const request: WorkerRequest = {
      type: "CLEAN",
      data: state.rawData,
      columns: state.columns,
    };
    getWorker().postMessage(request);
  }

  function reset() {
    workerRef.current?.terminate();
    workerRef.current = null;
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
            return val.includes(",") ||
              val.includes('"') ||
              val.includes("\n") ||
              val.includes("\r")
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.fileName.replace(".csv", "")}-audit-report.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
