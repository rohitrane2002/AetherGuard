"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundGrid from "../components/BackgroundGrid";
import { Panel, SectionHeading } from "../components/ui";
import { useProtectedRoute } from "../lib/useProtectedRoute";
import { authFetch } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  updated_at: string;
  private: boolean;
  default_branch: string;
};

type SolFile = {
  path: string;
  sha: string;
  size: number;
};

type ScanResult = {
  score: number;
  severity: string;
  issues: string[];
  file_path: string;
  explanation: string;
};

export default function ReposPage() {
  const { ready } = useProtectedRoute();
  const router = useRouter();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [notLinked, setNotLinked] = useState(false);

  // Selected repo state
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [solFiles, setSolFiles] = useState<SolFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Scanning state
  const [scanningFile, setScanningFile] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<string, ScanResult>>({});

  // Search
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetchRepos();
  }, [ready]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const resp = await authFetch(`${API_BASE_URL}/github/repos`);
      if (resp.status === 400) {
        setNotLinked(true);
        return;
      }
      if (!resp.ok) throw new Error("Failed to load repos");
      const data = await resp.json();
      setRepos(data.repos || []);
      setGithubUsername(data.github_username);
    } catch (err) {
      toast.error("Failed to load GitHub repos");
    } finally {
      setLoadingRepos(false);
    }
  };

  const selectRepo = async (repo: Repo) => {
    setSelectedRepo(repo);
    setSolFiles([]);
    setLoadingFiles(true);
    setScanResults({});
    try {
      const resp = await authFetch(
        `${API_BASE_URL}/github/repos/${repo.full_name}/sol-files?branch=${repo.default_branch}`
      );
      if (!resp.ok) throw new Error("Failed to load files");
      const data = await resp.json();
      setSolFiles(data.files || []);
      if ((data.files || []).length === 0) {
        toast("No .sol files found in this repository", { icon: "📭" });
      }
    } catch {
      toast.error("Failed to load Solidity files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const scanFile = async (file: SolFile) => {
    if (!selectedRepo) return;
    setScanningFile(file.path);
    try {
      const resp = await authFetch(
        `${API_BASE_URL}/github/repos/${selectedRepo.full_name}/scan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.path }),
        }
      );
      if (!resp.ok) throw new Error("Scan failed");
      const result = await resp.json();
      setScanResults((prev) => ({ ...prev, [file.path]: result }));
      toast.success(`Scanned ${file.path.split("/").pop()}`);
    } catch {
      toast.error(`Failed to scan ${file.path}`);
    } finally {
      setScanningFile(null);
    }
  };

  const scanAll = async () => {
    for (const file of solFiles) {
      if (!scanResults[file.path]) {
        await scanFile(file);
      }
    }
  };

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!ready) return null;

  // ── Not Linked View ───────────────────────────────────────────────
  if (notLinked) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-8">
        <BackgroundGrid />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center text-center">
          <Panel className="w-full">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">GitHub Not Connected</h2>
            <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
              To scan your repositories for Solidity vulnerabilities, connect your GitHub account first.
            </p>
            <button
              onClick={() => {
                window.location.href = `${API_BASE_URL}/auth/oauth/github`;
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Connect GitHub
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-3 block text-sm text-slate-500 hover:text-slate-300 transition"
            >
              ← Back to Dashboard
            </button>
          </Panel>
        </div>
      </main>
    );
  }

  // ── Severity Badge ────────────────────────────────────────────────
  const SeverityBadge = ({ severity }: { severity: string }) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500/20 text-red-300 border-red-500/30",
      high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    };
    return (
      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors[severity] || colors.info}`}>
        {severity}
      </span>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <BackgroundGrid />
      <div className="relative mx-auto max-w-7xl">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <SectionHeading
            eyebrow="GitHub Scanner"
            title={selectedRepo ? selectedRepo.full_name : "Scan your repositories."}
            subtitle={
              selectedRepo
                ? `Scanning Solidity contracts in ${selectedRepo.name}`
                : "Select a repository to find and audit Solidity smart contracts."
            }
          />
          <div className="flex items-center gap-3">
            {githubUsername && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                @{githubUsername}
              </span>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ── Breadcrumb ──────────────────────────────────── */}
        {selectedRepo && (
          <div className="mb-6 flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                setSelectedRepo(null);
                setSolFiles([]);
                setScanResults({});
              }}
              className="text-cyan-300 hover:text-cyan-200 transition"
            >
              Repositories
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-white">{selectedRepo.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{solFiles.length} .sol files</span>

            {solFiles.length > 0 && (
              <button
                onClick={scanAll}
                disabled={scanningFile !== null}
                className="ml-auto rounded-full bg-cyan-500/20 px-4 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {scanningFile ? "Scanning..." : "Scan All"}
              </button>
            )}
          </div>
        )}

        {/* ── Repo List View ──────────────────────────────── */}
        {!selectedRepo && (
          <>
            <div className="mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40 transition"
              />
            </div>

            {loadingRepos ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-400 border-t-transparent" />
              </div>
            ) : filteredRepos.length === 0 ? (
              <Panel className="text-center py-12">
                <p className="text-slate-400">No repositories found.</p>
              </Panel>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredRepos.map((repo) => (
                    <motion.button
                      key={repo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => selectRepo(repo)}
                      className="group rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-cyan-400/30 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-200 transition">
                          {repo.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {repo.private && (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              Private
                            </span>
                          )}
                          {repo.language && (
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                              {repo.language}
                            </span>
                          )}
                        </div>
                      </div>
                      {repo.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2">{repo.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>⭐ {repo.stars}</span>
                        <span>🌿 {repo.default_branch}</span>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* ── Sol Files View ──────────────────────────────── */}
        {selectedRepo && (
          <>
            {loadingFiles ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-400 border-t-transparent" />
              </div>
            ) : solFiles.length === 0 ? (
              <Panel className="text-center py-12">
                <p className="text-slate-400">No Solidity (.sol) files found in this repository.</p>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="mt-4 text-sm text-cyan-300 hover:text-cyan-200 transition"
                >
                  ← Select different repo
                </button>
              </Panel>
            ) : (
              <div className="space-y-3">
                {solFiles.map((file) => {
                  const result = scanResults[file.path];
                  const isScanning = scanningFile === file.path;

                  return (
                    <motion.div
                      key={file.sha}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/15"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10">
                            <span className="text-xs font-mono text-cyan-300">.sol</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{file.path}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {result && <SeverityBadge severity={result.severity} />}
                          {result && (
                            <span className="text-xs text-slate-400">
                              Score: {result.score}/100
                            </span>
                          )}
                          <button
                            onClick={() => scanFile(file)}
                            disabled={isScanning}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                          >
                            {isScanning ? (
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                                Scanning...
                              </span>
                            ) : result ? (
                              "Re-scan"
                            ) : (
                              "Scan"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Scan Result Expansion */}
                      <AnimatePresence>
                        {result && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] p-4"
                          >
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>{result.issues.length} issue{result.issues.length !== 1 ? "s" : ""} found</span>
                              <span>·</span>
                              <SeverityBadge severity={result.severity} />
                            </div>
                            {result.issues.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {result.issues.map((issue, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {result.explanation && (
                              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                                {result.explanation.slice(0, 300)}
                                {result.explanation.length > 300 ? "..." : ""}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
