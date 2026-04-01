"use client";

import { useEffect, useRef } from "react";

type Props = Readonly<{
  show: boolean;
  tierName: string;
  onComplete: () => void;
}>;

export function TierCelebration({ show, tierName, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#1B4D3E", "#2D7A5F", "#F59E0B", "#10B981", "#6366F1", "#EC4899"];
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -10 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 3,
        life: 1,
      });
    }

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.008;

        if (p.life > 0) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      }
    }

    animate();
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
        <div className="animate-bounce rounded-2xl bg-surface-container-lowest p-8 text-center shadow-2xl">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-2 text-2xl font-bold text-on-surface">
            You reached {tierName}!
          </h2>
          <p className="mt-1 text-sm text-[--color-on-surface-variant]">
            Keep referring to unlock more rewards
          </p>
        </div>
      </div>
    </>
  );
}
