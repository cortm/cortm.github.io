import { useEffect, useState } from 'react';

const COLORS = ['#2d5a3d', '#3d7352', '#e8b84a', '#f5d78e', '#c97b63', '#e8c4b8'];

interface Particle {
  id: number;
  color: string;
  dx: number;
  dy: number;
  rot: number;
  width: number;
  height: number;
  delay: number;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 220;
    return {
      id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 40,
      rot: Math.random() * 720 - 360,
      width: 6 + Math.random() * 6,
      height: 5 + Math.random() * 7,
      delay: Math.random() * 0.12,
    };
  });
}

interface CompletionCelebrationProps {
  tick: number;
}

export function CompletionCelebration({ tick }: CompletionCelebrationProps) {
  const [burst, setBurst] = useState<{ key: number; particles: Particle[] } | null>(null);

  useEffect(() => {
    if (tick === 0) return;
    setBurst({ key: tick, particles: createParticles(36) });
    const timer = setTimeout(() => setBurst(null), 3000);
    return () => clearTimeout(timer);
  }, [tick]);

  if (!burst) return null;

  return (
    <div className="completion-celebration" aria-hidden="true">
      <div className="completion-celebration__scrim" />
      <div className="completion-celebration__ring" />
      <span className="completion-celebration__check">✓</span>
      {burst.particles.map((piece) => (
        <span
          key={`${burst.key}-${piece.id}`}
          className="completion-celebration__piece"
          style={{
            backgroundColor: piece.color,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            animationDelay: `${0.5 + piece.delay}s`,
            ['--dx' as string]: `${piece.dx}px`,
            ['--dy' as string]: `${piece.dy}px`,
            ['--rot' as string]: `${piece.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
