"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type WorkspaceMember = {
  id: number;
  email?: string | null;
  role: string;
  status: string;
  joined_at: string;
};

type SharedReport = {
  id: number;
  analysis_log_id: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  contract_snippet: string;
  shared_at: string;
};

type Workspace = {
  team_id: number;
  team_name: string;
  team_slug: string;
  role: string;
  members: WorkspaceMember[];
  shared_reports: SharedReport[];
  can_manage_members: boolean;
};

type AnalysisHistory = {
  id: number;
  contract_snippet: string;
  prediction: string;
  confidence: number;
  timestamp: string;
};

export default function WorkspacePage() {
  const { ready } = useProtectedRoute();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sharingReportId, setSharingReportId] = useState<number | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);

  const loadWorkspace = async () => {
    const [workspaceRes, historyRes] = await Promise.all([
      authFetch(`${API_BASE_URL}/workspace`),
      authFetch(`${API_BASE_URL}/history?limit=8`),
    ]);
    if ([workspaceRes, historyRes].some((res) => isUnauthorizedStatus(res.status))) {
      redirectToAuth(true);
      return;
    }
    if (!workspaceRes.ok || !historyRes.ok) {
      toast.error("Failed to load workspace");
      return;
    }
    setWorkspace(await workspaceRes.json());
    setHistory(await historyRes.json());
  };

  useEffect(() => {
    if (ready) {
      loadWorkspace();
    }
  }, [ready]);

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const response = await authFetch(`${API_BASE_URL}/workspace/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    if (isUnauthorizedStatus(response.status)) {
      redirectToAuth(true);
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.detail || "Unable to invite member");
      return;
    }
    toast.success(`Invitation ${data.status === "active" ? "activated" : "created"} for ${data.email}`);
    setInviteEmail("");
    loadWorkspace();
  };

  const shareReport = async (analysisLogId: number) => {
    setSharingReportId(analysisLogId);
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
      toast.success(data.already_shared ? "Report already shared" : "Report shared with workspace");
      loadWorkspace();
    } finally {
      setSharingReportId(null);
    }
  };

  const updateMemberRole = async (memberId: number, role: string) => {
    setUpdatingMemberId(memberId);
    try {
      const response = await authFetch(`${API_BASE_URL}/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Unable to update member");
        return;
      }
      toast.success("Member permissions updated");
      loadWorkspace();
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const removeMember = async (memberId: number) => {
    setUpdatingMemberId(memberId);
    try {
      const response = await authFetch(`${API_BASE_URL}/workspace/members/${memberId}`, {
        method: "DELETE",
      });
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Unable to remove member");
        return;
      }
      toast.success("Member removed from workspace");
      loadWorkspace();
    } finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <AppShell>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Team Workspace"
          title="Collaborate on audit intelligence with real team state."
          subtitle="Invite reviewers, keep shared reports visible, and give every protocol workspace a persistent operational memory."
        />

        {!workspace ? (
          <Panel>Loading workspace...</Panel>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Team" value={workspace.team_name} helper={workspace.team_slug} />
              <StatCard label="Your role" value={workspace.role} helper="Role-aware access" accent="violet" />
              <StatCard label="Members" value={String(workspace.members.length)} helper="Active + invited" accent="emerald" />
              <StatCard label="Shared reports" value={String(workspace.shared_reports.length)} helper="Visible to the workspace" accent="amber" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Permission model</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Owner</h2>
                <p className="mt-3 text-sm text-slate-400">Can invite, change roles, remove members, and manage the workspace operating model.</p>
              </Panel>
              <Panel>
                <p className="text-xs uppercase tracking-[0.28em] text-violet-300">Admin</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Operational control</h2>
                <p className="mt-3 text-sm text-slate-400">Can invite and manage members, but cannot rewrite workspace ownership.</p>
              </Panel>
              <Panel>
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Member / Viewer</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Delivery roles</h2>
                <p className="mt-3 text-sm text-slate-400">Members collaborate on reports, while viewers stay read-only for audit visibility and leadership review.</p>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Invite teammates</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Bring security reviewers into the loop.</h2>
                <div className="mt-5 space-y-3">
                  <input
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="security@protocol.dev"
                    className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                  />
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    disabled={!workspace.can_manage_members}
                    className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button onClick={inviteMember} disabled={!workspace.can_manage_members}>
                    {workspace.can_manage_members ? "Send invitation" : "Owners and admins only"}
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  {workspace.members.map((member) => (
                    <div key={member.id} className="panel-sheen rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{member.email || "Pending teammate"}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{member.role}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {member.status}
                          </span>
                          {workspace.can_manage_members && member.role !== "owner" ? (
                            <>
                              <select
                                value={member.role}
                                disabled={updatingMemberId === member.id}
                                onChange={(event) => updateMemberRole(member.id, event.target.value)}
                                className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400/40"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <Button
                                tone="danger"
                                disabled={updatingMemberId === member.id}
                                onClick={() => removeMember(member.id)}
                              >
                                {updatingMemberId === member.id ? "Updating..." : "Remove"}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="space-y-6">
                <Panel>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Shared reports</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Workspace-visible audit trail.</h2>
                  <div className="mt-5 space-y-3">
                    {workspace.shared_reports.length ? (
                      workspace.shared_reports.map((report) => (
                        <div key={report.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                Report #{report.analysis_log_id} · {report.prediction}
                              </p>
                              <p className="mt-2 text-sm text-slate-400">{report.contract_snippet}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Risk</p>
                              <p className="text-2xl font-semibold text-white">{report.risk_score}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                        No reports shared yet. Push your strongest scans into the team workspace below.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Share fresh scans</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Promote analysis history into team memory.</h2>
                  <div className="mt-5 space-y-3">
                    {history.map((scan) => (
                      <div key={scan.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Scan #{scan.id} · {scan.prediction}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">{scan.contract_snippet}</p>
                          </div>
                          <Button
                            tone="ghost"
                            disabled={sharingReportId === scan.id}
                            onClick={() => shareReport(scan.id)}
                          >
                            {sharingReportId === scan.id ? "Sharing..." : "Share"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
