"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export default function GlassCard({ children, className }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "relative rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
