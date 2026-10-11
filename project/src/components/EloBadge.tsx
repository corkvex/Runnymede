import { getRankFromElo } from '@/lib/elo';
import type { RankInfo } from '@/lib/elo';

interface EloBadgeProps {
  elo: number;
  size?: 'sm' | 'md' | 'lg';
  showElo?: boolean;
}

function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.15;
}

export default function EloBadge({ elo, size = 'md', showElo = true }: EloBadgeProps) {
  const rank: RankInfo = getRankFromElo(elo);
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const dark = isColorDark(rank.color);
  const textColor = dark ? '#f3f4f6' : rank.color;
  const borderColor = dark ? '#404040' : `${rank.color}40`;
  const bgColor = dark ? '#1c1c1c' : `${rank.color}15`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizes[size]}`}
      style={{
        color: textColor,
        borderColor,
        backgroundColor: bgColor,
      }}
    >
      <span>{rank.tier}</span>
      {showElo && <span className="opacity-70">{elo}</span>}
    </span>
  );
}
