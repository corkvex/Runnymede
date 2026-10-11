import { Scale } from 'lucide-react';

export interface MasterSpectrumData {
  proCount: number;
  conCount: number;
  neutralCount: number;
  totalCount: number;
  averagePosition: number; // -100 to 100
}

interface MasterSpectrumProps {
  data: MasterSpectrumData;
}

export default function MasterSpectrum({ data }: MasterSpectrumProps) {
  const { proCount, conCount, neutralCount, totalCount, averagePosition } = data;
  const proPct = totalCount > 0 ? (proCount / totalCount) * 100 : 0;
  const conPct = totalCount > 0 ? (conCount / totalCount) * 100 : 0;
  const neutralPct = totalCount > 0 ? (neutralCount / totalCount) * 100 : 0;

  // Map average position (-100..100) to a 0..100 percentage on the bar
  const avgPct = ((averagePosition + 100) / 200) * 100;

  const dominantSide =
    proCount > conCount && proCount > neutralCount
      ? 'pro'
      : conCount > proCount && conCount > neutralCount
      ? 'con'
      : 'split';

  const dominantLabel =
    dominantSide === 'pro'
      ? 'The gallery leans toward the Pro'
      : dominantSide === 'con'
      ? 'The gallery leans toward the Con'
      : totalCount === 0
      ? 'The gallery awaits its first voices'
      : 'The gallery stands divided';

  return (
    <div className="rounded-xl border border-amber-700/20 px-5 py-4"
      style={{ background: 'linear-gradient(135deg, rgba(22, 19, 14, 0.7), rgba(15, 12, 8, 0.7))' }}>
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-amber-500/50" />
          <span className="text-xs font-bold tracking-[0.2em] text-amber-500/60" style={{ fontFamily: 'Georgia, serif' }}>
            MASTER SPECTRVM
          </span>
        </div>
        <span className="text-[10px] text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>
          {totalCount} {totalCount === 1 ? 'voice' : 'voices'} · display only
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-amber-700/35 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        A living aggregate of the gallery's collective lean. This meter reflects all audience signals — not a single vote, but the weight of opinion across the chamber.
      </p>

      {/* Continuous gradient bar — matches the Opinion Spectrum colours */}
      <div className="relative h-8 rounded-lg overflow-hidden mb-3"
        style={{ background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 16%, #64748b 33%, #9ca3af 50%, #78716c 67%, #dc2626 84%, #9f1239 100%)' }}>
        {/* Pro portion overlay (left side darkens to show pro share) */}
        {proPct > 0 && (
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-[11px] font-bold text-white transition-all duration-700 ease-out"
            style={{
              width: `${proPct}%`,
              background: 'linear-gradient(90deg, rgba(30,58,95,0.25), rgba(37,99,235,0.25))',
              boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06)',
            }}
          >
            {proCount > 0 && `${proCount}`}
          </div>
        )}
        {/* Neutral portion overlay (center) */}
        {neutralPct > 0 && (
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-bold text-gray-200 transition-all duration-700 ease-out"
            style={{
              left: `${proPct}%`,
              width: `${neutralPct}%`,
              background: 'linear-gradient(90deg, rgba(100,116,139,0.2), rgba(156,163,175,0.2))',
            }}
          >
            {neutralCount > 0 && `${neutralCount}`}
          </div>
        )}
        {/* Con portion overlay (right side) */}
        {conPct > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 flex items-center justify-center text-[11px] font-bold text-white transition-all duration-700 ease-out"
            style={{
              width: `${conPct}%`,
              background: 'linear-gradient(90deg, rgba(220,38,38,0.25), rgba(159,18,57,0.25))',
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.06)',
            }}
          >
            {conCount > 0 && `${conCount}`}
          </div>
        )}
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-200/20 pointer-events-none" />
      </div>

      {/* Average marker line */}
      <div className="relative h-1 mb-3">
        <div className="absolute inset-0 rounded-full bg-amber-900/20" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400/60 rounded-full transition-all duration-700 ease-out"
          style={{ left: `${avgPct}%`, boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)' }}
        />
        <div
          className="absolute -top-3 -translate-x-1/2 text-[9px] font-mono text-amber-500/50 transition-all duration-700 ease-out"
          style={{ left: `${avgPct}%` }}
        >
          avg
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold tracking-widest text-blue-400" style={{ fontFamily: 'Georgia, serif' }}>
            PARTES
          </span>
          <span className="text-[9px] text-blue-500/40">{proPct.toFixed(0)}%</span>
        </div>
        <span className="text-[10px] text-amber-600/40 italic text-center" style={{ fontFamily: 'Georgia, serif' }}>
          {dominantLabel}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-widest text-red-400" style={{ fontFamily: 'Georgia, serif' }}>
            CONTRA
          </span>
          <span className="text-[9px] text-red-500/40">{conPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
