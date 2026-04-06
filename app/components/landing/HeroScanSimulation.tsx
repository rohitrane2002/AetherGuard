"use client";

import { motion } from "framer-motion";

const codeLines = [
  "contract Vault {",
  "    mapping(address => uint256) balances;",
  "    function deposit() external payable {",
  "        balances[msg.sender] += msg.value;",
  "    }",
  "    function withdraw(uint256 amount) external {",
  "        require(balances[msg.sender] >= amount, 'insufficient');",
  "        (bool ok,) = msg.sender.call{value: amount}(\"\");",
  "        require(ok, 'transfer failed');",
  "        balances[msg.sender] -= amount;",
  "    }",
  "}",
];

export default function HeroScanSimulation() {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_30px_120px_rgba(3,8,24,0.6)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 via-violet-500/8 to-transparent" />
      <div className="absolute -right-12 top-12 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative rounded-[24px] border border-white/10 bg-[#07101f]/95">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-cyan-200">
            AI scan simulation
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-2 font-mono text-[12px] leading-6 text-slate-300 md:text-[13px]">
              {codeLines.map((line, index) => {
                const isRiskLine = index === 7 || index === 9;
                return (
                  <motion.div
                    key={`${index}-${line}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    className={`relative rounded-xl px-3 py-1.5 ${
                      isRiskLine ? "bg-rose-500/12 text-rose-100" : "bg-white/[0.02]"
                    }`}
                  >
                    <span className="mr-4 inline-block w-4 text-right text-slate-500">{index + 1}</span>
                    <span>{line}</span>
                    {isRiskLine ? (
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-xl border border-rose-400/30"
                        animate={{
                          opacity: [0.35, 0.95, 0.35],
                          boxShadow: [
                            "0 0 0 rgba(251, 113, 133, 0.15)",
                            "0 0 28px rgba(251, 113, 133, 0.32)",
                            "0 0 0 rgba(251, 113, 133, 0.15)",
                          ],
                        }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className="absolute bottom-4 left-10 h-5 w-[2px] bg-cyan-300"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          <div className="space-y-4 p-4">
            <motion.div
              className="rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200">Live signal</p>
              <p className="mt-3 text-xl font-semibold text-white">Possible reentrancy risk</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                External value transfer happens before balance mutation. Attackers may re-enter withdraw paths.
              </p>
            </motion.div>

            <motion.div
              className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Suggested fix</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Move state updates before external call
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-300" />
                  Add `nonReentrant` guard
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  Emit withdrawal event
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
