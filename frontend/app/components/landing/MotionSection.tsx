"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export default function MotionSection({
  children,
  className = "",
  parallax = 18,
}: {
  children: ReactNode;
  className?: string;
  parallax?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -parallax]);

  return (
    <motion.section
      style={{ y }}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
