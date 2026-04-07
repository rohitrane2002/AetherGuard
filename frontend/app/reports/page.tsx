"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { exportPdf } from "../components/PdfExporter";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type HistoryItem = {
  id: number;
  contract_snippet: string;
  prediction: string;
  confidence: number;
  timestamp: string;
};

export default function ReportsPage() {
  const { ready } = useProtectedRoute();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sharingId, setSharingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await authFetch(`${API_BASE_URL}/history?limit=20`);
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      if (!response.ok) return;
      setHistory(await response.json());
    };
    if (ready) load();
  }, [ready]);

  const metrics = useMemo(() => {
    const vulnerable = history.filter((item) => item.prediction === "vulnerable").length;
    const secure = history.length - vulnerable;
    const averageConfidence = history.length
      ? (history.reduce((total, item) => total + item.confidence, 0) / history.length).toFixed(2)
      : "0.00";
    const latest = history[0];
    return { vulnerable, secure, averageConfidence, latest };
  }, [history]);

  const shareReport = async (analysisLogId: number) => {
    setSharingId(analysisLogId);
    try {
      const response = await authFetch(`${API_BASE_URL}/workspace/share-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_log_id: analysisLogId }),
      });
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Unable to share report");
        return;
      }
      toast.success(data.already_shared ? "Report already in workspace" : "Report shared to workspace");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Audit Reports"
          title="Curate an executive-grade archive of contract intelligence."
          subtitle="Turn scan history into a premium reporting surface with investor-ready metrics, shareable audit snapshots, and workspace memory that compounds over time."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Reports" value={String(history.length)} helper="Recent audit records" />
          <StatCard label="Vulnerable" value={String(metrics.vulnerable)} helper="Contracts needing attention" accent="rose" />
          <StatCard label="Secure" value={String(metrics.secure)} helper="Lower-risk detections" accent="emerald" />
          <StatCard label="Avg Confidence" value={metrics.averageConfidence} helper="Model certainty across recent scans" accent="violet" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Panel>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Executive overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Reporting posture</h2>
            <div className="mt-5 space-y-4">
              <div className="panel-sheen rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Latest report</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {metrics.latest ? `Scan #${metrics.latest.id} · ${metrics.latest.prediction}` : "No reports yet"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {metrics.latest ? new Date(metrics.latest.timestamp).toLocaleString() : "Run an audit to generate your first premium report."}
                </p>
              </div>
              <div className="panel-sheen rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Archive guidance</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Export client-facing PDFs, promote the strongest findings into your workspace, and keep the cleanest audit trail ready for founders, security reviewers, and stakeholders.
                </p>
              </div>
              <Button tone="ghost" onClick={() => exportPdf("reports-export")}>
                <ArrowUpTrayIcon className="mr-2 inline h-4 w-4" />
                Export archive PDF
              </Button>
            </div>
          </Panel>

          <Panel id="reports-export">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Recent audit feed</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Security report archive</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {history.length} reports
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {history.length ? (
                history.map((item) => {
                  const vulnerable = item.prediction === "vulnerable";
                  return (
                    <div key={item.id} className="panel-sheen rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-2xl border p-3 ${vulnerable ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"}`}>
                            {vulnerable ? (
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            ) : (
                              <ShieldCheckIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Scan #{item.id} · {item.prediction}</p>
                            <p className="mt-2 text-sm text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                            Confidence {item.confidence.toFixed(3)}
                          </div>
                          <Button
                            tone="ghost"
                            disabled={sharingId === item.id}
                            onClick={() => shareReport(item.id)}
                          >
                            <DocumentDuplicateIcon className="mr-2 inline h-4 w-4" />
                            {sharingId === item.id ? "Sharing..." : "Share to workspace"}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[20px] border border-white/10 bg-slate-950/80 p-4">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Contract snapshot</p>
                        <pre className="scrollbar-thin mt-3 overflow-x-auto text-xs text-slate-300">
                          {item.contract_snippet}
                        </pre>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-slate-400">
                  No reports yet. Run an audit from the AI workspace and this archive will become your executive evidence trail.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
