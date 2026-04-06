"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { BoltIcon } from "@heroicons/react/24/solid";
import { Button, Panel } from "../ui";
import type { LineInsight } from "./types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[26rem] items-center justify-center bg-[#040711] text-sm text-slate-400">
      Loading editor workspace...
    </div>
  ),
});

function severityClass(severity: LineInsight["severity"], kind: LineInsight["kind"]) {
  if (kind === "change") return "border-l-4 border-cyan-400 bg-cyan-500/8";
  if (severity === "critical") return "border-l-4 border-rose-400 bg-rose-500/10";
  if (severity === "high") return "border-l-4 border-amber-400 bg-amber-500/10";
  if (severity === "medium") return "border-l-4 border-cyan-400 bg-cyan-500/10";
  return "border-l-4 border-emerald-400 bg-emerald-500/10";
}

export default function ContractEditorPanel({
  code,
  onChange,
  loading,
  liveLoading,
  insights,
  selectedLine,
  onSelectLine,
  onAnalyze,
  onFix,
  onExport,
  fixing,
}: {
  code: string;
  onChange: (value: string) => void;
  loading: boolean;
  liveLoading: boolean;
  insights: LineInsight[];
  selectedLine: number | null;
  onSelectLine: (line: number | null) => void;
  onAnalyze: () => void;
  onFix: () => void;
  onExport: () => void;
  fixing: boolean;
}) {
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const decorationIds = useRef<string[]>([]);

  const insightMap = useMemo(() => {
    const map = new Map<number, LineInsight[]>();
    for (const insight of insights) {
      const current = map.get(insight.lineNumber) ?? [];
      current.push(insight);
      map.set(insight.lineNumber, current);
    }
    return map;
  }, [insights]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const decorations: MonacoEditorNS.IModelDeltaDecoration[] = [];
    for (const insight of insights) {
      const hoverMarkdown = [`**${insight.label}**`, insight.summary, insight.recommendation]
        .filter(Boolean)
        .join("\n\n");

      decorations.push({
        range: {
          startLineNumber: insight.lineNumber,
          startColumn: 1,
          endLineNumber: insight.lineNumber,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className:
            insight.kind === "change"
              ? "ag-line-change"
              : insight.severity === "critical"
              ? "ag-line-critical"
              : insight.severity === "high"
              ? "ag-line-high"
              : insight.severity === "medium"
              ? "ag-line-medium"
              : "ag-line-low",
          glyphMarginClassName:
            insight.kind === "change"
              ? "ag-glyph-change"
              : insight.severity === "critical"
              ? "ag-glyph-critical"
              : insight.severity === "high"
              ? "ag-glyph-high"
              : insight.severity === "medium"
              ? "ag-glyph-medium"
              : "ag-glyph-low",
          glyphMarginHoverMessage: { value: hoverMarkdown },
          hoverMessage: { value: hoverMarkdown },
        },
      });
    }

    if (selectedLine) {
      decorations.push({
        range: {
          startLineNumber: selectedLine,
          startColumn: 1,
          endLineNumber: selectedLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "ag-line-selected",
        },
      });
      editor.revealLineInCenter(selectedLine);
    }

    decorationIds.current = editor.deltaDecorations(decorationIds.current, decorations);
  }, [insights, selectedLine]);

  return (
    <Panel className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Contract editor</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Mission control</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          <BoltIcon className="h-4 w-4 text-cyan-300" />
          {liveLoading ? "Refreshing live feedback..." : "Live feedback online"}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.28em] text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span>Solidity editor</span>
          </div>
          <span>{code.length} chars</span>
        </div>

        <MonacoEditor
          height="26rem"
          defaultLanguage="sol"
          value={code}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            smoothScrolling: true,
            glyphMargin: true,
            folding: true,
            wordWrap: "on",
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            padding: { top: 18, bottom: 18 },
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monaco.editor.defineTheme("aetherguard-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#040711",
                "editorLineNumber.foreground": "#4b5563",
                "editor.lineHighlightBackground": "#0d1325",
                "editorGutter.background": "#040711",
              },
            });
            monaco.editor.setTheme("aetherguard-dark");
          }}
          onChange={(value) => onChange(value ?? "")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.84fr_1.16fr]">
        <div className="flex flex-wrap gap-3">
          <Button onClick={onAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Run premium audit"}
          </Button>
          <Button tone="ghost" onClick={onFix} disabled={fixing}>
            {fixing ? "Drafting fix..." : "Fix my contract"}
          </Button>
          <Button tone="ghost" onClick={onExport}>Download PDF report</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {insightMap.size > 0 ? (
            Array.from(insightMap.entries()).slice(0, 4).map(([lineNumber, lineInsights]) => (
              <button
                key={lineNumber}
                onClick={() => onSelectLine(lineNumber)}
                className={`rounded-[20px] p-4 text-left transition hover:-translate-y-0.5 ${severityClass(
                  lineInsights[0].severity,
                  lineInsights[0].kind
                )}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Line {lineNumber}</p>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                    {lineInsights[0].kind === "change" ? "patch" : lineInsights[0].severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">{lineInsights[0].label}</p>
                <p className="mt-2 text-xs leading-6 text-slate-300/80">{lineInsights[0].summary}</p>
              </button>
            ))
          ) : (
            <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 md:col-span-2">
              No risky lines highlighted yet. Keep typing or run a full scan to surface contract insights.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
