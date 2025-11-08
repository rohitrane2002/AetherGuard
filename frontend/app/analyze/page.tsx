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

/* ---------------------------- PDF export helper ---------------------------- */
async function exportPdf(elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) return toast.error("Result block not found");

  const canvas = await html2canvas(node, { backgroundColor: "#0d1117", scale: 2 });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ratio = canvas.width / canvas.height;
  pdf.addImage(img, "PNG", 0, 10, pw, pw / ratio);
  pdf.save("aetherguard_report.pdf");
  toast.success("📄 PDF downloaded!");
}

/* ------------------------------ Analyzer Page ------------------------------ */
export default function AnalyzePage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    try {
      if (!code.trim()) return toast.error("Paste some Solidity first!");
      setLoading(true);
      NProgress.start();

      // ✅ your Render backend endpoint
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

      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-28 text-center space-y-4"
      >
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400 text-transparent bg-clip-text drop-shadow-lg">
          AetherGuard Analyzer
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm">
          Real‑time AI security scan for Solidity smart contracts
        </p>
      </motion.div>

      {/* main block */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-5xl mt-10 mb-24 bg-white/5 rounded-3xl p-8"
      >
        <SparklesIcon className="absolute top-6 right-6 w-6 h-6 text-fuchsia-400 animate-pulse" />

        <textarea
          className="w-full h-72 p-4 rounded-lg bg-black/30 border border-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
          placeholder="// Paste Solidity code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* analyze button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-semibold hover:scale-105"
          >
            {loading ? "Scanning..." : "🚀 Analyze"}
          </button>
        </div>

        {/* result */}
        {result.prediction && (
          <div id="pdf-wrapper" className="mt-10 text-center">
            <h2
              className={`text-3xl font-bold ${
                result.prediction === "vulnerable" ? "text-red-500" : "text-green-400"
              }`}
            >
              {result.prediction === "vulnerable" ? "⚠ Vulnerable" : "✅ Secure"}
            </h2>
            <div className="h-60 w-60 mx-auto mt-6">
              <Pie data={chart} />
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Secure {result.prob_secure?.toFixed(3)} | Vulnerable{" "}
              {result.prob_vulnerable?.toFixed(3)}
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}