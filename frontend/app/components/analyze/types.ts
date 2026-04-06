"use client";

export type AnalysisFinding = {
  slug: string;
  label: string;
  severity: string;
  confidence: number;
  summary: string;
  recommendation: string;
  line_numbers: number[];
};


export type AnalysisResult = {
  score: number;
  severity: string;
  issues: string[];
  steps: string[];
  explanation: string;
  fix: string;
  poc_test?: string;
  log_id: number;

  confidence: number;
  remaining_today: number;
  // Backward compatibility
  prediction?: string;
  prob_secure?: number;
  prob_vulnerable?: number;
  email?: string;
  model_source?: string;
  risk_score?: number;
  findings?: AnalysisFinding[];
  safe_patterns?: string[];
  summary?: string;
  fix_suggestions?: string[];
  autofix_preview?: string;
};


export type CopilotMessage = {
  role: string;
  content: string;
};

export type LineInsight = {
  lineNumber: number;
  severity: "critical" | "high" | "medium" | "low";
  label: string;
  summary: string;
  recommendation: string;
  kind: "finding" | "change";
};
