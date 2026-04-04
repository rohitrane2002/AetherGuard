"use client";

import type { AnalysisFinding, LineInsight } from "./types";

function findFirstLine(lines: string[], patterns: RegExp[], fallback = 1) {
  for (const pattern of patterns) {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) return index + 1;
  }
  return fallback;
}

export function buildLineInsights(code: string, findings: AnalysisFinding[] = [], fixedCode?: string | null): LineInsight[] {
  const lines = code.split("\n");
  const insights: LineInsight[] = [];

  for (const finding of findings) {
    const slug = finding.slug.toLowerCase();
    const label = finding.label;
    let lineNumber = 1;

    if (slug.includes("reentrancy")) {
      lineNumber = findFirstLine(lines, [/\.call\s*\{value:/i, /\.call\(/i, /\.transfer\(/i, /\.send\(/i]);
    } else if (slug.includes("access")) {
      lineNumber = findFirstLine(lines, [/onlyOwner/i, /require\s*\(\s*msg\.sender/i, /\bowner\b/i, /\badmin\b/i]);
    } else if (slug.includes("overflow")) {
      lineNumber = findFirstLine(lines, [/\+\=/, /-\=/, /\*\=/, /\bunchecked\b/i]);
    } else {
      lineNumber = findFirstLine(lines, [/function\s+/i]);
    }

    insights.push({
      lineNumber,
      severity: (finding.severity as LineInsight["severity"]) ?? "medium",
      label,
      summary: finding.summary,
      recommendation: finding.recommendation,
      kind: "finding",
    });
  }

  if (fixedCode && fixedCode !== code) {
    const original = code.split("\n");
    const updated = fixedCode.split("\n");
    const maxLines = Math.max(original.length, updated.length);
    for (let index = 0; index < maxLines; index += 1) {
      if ((original[index] ?? "") !== (updated[index] ?? "")) {
        insights.push({
          lineNumber: index + 1,
          severity: "low",
          label: "Auto-fix change",
          summary: "This line changes in the secure rewrite.",
          recommendation: "Review the AI-generated patch before shipping to production.",
          kind: "change",
        });
      }
    }
  }

  const seen = new Set<string>();
  return insights.filter((insight) => {
    const key = `${insight.kind}:${insight.lineNumber}:${insight.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
