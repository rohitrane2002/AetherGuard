"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellAlertIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  severity: string;
  category: string;
  is_read: boolean;
  action_url?: string | null;
  timestamp: string;
};

export default function NotificationsPage() {
  const { ready } = useProtectedRoute();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    const response = await authFetch(`${API_BASE_URL}/notifications`);
    if (isUnauthorizedStatus(response.status)) {
      redirectToAuth(true);
      return;
    }
    if (!response.ok) return;
    setNotifications(await response.json());
  };

  const markOneRead = async (notificationId: number) => {
    const response = await authFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      toast.error("Failed to acknowledge alert");
      return;
    }
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)),
    );
  };

  const markAllRead = async () => {
    const response = await authFetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "POST",
    });
    if (!response.ok) {
      toast.error("Failed to acknowledge alerts");
      return;
    }
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  };

  useEffect(() => {
    if (ready) loadNotifications();
  }, [ready]);

  const metrics = useMemo(() => {
    const critical = notifications.filter((item) => item.severity === "critical").length;
    const info = notifications.filter((item) => item.severity === "info").length;
    const unread = notifications.filter((item) => !item.is_read).length;
    return {
      critical,
      info,
      unread,
      total: notifications.length,
    };
  }, [notifications]);

  const severityIcon = (severity: string) => {
    if (severity === "critical") return <ExclamationTriangleIcon className="h-5 w-5 text-rose-300" />;
    if (severity === "info") return <ShieldCheckIcon className="h-5 w-5 text-emerald-300" />;
    if (severity === "warning") return <SparklesIcon className="h-5 w-5 text-amber-300" />;
    return <BellAlertIcon className="h-5 w-5 text-cyan-300" />;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Signal Center"
          title="Track live risk events, confirmations, and workspace security signals."
          subtitle="AetherGuard now surfaces a dedicated alert console so critical findings, safe signals, and operational intelligence stay visible instead of disappearing into scan history."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total alerts" value={String(metrics.total)} helper="Persistent platform signal feed" />
          <StatCard label="Unread" value={String(metrics.unread)} helper="Waiting for operator review" accent="violet" />
          <StatCard label="Critical" value={String(metrics.critical)} helper="Needs immediate attention" accent="rose" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Panel>
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">Alert posture</h2>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Operational guidance</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Critical findings are raised from recent analyses, while safe signals confirm lower-risk scans. Use this page as the control room for triage before reports are exported or shared to the team workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button tone="ghost" onClick={loadNotifications}>Refresh alert stream</Button>
                <Button tone="ghost" onClick={markAllRead}>Mark all read</Button>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Live feed</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Security notifications</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {notifications.length} items
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {notifications.length ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`panel-sheen rounded-[24px] border p-5 ${
                      item.is_read ? "border-white/10 bg-white/[0.04]" : "border-cyan-400/20 bg-cyan-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                          {severityIcon(item.severity)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-2 max-w-3xl text-sm text-slate-400">{item.body}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                          {item.category} · {item.severity}
                        </div>
                        {!item.is_read ? (
                          <Button tone="ghost" className="px-3 py-2 text-xs" onClick={() => markOneRead(item.id)}>
                            Acknowledge
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    {item.action_url ? (
                      <button
                        className="mt-3 text-xs uppercase tracking-[0.24em] text-cyan-300 transition hover:text-cyan-200"
                        onClick={() => (window.location.href = item.action_url || "/dashboard")}
                      >
                        Open linked surface
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-slate-400">
                  No alerts yet. Run fresh scans and this feed will start reflecting high-risk findings and safe deployment confirmations.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
