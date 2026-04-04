"use client";

import { motion } from "framer-motion";
import { BoltIcon, CheckCircleIcon, CpuChipIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Panel } from "../ui";

type StepState = "waiting" | "active" | "done";

type Step = {
  label: string;
  detail: string;
  state: StepState;
};

export default function ScanProgressPanel({
  steps,
  progress,
  live,
}: {
  steps: Step[];
  progress: number;
  live?: boolean;
}) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">{live ? "Live scanner" : "Scan progress"}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {live ? "Background contract telemetry" : "Step-by-step AI audit"}
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white">
          {progress}%
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-950/90">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const icon =
            step.state === "done" ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
            ) : step.state === "active" ? (
              <CpuChipIcon className="h-5 w-5 text-cyan-300" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-slate-600" />
            );

          return (
            <motion.div
              key={step.label}
              animate={{ opacity: step.state === "waiting" ? 0.5 : 1, y: step.state === "active" ? -1 : 0 }}
              className={`rounded-[20px] border p-4 ${
                step.state === "done"
                  ? "border-emerald-400/20 bg-emerald-500/10"
                  : step.state === "active"
                  ? "border-cyan-400/20 bg-cyan-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                    {step.state === "active" ? (
                      <motion.span
                        className="text-[10px] uppercase tracking-[0.22em] text-cyan-300"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      >
                        active
                      </motion.span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
        <BoltIcon className="h-4 w-4 text-cyan-300" />
        {live ? "Fast live heuristics while you type" : "Structured audit trail replaces loading spinners"}
      </div>
    </Panel>
  );
}
