"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BackgroundGrid from "../components/BackgroundGrid";
import toast, { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------------------------- PDF Export Helper ----------------------------
async function exportPdf(elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) return toast.error("Result block not found");

  try {
    const canvas = await html2canvas(node, {
      backgroundColor: "#0d1117",
      scale: 2,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ratio = canvas.width / canvas.height;
    pdf.addImage(img, "PNG", 0, 10, pw, pw / ratio);
    pdf.save("aetherguard_report.pdf");
    toast.success("📄 PDF downloaded!");
  } catch (err) {
    console.error("PDF error", err);
    toast.error("Failed to create PDF. See console.");
  }
}

// ------------------------------ Analyzer Page ------------------------------
export default function AnalyzePage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    try {
      if (!code.trim()) return toast.error("Paste some Solidity first!");
      setLoading(true);
      NProgress.start();

      const { data } = await axios.post(
        "https://aetherguard-api.onrender.com/analyze/",
        { code }
      );

      setResult(data);
      toast.success("✅ Scan complete!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Backend unreachable");
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleCopy = () => {
    if (!result.prediction) return toast.error("Run a scan first");
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast("📋 Report copied!");
  };

  const handleText = () => {
    if (!result.prediction) return toast.error("Run a scan first");
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "text/plain",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aetherguard_report.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chart = {
    labels: ["Secure", "Vulnerable"],
    datasets: [
      {
        data: [result.prob_secure ?? 0, result.prob_vulnerable ?? 0],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  return (
    <main className="relative min-h-screen bg-[#0d1117] text-gray-200 flex flex-col items-center overflow-hidden font-sans md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />
      <Toaster position="top-right" />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-28 text-center space-y-4"
      >
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400 text-transparent bg-clip-text drop-shadow-lg">
          AetherGuard Analyzer
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm">
          Real‑time AI security scan for Solidity smart contracts
        </p>
      </motion.div>

      {/* Main block */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-5xl mt-10 mb-24 bg-white/5 rounded-3xl p-8 border border-transparent hover:border-fuchsia-400/40 transition-all"
      >
        <SparklesIcon className="absolute top-6 right-6 w-6 h-6 text-fuchsia-400 animate-pulse" />

        <textarea
          className="w-full h-72 p-4 rounded-lg bg-black/30 border border-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
          placeholder="// Paste Solidity code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-8 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              loading
                ? "bg-gradient-to-r from-gray-700 to-gray-600 cursor-wait"
                : "bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:scale-105"
            }`}
          >
            {loading ? (
              <>
                <ClipLoader size={18} color="#fff" /> Scanning...
              </>
            ) : (
              "🚀 Analyze"
            )}
          </button>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <ClipboardIcon className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={handleText}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => exportPdf("pdf-wrapper")}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Result */}
        {result.prediction && (
          <div
            id="pdf-wrapper"
            className="relative mt-10 rounded-2xl border border-gray-700 bg-black/40 p-8 text-center"
          >
            {result.prediction === "vulnerable" ? (
              <div className="absolute inset-0 bg-red-600/10 blur-[150px]" />
            ) : (
              <div className="absolute inset-0 bg-green-600/10 blur-[150px]" />
            )}

            <div className="relative z-10">
              {result.prediction === "vulnerable" ? (
                <ExclamationTriangleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
              ) : (
                <ShieldCheckIcon className="w-20 h-20 text-green-400 mx-auto mb-4" />
              )}

              <h2
                className={`text-3xl font-bold ${
                  result.prediction === "vulnerable" ? "text-red-500" : "text-green-400"
                }`}
              >
                {result.prediction === "vulnerable" ? "⚠ Vulnerable" : "✅ Secure"}
              </h2>

              <div className="mt-6 h-60 max-w-xs mx-auto">
                <Pie data={chart} />
              </div>

              <p className="text-gray-400 text-sm mt-4">
                Secure {result.prob_secure?.toFixed(3)} | Vulnerable 
                {result.prob_vulnerable?.toFixed(3)}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}