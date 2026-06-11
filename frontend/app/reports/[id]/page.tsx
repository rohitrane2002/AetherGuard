"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { exportPdf } from "../../components/PdfExporter";
import AuditReportTemplate from "../../components/analyze/AuditReportTemplate";
import { authFetch } from "../../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

interface ReportData {
  source_code: string;
  created_at: string;
  results: any;
}

export default function SingleReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id;

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!reportId) return;

    const loadReport = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/reports/${reportId}`);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            toast.error("You do not have permission to view this report.");
          } else {
            toast.error("Report not found.");
          }
          setLoading(false);
          return;
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        toast.error("Failed to load audit intelligence.");
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [reportId]);

  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Shareable report URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy URL.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportId) return;
    await exportPdf("report-render-target");
  };

  return (
    <AppShell>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-[1020px] space-y-6">
        
        {/* Navigation Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <button
            onClick={() => router.push("/analyze")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Workspace IDE
          </button>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={copyShareLink}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition w-full sm:w-auto"
            >
              <LinkIcon className="h-4 w-4 text-cyan-400" />
              Share Link
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={loading || !reportData}
              className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-black hover:scale-[1.02] hover:bg-cyan-300 disabled:opacity-50 transition w-full sm:w-auto"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Report Shell */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="text-sm font-medium text-slate-400">Loading audit certificate details...</p>
          </div>
        ) : reportData ? (
          <div className="flex justify-center border border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-[#02040a]">
            <div id="report-render-target">
              <AuditReportTemplate result={reportData.results} code={reportData.source_code} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] text-center space-y-4">
            <ShieldCheckIcon className="h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-bold text-white">Report Restricted or Dead</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Either this report reference does not exist, or you lack the permission keys required to audit this scope.
            </p>
            <button
              onClick={() => router.push("/analyze")}
              className="rounded-lg bg-white/10 border border-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
            >
              Go to Scan Console
            </button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
