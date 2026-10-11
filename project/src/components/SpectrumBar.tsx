import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SpectrumVoter {
  voterId: string;
  position: number; // -100 to 100
  isMe?: boolean;
}

interface SpectrumBarProps {
  voters: SpectrumVoter[];
  myPosition: number | null;
  onSlide: (position: number) => void;
  disabled?: boolean;
}

export default function SpectrumBar({ voters, myPosition, onSlide, disabled }: SpectrumBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const positionToPct = (pos: number) => ((pos + 100) / 200) * 100;

  const handlePointer = (clientX: number) => {
    if (!barRef.current || disabled) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pos = Math.round(pct * 200 - 100);
    onSlide(pos);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => handlePointer(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, disabled]);

  const avg = voters.length > 0
    ? Math.round(voters.reduce((s, v) => s + v.position, 0) / voters.length)
    : 0;
  const avgPct = positionToPct(avg);

  const leftCount = voters.filter((v) => v.position < -15).length;
  const rightCount = voters.filter((v) => v.position > 15).length;
  const centerCount = voters.length - leftCount - rightCount;

  const nudge = (dir: 'left' | 'right') => {
    if (disabled) return;
    const current = myPosition ?? 0;
    const next = Math.max(-100, Math.min(100, current + (dir === 'left' ? -15 : 15)));
    onSlide(next);
  };

  return (
    <div className="rounded-xl border border-amber-900/25 p-4"
      style={{ background: 'rgba(18, 16, 12, 0.6)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-500/70 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Opinion Spectrum
        </span>
        <span className="text-[10px] text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>
          {voters.length} {voters.length === 1 ? 'voice' : 'voices'} · sliding intent
        </span>
      </div>
      <p className="text-[10px] text-amber-700/35 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        Drag your marker along the spectrum to show where you lean. This does not cast a formal vote — it signals your current inclination to the gallery.
      </p>

      {/* Bar + side buttons */}
      <div className="flex items-stretch gap-2">
        {/* Left nudge button */}
        <button
          onClick={() => nudge('left')}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-0.5 px-3 rounded-lg border border-blue-800/40 bg-blue-950/40 text-blue-400 transition-all hover:bg-blue-900/50 hover:scale-105 active:scale-95 disabled:opacity-30 shrink-0"
          title="Slide toward Pro"
        >
          <ChevronLeft size={18} />
          <span className="text-[8px] font-bold tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>PRO</span>
        </button>

        {/* The spectrum bar */}
        <div
          ref={barRef}
          onPointerDown={(e) => { if (!disabled) { setDragging(true); handlePointer(e.clientX); } }}
          className="relative h-12 rounded-lg cursor-pointer touch-none select-none flex-1"
          style={{
            background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 16%, #64748b 33%, #9ca3af 50%, #78716c 67%, #dc2626 84%, #9f1239 100%)',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-200/30 pointer-events-none" />

          {/* Average marker (diamond) */}
          {voters.length > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300"
              style={{ left: `${avgPct}%` }}
            >
              <div className="w-3 h-3 rotate-45 bg-amber-300/80 border border-amber-100/50 shadow-lg" />
            </div>
          )}

          {/* Other voter dots */}
          {voters.filter((v) => !v.isMe).map((v, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-200/40 pointer-events-none"
              style={{ left: `${positionToPct(v.position)}%`, top: '30%' }}
            />
          ))}

          {/* My marker */}
          {myPosition !== null && (
            <div
              className="absolute -translate-x-1/2 pointer-events-none transition-all duration-150 z-10"
              style={{ left: `${positionToPct(myPosition)}%`, top: '50%', transform: `translate(-50%, -50%) scale(${dragging ? 1.25 : 1})` }}
            >
              <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-400 shadow-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
            </div>
          )}
        </div>

        {/* Right nudge button */}
        <button
          onClick={() => nudge('right')}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-0.5 px-3 rounded-lg border border-red-800/40 bg-red-950/40 text-red-400 transition-all hover:bg-red-900/50 hover:scale-105 active:scale-95 disabled:opacity-30 shrink-0"
          title="Slide toward Con"
        >
          <ChevronRight size={18} />
          <span className="text-[8px] font-bold tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>CON</span>
        </button>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-bold tracking-widest text-blue-400" style={{ fontFamily: 'Georgia, serif' }}>
          PRO ←
        </span>
        <span className="text-[10px] text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>
          {leftCount} left · {centerCount} center · {rightCount} right
        </span>
        <span className="text-[10px] font-bold tracking-widest text-red-400" style={{ fontFamily: 'Georgia, serif' }}>
          → CON
        </span>
      </div>

      {/* My position indicator text */}
      {myPosition !== null && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-amber-600/50" style={{ fontFamily: 'Georgia, serif' }}>
            Your lean: {myPosition < -15 ? 'Pro' : myPosition > 15 ? 'Con' : 'Undecided'}
            {myPosition !== 0 && ` (${myPosition > 0 ? '+' : ''}${myPosition})`}
          </span>
        </div>
      )}
    </div>
  );
}
