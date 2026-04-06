"use client";

import { useEffect, useRef, useCallback } from "react";

type Node = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
  connections: number[];
};

export default function NeuralNetwork({
  enabled = true,
  baseOpacity = 0.07,
}: {
  enabled?: boolean;
  baseOpacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);

  const initNodes = useCallback((width: number, height: number) => {
    const nodes: Node[] = [];
    // Lower density for minimalism
    const count = Math.min(Math.floor((width * height) / 45000), 40);

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        radius: 0.8 + Math.random() * 1.5,
        pulse: Math.random() * Math.PI * 2,
        // Extremely slow pulsing
        pulseSpeed: 0.002 + Math.random() * 0.004,
        connections: [],
      });
    }

    // Connect nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const distances: { index: number; dist: number }[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].baseX - nodes[j].baseX;
        const dy = nodes[i].baseY - nodes[j].baseY;
        distances.push({ index: j, dist: Math.sqrt(dx * dx + dy * dy) });
      }
      distances.sort((a, b) => a.dist - b.dist);
      const maxConnections = 1 + Math.floor(Math.random() * 2);
      nodes[i].connections = distances
        .slice(0, maxConnections)
        .filter((d) => d.dist < 350)
        .map((d) => d.index);
    }
    nodesRef.current = nodes;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      // We only want it extending approx 100vh down, absolute positioned
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes(w, h);
    };

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    let frameId = 0;

    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;
      const scrollY = scrollRef.current;

      // Interaction glow: as user scrolls down, it glows slightly brighter (adds up to 4% opacity)
      const scrollGlow = Math.min(scrollY / 400, 1) * 0.04;
      const currentOpacity = baseOpacity + scrollGlow;

      for (const node of nodes) {
        node.pulse += node.pulseSpeed;
        const drift = Math.sin(node.pulse) * 3;
        const driftY = Math.cos(node.pulse * 0.8) * 3;

        let targetX = node.baseX + drift;
        let targetY = node.baseY + driftY;

        // Subtle mouse repulsion rather than crazy attraction
        const dmx = mouse.x - node.x;
        const dmy = mouse.y - node.y;
        const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
        if (mouseDist < 250 && mouseDist > 0) {
          const force = (250 - mouseDist) / 250;
          targetX -= (dmx / mouseDist) * force * 15;
          targetY -= (dmy / mouseDist) * force * 15;
        }

        // Very slow interpolation for elegance
        node.x += (targetX - node.x) * 0.012;
        node.y += (targetY - node.y) * 0.012;
      }

      // Draw subtle connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (const j of node.connections) {
          const target = nodes[j];
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 350) continue;

          // Pure white lines fading by distance
          const lineOpacity = Math.max(0, (1 - dist / 350) * currentOpacity * 0.7);
          ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      }

      // Draw minimal pulsing nodes
      for (const node of nodes) {
        const pulseFactor = Math.sin(node.pulse);
        const nodeOpacity = currentOpacity * (0.6 + pulseFactor * 0.4);

        // Slow glow
        if (pulseFactor > 0.4) {
          ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity * 0.15})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, initNodes, baseOpacity]);

  if (!enabled) return null;

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block" 
      style={{ 
        maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)', 
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)' 
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
}
