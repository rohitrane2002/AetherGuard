"use client";

import { SparklesIcon } from "@heroicons/react/24/solid";
import { Button, Panel } from "../ui";
import type { CopilotMessage } from "./types";

const quickPrompts = [
  "Explain this vulnerability",
  "Give me the smallest secure patch",
  "Rewrite this contract safely",
];

export default function CopilotPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onQuickPrompt,
  sending,
}: {
  messages: CopilotMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickPrompt: (prompt: string) => void;
  sending: boolean;
}) {
  return (
    <Panel className="flex flex-col">
      <div className="flex items-center gap-3">
        <SparklesIcon className="h-5 w-5 text-cyan-300" />
        <div>
          <h2 className="text-2xl font-semibold text-white">AI Explainer</h2>
          <p className="text-sm text-slate-400">Short, clear answers over the contract currently in focus.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onQuickPrompt(prompt)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="scrollbar-thin mt-5 h-[26rem] space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
        {messages.length === 0 ? (
          <>
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">Try asking</p>
              <p>Explain why this contract is dangerous.</p>
              <p className="mt-2">Show the minimum safe change.</p>
              <p className="mt-2">Summarize this for a non-security engineer.</p>
            </div>
            <div className="rounded-[20px] border border-cyan-400/10 bg-cyan-500/10 p-4 text-sm text-cyan-50">
              I’ll keep explanations concise, point to the likely root cause, and suggest the safest next change.
            </div>
          </>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-[20px] p-4 text-sm ${
                message.role === "assistant"
                  ? "border border-cyan-400/10 bg-cyan-500/10 text-cyan-50"
                  : "border border-white/10 bg-white/5 text-slate-100"
              }`}
            >
              <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">{message.role}</p>
              <p className="whitespace-pre-wrap">{message.content || "Thinking..."}</p>
            </div>
          ))
        )}
      </div>

      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        className="mt-4 h-28 rounded-[24px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none"
        placeholder="Ask for a short explanation, a minimal fix, or a safer rewrite."
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={onSend} disabled={sending}>
          {sending ? "Streaming..." : "Send to Copilot"}
        </Button>
      </div>
    </Panel>
  );
}
