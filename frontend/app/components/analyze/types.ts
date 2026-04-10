"use client";

export type AnalysisFinding = {
  slug: string;
  label: string;
  severity: string;
  confidence: number;
  summary: string;
  recommendation: string;
  language?: string;
};

export type AnalysisResult = {
  prediction: string;
  prob_secure: number;
  prob_vulnerable: number;
  email: string;
  log_id: number;
  model_source: string;
  confidence: number;
  remaining_today: number;
  risk_score: number;
  findings: AnalysisFinding[];
  safe_patterns: string[];
  summary: string;
  fix_suggestions: string[];
  autofix_preview: string;
  benchmarks?: any;
  report_url?: string;
  issues: string[];
  score: number;
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
