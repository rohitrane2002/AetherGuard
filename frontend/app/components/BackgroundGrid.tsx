"use client";

import { motion } from "framer-motion";

const particles = [
  { left: "12%", top: "16%", delay: 0.2, duration: 8.2 },
  { left: "28%", top: "42%", delay: 1.4, duration: 10.5 },
  { left: "74%", top: "24%", delay: 0.8, duration: 9.8 },
  { left: "82%", top: "58%", delay: 2.1, duration: 11.2 },
  { left: "48%", top: "70%", delay: 1.2, duration: 9.1 },
  { left: "18%", top: "78%", delay: 2.8, duration: 10.1 },
];

type DeviceTier = "mobile" | "tablet" | "desktop";

export default function BackgroundGrid({ deviceTier = "desktop" }: { deviceTier?: DeviceTier }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-70"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
        transition={{ duration: deviceTier === "desktop" ? 24 : deviceTier === "tablet" ? 30 : 40, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(91,124,255,0.18), transparent 18%), radial-gradient(circle at 85% 10%, rgba(255,94,168,0.14), transparent 16%), radial-gradient(circle at 50% 100%, rgba(95,231,255,0.14), transparent 26%)",
          backgroundSize: "160% 160%",
        }}
      />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute left-1/2 top-24 h-px w-[42rem] -translate-x-1/2 aurora-line opacity-60" />
      <div className="absolute bottom-16 left-1/2 h-px w-[34rem] -translate-x-1/2 aurora-line opacity-30" />
      <div className={`absolute inset-0 ${deviceTier === "mobile" ? "hidden" : "block"}`}>
        {particles.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}-${index}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan-200/70 shadow-[0_0_18px_rgba(95,231,255,0.5)]"
            style={{ left: particle.left, top: particle.top }}
            animate={{ y: [0, deviceTier === "desktop" ? -24 : -14, 0], opacity: [0.15, 0.8, 0.15], scale: [0.9, 1.25, 0.9] }}
            transition={{
              duration: deviceTier === "desktop" ? particle.duration : particle.duration + 2,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M12 18 C24 22, 31 34, 43 36 S64 24, 76 30 90 44, 94 42" fill="none" stroke="rgba(95,231,255,0.24)" strokeWidth="0.18" />
          <path d="M18 82 C28 70, 40 68, 52 62 S74 48, 88 52" fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="0.18" />
          <path d="M8 48 C18 44, 32 46, 43 52 S64 66, 84 64" fill="none" stroke="rgba(255,94,168,0.18)" strokeWidth="0.18" />
        </svg>
      </div>
      <motion.div
        className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
        animate={{ scale: [1, deviceTier === "desktop" ? 1.08 : 1.04, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: deviceTier === "desktop" ? 8 : 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-[22rem] w-[22rem] rounded-full bg-fuchsia-500/10 blur-[110px]"
        animate={{ y: [0, deviceTier === "desktop" ? -30 : -16, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: deviceTier === "desktop" ? 10 : 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-[20rem] w-[20rem] rounded-full bg-violet-500/10 blur-[110px]"
        animate={{ x: [0, deviceTier === "desktop" ? 30 : 16, 0], opacity: [0.18, 0.34, 0.18] }}
        transition={{ duration: deviceTier === "desktop" ? 9 : 13, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-[12rem] w-[12rem] rounded-full border border-cyan-300/10 bg-cyan-200/5 blur-[24px]"
        animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 11, repeat: Infinity }}
      />
    </div>
  );
}
