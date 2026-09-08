"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { CleanerState, AppStage } from "@/types";

type Action =
  | { type: "SET_STAGE"; payload: AppStage }
  | { type: "SET_FILE_NAME"; payload: string }
  | { type: "SET_FILE_SIZE"; payload: number }
  | { type: "SET_ROW_COUNT"; payload: number }
  | { type: "SET_CLEANED_ROW_COUNT"; payload: number }
  | { type: "SET_COLUMNS"; payload: CleanerState["columns"] }
  | { type: "SET_HEALTH_SCORE"; payload: CleanerState["healthScore"] }
  | { type: "SET_AUDIT_LOG"; payload: CleanerState["auditLog"] }
  | { type: "SET_PROGRESS"; payload: CleanerState["progress"] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_WARNINGS"; payload: string[] }
  | { type: "SET_PREVIEW"; payload: CleanerState["preview"] }
  | { type: "SET_CLEANED_PREVIEW"; payload: CleanerState["cleanedPreview"] }
  | { type: "RESET" };

const initialState: CleanerState = {
  stage: "idle",
  fileName: "",
  fileSize: 0,
  rowCount: 0,
  cleanedRowCount: 0,
  columns: [],
  healthScore: null,
  auditLog: [],
  progress: null,
  error: null,
  warnings: [],
  preview: [],
  cleanedPreview: [],
};

function reducer(state: CleanerState, action: Action): CleanerState {
  switch (action.type) {
    case "SET_STAGE":
      return { ...state, stage: action.payload };
    case "SET_FILE_NAME":
      return { ...state, fileName: action.payload };
    case "SET_FILE_SIZE":
      return { ...state, fileSize: action.payload };
    case "SET_ROW_COUNT":
      return { ...state, rowCount: action.payload };
    case "SET_CLEANED_ROW_COUNT":
      return { ...state, cleanedRowCount: action.payload };
    case "SET_COLUMNS":
      return { ...state, columns: action.payload };
    case "SET_HEALTH_SCORE":
      return { ...state, healthScore: action.payload };
    case "SET_AUDIT_LOG":
      return { ...state, auditLog: action.payload };
    case "SET_PROGRESS":
      return { ...state, progress: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, stage: "error", progress: null };
    case "SET_WARNINGS":
      return { ...state, warnings: action.payload };
    case "SET_PREVIEW":
      return { ...state, preview: action.payload };
    case "SET_CLEANED_PREVIEW":
      return { ...state, cleanedPreview: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface CleanerContextType {
  state: CleanerState;
  dispatch: React.Dispatch<Action>;
}

const CleanerContext = createContext<CleanerContextType | null>(null);

export function CleanerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CleanerContext.Provider value={{ state, dispatch }}>
      {children}
    </CleanerContext.Provider>
  );
}

export function useCleaner() {
  const context = useContext(CleanerContext);
  if (!context) {
    throw new Error("useCleaner must be used within a CleanerProvider");
  }
  return context;
}
