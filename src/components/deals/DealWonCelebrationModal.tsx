import React, { useEffect, useRef } from 'react';
import { Deal } from '../../types/crm';
import { formatCurrency } from '../../utils/formatters';
import { Trophy, Sparkles, Building2, User, CheckCircle2 } from 'lucide-react';

interface DealWonCelebrationModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  autoCloseSeconds?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  shape: 'rect' | 'circle';
  opacity: number;
}

const CONFETTI_COLORS = [
  '#10b981', // emerald-500
  '#059669', // emerald-600
  '#34d399', // emerald-400
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#6366f1', // indigo-500
  '#3b82f6', // blue-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
];

export const DealWonCelebrationModal: React.FC<DealWonCelebrationModalProps> = ({
  deal,
  isOpen,
  onClose,
  autoCloseSeconds = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti Animation Effect
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate confetti particles bursting from center
    const particles: Particle[] = [];
    const particleCount = 110;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2 - 40;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 14 + 6;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const isCircle = Math.random() > 0.65;

      particles.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - (Math.random() * 8 + 4),
        width: Math.random() * 8 + 6,
        height: Math.random() * 6 + 4,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        shape: isCircle ? 'circle' : 'rect',
        opacity: 1,
      });
    }

    const startTime = performance.now();
    const duration = 2000;

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let activeParticles = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        if (elapsed > duration - 600) {
          p.opacity = Math.max(0, 1 - (elapsed - (duration - 600)) / 600);
        }

        if (p.opacity > 0 && p.y < window.innerHeight + 50) {
          activeParticles++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.scale(Math.sin(p.wobble), 1);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          }

          ctx.restore();
        }
      }

      if (elapsed < duration && activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  // Automatically close after a few seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isOpen, autoCloseSeconds, onClose]);

  // ESC or click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !deal) return null;

  return (
    <>
      {/* Confetti Fullscreen Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[125]"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Celebration Popup Backdrop */}
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in cursor-pointer"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-won-title"
      >
        <div
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden transform transition-all animate-pop-in cursor-default"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="p-7 text-center">
            {/* Celebration Trophy Icon */}
            <div className="relative inline-flex items-center justify-center mb-3.5">
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/25 blur-md animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/40">
                <Trophy className="w-8 h-8 text-amber-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center text-[9px] text-white">
                  <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                </span>
              </span>
            </div>

            {/* Stage Badge & Title */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deal Won!</span>
            </div>

            <h2
              id="deal-won-title"
              className="text-lg font-black text-slate-900 tracking-tight leading-snug line-clamp-2 px-1"
            >
              {deal.title}
            </h2>

            {/* Won Amount Highlight Card */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-slate-50/60 to-teal-50/80 border border-emerald-200/80 shadow-xs">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700/80 block">
                Won Amount
              </span>
              <div className="text-3xl font-black font-mono text-emerald-600 tracking-tight mt-0.5">
                {formatCurrency(deal.value, deal.currency || 'USD')}
              </div>
            </div>

            {/* Deal Metadata Details */}
            {(deal.companyName || deal.contactName || deal.assignedTo) && (
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
                {deal.companyName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{deal.companyName}</span>
                  </div>
                )}
                {(deal.contactName || deal.assignedTo) && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[140px]">
                      {deal.contactName || deal.assignedTo}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
