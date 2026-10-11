import type { StoredPositionVote, StoredSpectrumPosition } from '@/lib/storage';

export type PoolLabel = 'left' | 'centrist' | 'right';

export interface VoterBaseline {
  voterId: string;
  averagePosition: number; // -100 to 100, averaged across all debates
  biasScore: number; // 0 (centrist) to 1 (extremely polarized)
  pool: PoolLabel;
}

export interface PoolResult {
  pool: PoolLabel;
  voterCount: number;
  rawVotes: number;
  weightedTotal: number;
  equalizedScore: number;
  proVotes: number;
  conVotes: number;
  neutralVotes: number;
}

export interface WeightedVerdict {
  leftPool: PoolResult;
  centristPool: PoolResult;
  rightPool: PoolResult;
  proScore: number;
  conScore: number;
  winner: 'pro' | 'con' | 'tie';
  totalVoters: number;
  totalVotes: number;
  centristBreaker: 'pro' | 'con' | 'tie';
}

const POOL_THRESHOLDS = { left: -25, right: 25 };

export function classifyPool(averagePosition: number): PoolLabel {
  if (averagePosition < POOL_THRESHOLDS.left) return 'left';
  if (averagePosition > POOL_THRESHOLDS.right) return 'right';
  return 'centrist';
}

export function computeBiasScore(averagePosition: number): number {
  return Math.min(1, Math.abs(averagePosition) / 100);
}

export function computeIndividualWeight(biasScore: number): number {
  return 1 - biasScore * 0.9;
}

export function computeVoterBaselines(
  spectrumHistory: StoredSpectrumPosition[],
): Map<string, VoterBaseline> {
  const byVoter = new Map<string, number[]>();
  for (const s of spectrumHistory) {
    const arr = byVoter.get(s.voterId) || [];
    arr.push(s.position);
    byVoter.set(s.voterId, arr);
  }

  const baselines = new Map<string, VoterBaseline>();
  for (const [voterId, positions] of byVoter) {
    const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
    const bias = computeBiasScore(avg);
    const pool = classifyPool(avg);
    baselines.set(voterId, { voterId, averagePosition: avg, biasScore: bias, pool });
  }
  return baselines;
}

export function computeWeightedVerdict(
  positionVotes: StoredPositionVote[],
  baselines: Map<string, VoterBaseline>,
): WeightedVerdict {
  const emptyPool = (pool: PoolLabel): PoolResult => ({
    pool, voterCount: 0, rawVotes: 0, weightedTotal: 0, equalizedScore: 0,
    proVotes: 0, conVotes: 0, neutralVotes: 0,
  });

  const pools: Record<PoolLabel, PoolResult> = {
    left: emptyPool('left'),
    centrist: emptyPool('centrist'),
    right: emptyPool('right'),
  };

  const seenVoters = new Set<string>();

  for (const vote of positionVotes) {
    const baseline = baselines.get(vote.voterId);
    const pool = baseline?.pool || 'centrist';
    const biasScore = baseline?.biasScore ?? 0;
    const weight = computeIndividualWeight(biasScore);

    const p = pools[pool];
    if (vote.lean === 'pro') p.proVotes++;
    else if (vote.lean === 'con') p.conVotes++;
    else p.neutralVotes++;

    p.rawVotes++;
    if (vote.lean === 'pro') p.weightedTotal += weight;
    else if (vote.lean === 'con') p.weightedTotal -= weight;

    if (!seenVoters.has(vote.voterId)) {
      seenVoters.add(vote.voterId);
      pools[pool].voterCount++;
    }
  }

  for (const pool of Object.values(pools)) {
    pool.equalizedScore = pool.voterCount > 0 ? pool.weightedTotal / pool.voterCount : 0;
  }

  const proScore = pools.left.equalizedScore + pools.centrist.equalizedScore + pools.right.equalizedScore;

  const conScoreAbs = Math.abs(pools.left.equalizedScore) + Math.abs(pools.centrist.equalizedScore) + Math.abs(pools.right.equalizedScore);
  const conScore = -conScoreAbs;

  let winner: 'pro' | 'con' | 'tie' = 'tie';
  if (proScore > Math.abs(conScore)) winner = 'pro';
  else if (Math.abs(conScore) > proScore) winner = 'con';

  const centristBreaker: 'pro' | 'con' | 'tie' =
    pools.centrist.equalizedScore > 0.01 ? 'pro'
    : pools.centrist.equalizedScore < -0.01 ? 'con'
    : 'tie';

  if (winner === 'tie' && centristBreaker !== 'tie') {
    winner = centristBreaker;
  }

  return {
    leftPool: pools.left,
    centristPool: pools.centrist,
    rightPool: pools.right,
    proScore,
    conScore,
    winner,
    totalVoters: seenVoters.size,
    totalVotes: positionVotes.length,
    centristBreaker,
  };
}

export function getMyPoolInfo(voterId: string, baselines: Map<string, VoterBaseline>): { pool: PoolLabel; weight: number; biasScore: number } | null {
  const b = baselines.get(voterId);
  if (!b) return null;
  return { pool: b.pool, weight: computeIndividualWeight(b.biasScore), biasScore: b.biasScore };
}
