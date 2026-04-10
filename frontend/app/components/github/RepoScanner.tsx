"use client";

import { useState, useEffect } from "react";
import { FolderIcon, CodeBracketIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button, Panel } from "../ui";
import { authFetch } from "../../lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

export default function RepoScanner() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/github/repos`);
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      } else {
        setError("Please connect your GitHub account to scan repositories.");
      }
    } catch (err) {
      setError("Failed to fetch repositories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <Panel className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Continuous Security</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Repository Scanner</h2>
          <p className="text-sm text-slate-400">Deep scan entire GitHub repositories for multi-chain vulnerabilities.</p>
        </div>
        <Button tone="ghost" onClick={fetchRepos} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Repos"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">{error}</p>
          <Button className="mt-6" tone="primary" onClick={() => window.location.href = `${API_BASE_URL}/auth/github`}>
            Connect GitHub
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo) => (
            <div key={repo.id} className="panel-sheen flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-cyan-500/10 p-2">
                  <CodeBracketIcon className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{repo.name}</p>
                  <p className="text-xs text-slate-500">{repo.language || "Multi-language"} · {repo.private ? "Private" : "Public"}</p>
                </div>
              </div>
              <Button tone="ghost" className="h-9 text-xs">Scan Repo</Button>
            </div>
          ))}
          {repos.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              No repositories found.
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
