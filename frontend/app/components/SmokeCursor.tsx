"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

export default function SmokeCursor({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const addParticles = (x: number, y: number) => {
      for (let index = 0; index < 2; index += 1) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45 - 0.12,
          life: 0,
          maxLife: 44 + Math.random() * 22,
          size: 18 + Math.random() * 28,
          hue: Math.random() > 0.5 ? 192 : 258,
        });
      }
      if (particlesRef.current.length > 80) {
        particlesRef.current.splice(0, particlesRef.current.length - 80);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
      addParticles(event.clientX, event.clientY);
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    let frameId = 0;
    const render = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particlesRef.current = particlesRef.current.filter((particle) => particle.life < particle.maxLife);

      for (const particle of particlesRef.current) {
        particle.life += 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.988;
        particle.vy *= 0.988;

        const progress = particle.life / particle.maxLife;
        const alpha = Math.max(0, (1 - progress) * 0.14);
        const radius = particle.size * (0.55 + progress * 0.9);

        const gradient = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          radius,
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 95%, 70%, ${alpha})`);
        gradient.addColorStop(0.45, `hsla(${particle.hue}, 92%, 62%, ${alpha * 0.55})`);
        gradient.addColorStop(1, "hsla(0, 0%, 0%, 0)");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      if (pointerRef.current.active) {
        const pointerGlow = context.createRadialGradient(
          pointerRef.current.x,
          pointerRef.current.y,
          0,
          pointerRef.current.x,
          pointerRef.current.y,
          56,
        );
        pointerGlow.addColorStop(0, "rgba(95, 231, 255, 0.065)");
        pointerGlow.addColorStop(0.55, "rgba(139, 92, 246, 0.045)");
        pointerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = pointerGlow;
        context.beginPath();
        context.arc(pointerRef.current.x, pointerRef.current.y, 56, 0, Math.PI * 2);
        context.fill();
      }

      frameId = window.requestAnimationFrame(render);
    };

    setCanvasSize();
    render();

    window.addEventListener("resize", setCanvasSize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1] hidden lg:block" aria-hidden="true" />;
}
