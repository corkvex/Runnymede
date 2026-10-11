/**
 * Chess-style Elo Rating System for competitive debate rankings.
 *
 * Mirrors FIDE's structure:
 *   - Provisional (first 10 games): K=40
 *   - Established (<2200): K=24
 *   - Master+ (>=2200): K=16
 *
 * Expected score uses the standard logistic curve:
 *   E_A = 1 / (1 + 10^((R_B - R_A)/400))
 *
 * New rating: R'_A = R_A + K * (S_A - E_A)
 *
 * Performance rating (used for provisional period):
 *   Rp = Rc + dp  where dp = -400*log10(1/(score)-1) and Rc = avg opponent rating
 */

export type RankTier = 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' | 'Grandmaster';

export interface RankInfo {
  tier: RankTier;
  elo: number;
  color: string;
  icon: string;
  provisional: boolean;
  rangeMin: number;
  rangeMax: number;
}

const RANK_THRESHOLDS: { tier: RankTier; min: number; max: number; color: string; icon: string }[] = [
  { tier: 'Novice', min: 0, max: 1199, color: '#9ca3af', icon: 'shield' },
  { tier: 'Intermediate', min: 1200, max: 1599, color: '#10b981', icon: 'shield' },
  { tier: 'Advanced', min: 1600, max: 1999, color: '#eab308', icon: 'crown' },
  { tier: 'Expert', min: 2000, max: 2199, color: '#f97316', icon: 'gem' },
  { tier: 'Master', min: 2200, max: 2499, color: '#a855f7', icon: 'king' },
  { tier: 'Grandmaster', min: 2500, max: 9999, color: '#171717', icon: 'king' },
];

export const PROVISIONAL_GAMES = 10;
export const STARTING_ELO = 1000;

export function getKFactor(elo: number, gamesPlayed: number): number {
  if (gamesPlayed < PROVISIONAL_GAMES) return 40;
  if (elo < 2200) return 24;
  return 16;
}

export function calcExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calcNewElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  gamesPlayedA: number,
): number {
  const expected = calcExpectedScore(ratingA, ratingB);
  const k = getKFactor(ratingA, gamesPlayedA);
  return Math.round(ratingA + k * (scoreA - expected));
}

/**
 * Performance rating — FIDE-style. Used during the provisional period
 * to give a better estimate than just raw game outcomes.
 *   Rp = Rc + dp
 * where dp comes from the FIDE table approximation:
 *   dp = -400 * log10(1/score - 1)   (clamped to [-800, 800])
 */
export function calcPerformanceRating(
  opponentRatings: number[],
  scores: number[],
): number {
  if (opponentRatings.length === 0) return STARTING_ELO;
  const avgOpp = opponentRatings.reduce((a, b) => a + b, 0) / opponentRatings.length;
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalGames = scores.length;
  const scorePct = totalScore / totalGames;

  if (scorePct <= 0) return Math.round(avgOpp - 800);
  if (scorePct >= 1) return Math.round(avgOpp + 800);

  const dp = -400 * Math.log10(1 / scorePct - 1);
  const clampedDp = Math.max(-800, Math.min(800, dp));
  return Math.round(avgOpp + clampedDp);
}

export function getRankFromElo(elo: number, gamesPlayed = 0): RankInfo {
  const provisional = gamesPlayed < PROVISIONAL_GAMES;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (elo >= RANK_THRESHOLDS[i].min) {
      const r = RANK_THRESHOLDS[i];
      return { tier: r.tier, elo, color: r.color, icon: r.icon, provisional, rangeMin: r.min, rangeMax: r.max };
    }
  }
  const r = RANK_THRESHOLDS[0];
  return { tier: r.tier, elo, color: r.color, icon: r.icon, provisional, rangeMin: r.min, rangeMax: r.max };
}

export interface DebateResult {
  winnerId: string;
  loserId: string;
  winnerOldElo: number;
  loserOldElo: number;
  winnerNewElo: number;
  loserNewElo: number;
  winnerRankBefore: RankInfo;
  winnerRankAfter: RankInfo;
  loserRankBefore: RankInfo;
  loserRankAfter: RankInfo;
  expectedScore: number;
  kFactorWinner: number;
  kFactorLoser: number;
  eloChange: number;
}

export function processDebateResult(
  winnerId: string,
  loserId: string,
  winnerElo: number,
  loserElo: number,
  winnerGamesPlayed = PROVISIONAL_GAMES,
  loserGamesPlayed = PROVISIONAL_GAMES,
): DebateResult {
  const expected = calcExpectedScore(winnerElo, loserElo);
  const winnerNewElo = calcNewElo(winnerElo, loserElo, 1, winnerGamesPlayed);
  const loserNewElo = calcNewElo(loserElo, winnerElo, 0, loserGamesPlayed);
  const eloChange = winnerNewElo - winnerElo;

  return {
    winnerId,
    loserId,
    winnerOldElo: winnerElo,
    loserOldElo: loserElo,
    winnerNewElo,
    loserNewElo,
    winnerRankBefore: getRankFromElo(winnerElo, winnerGamesPlayed),
    winnerRankAfter: getRankFromElo(winnerNewElo, winnerGamesPlayed + 1),
    loserRankBefore: getRankFromElo(loserElo, loserGamesPlayed),
    loserRankAfter: getRankFromElo(loserNewElo, loserGamesPlayed + 1),
    expectedScore: expected,
    kFactorWinner: getKFactor(winnerElo, winnerGamesPlayed),
    kFactorLoser: getKFactor(loserElo, loserGamesPlayed),
    eloChange,
  };
}
