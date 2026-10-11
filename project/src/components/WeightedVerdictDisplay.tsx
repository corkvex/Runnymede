import { Scale, Users } from 'lucide-react';
import type { WeightedVerdict, PoolResult, PoolLabel } from '@/lib/votingMath';

interface WeightedVerdictProps {
  verdict: WeightedVerdict | null;
  myPool: PoolLabel | null;
  myWeight: number | null;
}

function PoolRow({ pool, label, color }: { pool: PoolResult; label: string; color: string }) {
  const score = pool.equalizedScore;
  const scoreLabel = score > 0.01 ? 'Pro' : score < -0.01 ? 'Con' : 'Split';
  const scoreColor = score > 0.01 ? 'text-blue-400' : score < -0.01 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(15, 12, 8, 0.4)' }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-semibold tracking-wider" style={{ fontFamily: 'Georgia, serif', color }}>
          {label}
        </span>
        <span className="text-[9px] text-amber-700/40">{pool.voterCount} voters</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 text-[9px]">
          <span className="text-blue-400/60">{pool.proVotes}P</span>
          <span className="text-gray-400/40">{pool.neutralVotes}U</span>
          <span className="text-red-400/60">{pool.conVotes}C</span>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-mono font-bold ${scoreColor}`}>{scoreLabel}</span>
          <span className="text-[8px] text-amber-700/30 block">{score.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

export default function WeightedVerdictDisplay({ verdict, myPool, myWeight }: WeightedVerdictProps) {
  if (!verdict) return null;

  const winnerLabel = verdict.winner === 'pro' ? 'Pro' : verdict.winner === 'con' ? 'Con' : 'Tie';
  const winnerColor = verdict.winner === 'pro' ? 'text-blue-400' : verdict.winner === 'con' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className="rounded-xl border border-amber-700/20 px-5 py-4"
      style={{ background: 'linear-gradient(135deg, rgba(22, 19, 14, 0.7), rgba(15, 12, 8, 0.7))' }}>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-amber-500/50" />
          <span className="text-xs font-bold tracking-[0.2em] text-amber-500/60" style={{ fontFamily: 'Georgia, serif' }}>
            PROPORTIONAL VERDICT
          </span>
        </div>
        <span className="text-[10px] text-amber-700/40 flex items-center gap-1">
          <Users size={10} /> {verdict.totalVoters} voters · {verdict.totalVotes} ballots
        </span>
      </div>

      {/* Pool breakdown */}
      <div className="space-y-1.5 mb-3">
        <PoolRow pool={verdict.leftPool} label="LEFT POOL" color="#3b82f6" />
        <PoolRow pool={verdict.centristPool} label="CENTRIST POOL" color="#9ca3af" />
        <PoolRow pool={verdict.rightPool} label="RIGHT POOL" color="#ef4444" />
      </div>

      {/* Final scores */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(15, 12, 8, 0.5)' }}>
        <div className="text-center flex-1">
          <p className="text-[9px] text-blue-400/50 tracking-widest">PRO SCORE</p>
          <p className="text-lg font-mono font-bold text-blue-400">{verdict.proScore.toFixed(3)}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-[9px] text-amber-600/40 tracking-widest mb-0.5">WINNER</p>
          <p className={`text-lg font-bold ${winnerColor}`} style={{ fontFamily: 'Georgia, serif' }}>{winnerLabel}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[9px] text-red-400/50 tracking-widest">CON SCORE</p>
          <p className="text-lg font-mono font-bold text-red-400">{verdict.conScore.toFixed(3)}</p>
        </div>
      </div>

      {/* Centrist tie-breaker */}
      {verdict.centristBreaker !== 'tie' && (
        <p className="text-[10px] text-amber-700/40 text-center mt-2" style={{ fontFamily: 'Georgia, serif' }}>
          Centrist pool tie-breaker: {verdict.centristBreaker === 'pro' ? 'Pro' : 'Con'}
        </p>
      )}

      {/* My classification */}
      {myPool && myWeight !== null && (
        <div className="mt-3 pt-3 border-t border-amber-900/20">
          <p className="text-[10px] text-amber-700/40 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Your pool: <span className="text-amber-500/60 font-semibold">{myPool}</span>
            {' · '}Your vote weight: <span className="text-amber-500/60 font-mono">{myWeight.toFixed(2)}</span>
            <span className="block mt-0.5 text-amber-700/30">
              {myWeight < 0.3 ? 'High historical bias — vote weighted down' : myWeight < 0.7 ? 'Moderate bias — vote partially weighted' : 'Low bias — full vote weight'}
            </span>
          </p>
        </div>
      )}

      {/* Explanation */}
      <p className="text-[9px] text-amber-700/30 text-center mt-2 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        Each pool's weighted votes are divided by its voter count, neutralizing crowd-size advantage.
      </p>
    </div>
  );
}
