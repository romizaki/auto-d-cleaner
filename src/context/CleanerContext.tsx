"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { CleanerState, AppStage } from "@/types";

type Action =
  | { type: "SET_STAGE"; payload: AppStage }
  | { type: "SET_FILE_NAME"; payload: string }
  | { type: "SET_RAW_DATA"; payload: CleanerState["rawData"] }
  | { type: "SET_COLUMNS"; payload: CleanerState["columns"] }
  | { type: "SET_HEALTH_SCORE"; payload: CleanerState["healthScore"] }
  | { type: "SET_CLEANED_DATA"; payload: CleanerState["cleanedData"] }
  | { type: "SET_AUDIT_LOG"; payload: CleanerState["auditLog"] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" };

const initialState: CleanerState = {
  stage: "idle",
  fileName: "",
  rawData: [],
  cleanedData: [],
  columns: [],
  healthScore: null,
  auditLog: [],
  error: null,
};

function reducer(state: CleanerState, action: Action): CleanerState {
  switch (action.type) {
    case "SET_STAGE":
      return { ...state, stage: action.payload };
    case "SET_FILE_NAME":
      return { ...state, fileName: action.payload };
    case "SET_RAW_DATA":
      return { ...state, rawData: action.payload };
    case "SET_COLUMNS":
      return { ...state, columns: action.payload };
    case "SET_HEALTH_SCORE":
      return { ...state, healthScore: action.payload };
    case "SET_CLEANED_DATA":
      return { ...state, cleanedData: action.payload };
    case "SET_AUDIT_LOG":
      return { ...state, auditLog: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, stage: "error" };
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
