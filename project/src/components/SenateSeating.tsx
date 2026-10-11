import { useEffect, useState } from 'react';
import type { StoredProfile } from '@/lib/storage';
import type { VoterLean } from '@/lib/storage';

interface SenateSeatingProps {
  voterLeans: VoterLean[];
  profiles: Record<string, StoredProfile>;
  currentVoterId?: string;
}

type Lean = 'pro' | 'con' | 'neutral';

interface SeatedVoter {
  voterId: string;
  profile?: StoredProfile;
  lean: Lean;
  proVotes: number;
  conVotes: number;
  totalVotes: number;
}

const MOCK_SENATORS: { id: string; handle: string; lean: Lean; delay: number; elo: number }[] = [
  { id: 'mock-1', handle: '@seneca', lean: 'pro', delay: 300, elo: 1850 },
  { id: 'mock-2', handle: '@cicero', lean: 'pro', delay: 600, elo: 2100 },
  { id: 'mock-3', handle: '@cato', lean: 'con', delay: 450, elo: 1650 },
  { id: 'mock-4', handle: '@brutus', lean: 'con', delay: 750, elo: 1400 },
  { id: 'mock-5', handle: '@antony', lean: 'pro', delay: 900, elo: 1200 },
  { id: 'mock-6', handle: '@cassius', lean: 'con', delay: 1050, elo: 1950 },
  { id: 'mock-7', handle: '@augustus', lean: 'pro', delay: 1200, elo: 2400 },
  { id: 'mock-8', handle: '@livy', lean: 'con', delay: 1350, elo: 1100 },
  { id: 'mock-9', handle: '@pliny', lean: 'neutral', delay: 500, elo: 1550 },
  { id: 'mock-10', handle: '@ovid', lean: 'neutral', delay: 850, elo: 1300 },
  { id: 'mock-11', handle: '@tacitus', lean: 'neutral', delay: 1100, elo: 1750 },
  { id: 'mock-12', handle: '@sulla', lean: 'pro', delay: 250, elo: 1480 },
  { id: 'mock-13', handle: '@romulus', lean: 'pro', delay: 400, elo: 1620 },
  { id: 'mock-14', handle: '@hadrian', lean: 'pro', delay: 550, elo: 1780 },
  { id: 'mock-15', handle: '@marcus', lean: 'pro', delay: 700, elo: 1340 },
  { id: 'mock-16', handle: '@nero', lean: 'pro', delay: 850, elo: 1190 },
  { id: 'mock-17', handle: '@vespasian', lean: 'pro', delay: 1000, elo: 1540 },
  { id: 'mock-18', handle: '@titus', lean: 'pro', delay: 1150, elo: 1280 },
  { id: 'mock-19', handle: '@cassia', lean: 'con', delay: 350, elo: 1710 },
  { id: 'mock-20', handle: '@clodius', lean: 'con', delay: 500, elo: 1460 },
  { id: 'mock-21', handle: '@drusus', lean: 'con', delay: 650, elo: 1810 },
  { id: 'mock-22', handle: '@galba', lean: 'con', delay: 800, elo: 1260 },
  { id: 'mock-23', handle: '@marius', lean: 'con', delay: 950, elo: 1580 },
  { id: 'mock-24', handle: '@pompey', lean: 'con', delay: 1100, elo: 1880 },
  { id: 'mock-25', handle: '@sabina', lean: 'con', delay: 1250, elo: 1370 },
  { id: 'mock-26', handle: '@agrippa', lean: 'neutral', delay: 300, elo: 1490 },
  { id: 'mock-27', handle: '@calvus', lean: 'neutral', delay: 450, elo: 1320 },
  { id: 'mock-28', handle: '@horace', lean: 'neutral', delay: 600, elo: 1680 },
  { id: 'mock-29', handle: '@metellus', lean: 'neutral', delay: 750, elo: 1410 },
  { id: 'mock-30', handle: '@naevia', lean: 'neutral', delay: 900, elo: 1560 },
  { id: 'mock-31', handle: '@sabinus', lean: 'neutral', delay: 1050, elo: 1270 },
  { id: 'mock-32', handle: '@verus', lean: 'neutral', delay: 1200, elo: 1740 },
  { id: 'mock-33', handle: '@fabius', lean: 'pro', delay: 300, elo: 1430 },
  { id: 'mock-34', handle: '@flaccus', lean: 'pro', delay: 430, elo: 1510 },
  { id: 'mock-35', handle: '@gaius', lean: 'pro', delay: 560, elo: 1660 },
  { id: 'mock-36', handle: '@laelius', lean: 'pro', delay: 690, elo: 1390 },
  { id: 'mock-37', handle: '@longinus', lean: 'pro', delay: 820, elo: 1580 },
  { id: 'mock-38', handle: '@maximus', lean: 'pro', delay: 950, elo: 1470 },
  { id: 'mock-39', handle: '@paulus', lean: 'pro', delay: 1080, elo: 1730 },
  { id: 'mock-40', handle: '@regulus', lean: 'con', delay: 360, elo: 1610 },
  { id: 'mock-41', handle: '@scaevola', lean: 'con', delay: 490, elo: 1340 },
  { id: 'mock-42', handle: '@senecio', lean: 'con', delay: 620, elo: 1550 },
  { id: 'mock-43', handle: '@stilo', lean: 'con', delay: 750, elo: 1420 },
  { id: 'mock-44', handle: '@varro', lean: 'con', delay: 880, elo: 1790 },
  { id: 'mock-45', handle: '@vibius', lean: 'con', delay: 1010, elo: 1290 },
  { id: 'mock-46', handle: '@vitruvius', lean: 'con', delay: 1140, elo: 1680 },
  { id: 'mock-47', handle: '@antonia', lean: 'neutral', delay: 320, elo: 1520 },
  { id: 'mock-48', handle: '@balbus', lean: 'neutral', delay: 460, elo: 1360 },
  { id: 'mock-49', handle: '@cotta', lean: 'neutral', delay: 600, elo: 1640 },
  { id: 'mock-50', handle: '@fausta', lean: 'neutral', delay: 740, elo: 1450 },
  { id: 'mock-51', handle: '@lucilla', lean: 'neutral', delay: 880, elo: 1570 },
  { id: 'mock-52', handle: '@sabellus', lean: 'neutral', delay: 1020, elo: 1310 },
  { id: 'mock-53', handle: '@acilius', lean: 'pro', delay: 280, elo: 1480 },
  { id: 'mock-54', handle: '@bellius', lean: 'pro', delay: 410, elo: 1590 },
  { id: 'mock-55', handle: '@curtius', lean: 'pro', delay: 540, elo: 1370 },
  { id: 'mock-56', handle: '@domitius', lean: 'pro', delay: 670, elo: 1710 },
  { id: 'mock-57', handle: '@eutropius', lean: 'pro', delay: 800, elo: 1460 },
  { id: 'mock-58', handle: '@fulvius', lean: 'pro', delay: 930, elo: 1630 },
  { id: 'mock-59', handle: '@gordian', lean: 'pro', delay: 1060, elo: 1520 },
  { id: 'mock-60', handle: '@hostilius', lean: 'pro', delay: 1190, elo: 1340 },
  { id: 'mock-61', handle: '@ismarus', lean: 'con', delay: 330, elo: 1560 },
  { id: 'mock-62', handle: '@junius', lean: 'con', delay: 460, elo: 1440 },
  { id: 'mock-63', handle: '@licinius', lean: 'con', delay: 590, elo: 1690 },
  { id: 'mock-64', handle: '@manlius', lean: 'con', delay: 720, elo: 1320 },
  { id: 'mock-65', handle: '@numicius', lean: 'con', delay: 850, elo: 1770 },
  { id: 'mock-66', handle: '@octavius', lean: 'con', delay: 980, elo: 1490 },
  { id: 'mock-67', handle: '@quintus', lean: 'con', delay: 1110, elo: 1610 },
  { id: 'mock-68', handle: '@rufus', lean: 'con', delay: 1240, elo: 1380 },
  { id: 'mock-69', handle: '@aelia', lean: 'neutral', delay: 300, elo: 1500 },
  { id: 'mock-70', handle: '@barea', lean: 'neutral', delay: 440, elo: 1420 },
  { id: 'mock-71', handle: '@cassiana', lean: 'neutral', delay: 580, elo: 1670 },
  { id: 'mock-72', handle: '@denter', lean: 'neutral', delay: 720, elo: 1350 },
  { id: 'mock-73', handle: '@ennius', lean: 'neutral', delay: 860, elo: 1540 },
  { id: 'mock-74', handle: '@galla', lean: 'neutral', delay: 1000, elo: 1460 },
  { id: 'mock-75', handle: '@hortensia', lean: 'neutral', delay: 1140, elo: 1720 },
  { id: 'mock-76', handle: '@valeria', lean: 'neutral', delay: 1280, elo: 1390 },
  { id: 'mock-77', handle: '@albinus', lean: 'pro', delay: 300, elo: 1440 },
  { id: 'mock-78', handle: '@calpurnia', lean: 'pro', delay: 430, elo: 1570 },
  { id: 'mock-79', handle: '@decius', lean: 'pro', delay: 560, elo: 1490 },
  { id: 'mock-80', handle: '@furius', lean: 'pro', delay: 690, elo: 1660 },
  { id: 'mock-81', handle: '@herminius', lean: 'pro', delay: 820, elo: 1380 },
  { id: 'mock-82', handle: '@ius', lean: 'pro', delay: 950, elo: 1530 },
  { id: 'mock-83', handle: '@lutatius', lean: 'pro', delay: 1080, elo: 1710 },
  { id: 'mock-84', handle: '@maecenas', lean: 'pro', delay: 1210, elo: 1470 },
  { id: 'mock-85', handle: '@neratius', lean: 'pro', delay: 1340, elo: 1590 },
  { id: 'mock-86', handle: '@oppius', lean: 'pro', delay: 1470, elo: 1320 },
  { id: 'mock-87', handle: '@apicius', lean: 'con', delay: 340, elo: 1550 },
  { id: 'mock-88', handle: '@bithynicus', lean: 'con', delay: 470, elo: 1420 },
  { id: 'mock-89', handle: '@corvinus', lean: 'con', delay: 600, elo: 1680 },
  { id: 'mock-90', handle: '@didius', lean: 'con', delay: 730, elo: 1360 },
  { id: 'mock-91', handle: '@fabricius', lean: 'con', delay: 860, elo: 1770 },
  { id: 'mock-92', handle: '@gracchus', lean: 'con', delay: 990, elo: 1510 },
  { id: 'mock-93', handle: '@helius', lean: 'con', delay: 1120, elo: 1630 },
  { id: 'mock-94', handle: '@isolus', lean: 'con', delay: 1250, elo: 1390 },
  { id: 'mock-95', handle: '@juvenalis', lean: 'con', delay: 1380, elo: 1580 },
  { id: 'mock-96', handle: '@livia', lean: 'con', delay: 1510, elo: 1460 },
  { id: 'mock-97', handle: '@amulius', lean: 'neutral', delay: 320, elo: 1500 },
  { id: 'mock-98', handle: '@cassian', lean: 'neutral', delay: 460, elo: 1410 },
  { id: 'mock-99', handle: '@dracontius', lean: 'neutral', delay: 600, elo: 1650 },
  { id: 'mock-100', handle: '@elegia', lean: 'neutral', delay: 740, elo: 1340 },
  { id: 'mock-101', handle: '@fronto', lean: 'neutral', delay: 880, elo: 1560 },
  { id: 'mock-102', handle: '@ianus', lean: 'neutral', delay: 1020, elo: 1470 },
  { id: 'mock-103', handle: '@lucretia', lean: 'neutral', delay: 1160, elo: 1720 },
  { id: 'mock-104', handle: '@marcellus', lean: 'neutral', delay: 1300, elo: 1390 },
  { id: 'mock-105', handle: '@octavia', lean: 'neutral', delay: 1440, elo: 1610 },
  { id: 'mock-106', handle: '@priscus', lean: 'neutral', delay: 1580, elo: 1450 },
];

// U-shaped senate bowl — its lowest point stays at the bottom of the gallery.
// The outer row reaches both edges while the center third remains visibly grey.
const ARC_CENTER_X = 200;
const ARC_CENTER_Y = 68;
const ARC_RADII = [60, 108, 156, 205];
const ARC_ANGLE_SPAN = 72;
const ZONE_GAP = 18;

// Fixed seat slots per row per zone — total slots that *could* be filled
const SLOTS_PER_ROW: Record<Lean, number[]> = {
  pro: [9, 11, 13, 15],
  con: [9, 11, 13, 15],
  neutral: [6, 8, 10, 12],
};

function polarToXY(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: ARC_CENTER_X + Math.sin(rad) * radius,
    y: ARC_CENTER_Y + Math.cos(rad) * radius, // bowl drops toward the bottom center
  };
}

interface PlacedSeat {
  voter: SeatedVoter | null; // null = blacked-out empty seat
  x: number;
  y: number;
  row: number;
  lean: Lean;
  slotIdx: number;
}

function placeZoneSeats(
  voters: SeatedVoter[],
  lean: Lean,
  angleStart: number,
  angleEnd: number,
): PlacedSeat[] {
  const placed: PlacedSeat[] = [];
  const sorted = [...voters].sort((a, b) => b.totalVotes - a.totalVotes);
  let voterIdx = 0;

  SLOTS_PER_ROW[lean].forEach((slotCount, rowIdx) => {
    const radius = ARC_RADII[rowIdx];
    const span = angleEnd - angleStart;
    const step = slotCount > 1 ? span / (slotCount - 1) : 0;

    for (let s = 0; s < slotCount; s++) {
      const angle = slotCount === 1 ? (angleStart + angleEnd) / 2 : angleStart + s * step;
      const { x, y } = polarToXY(radius, angle);
      const voter = voterIdx < sorted.length ? sorted[voterIdx++] : null;
      placed.push({ voter, x, y, row: rowIdx, lean, slotIdx: s });
    }
  });

  return placed;
}

export default function SenateSeating({ voterLeans, profiles, currentVoterId }: SenateSeatingProps) {
  const [mountedSeats, setMountedSeats] = useState<Set<string>>(new Set());

  const proVoters: SeatedVoter[] = [];
  const conVoters: SeatedVoter[] = [];
  const neutralVoters: SeatedVoter[] = [];

  for (const v of voterLeans) {
    const seated: SeatedVoter = {
      voterId: v.voterId,
      profile: profiles[v.voterId],
      lean: v.lean,
      proVotes: v.proVotes,
      conVotes: v.conVotes,
      totalVotes: v.proVotes + v.conVotes,
    };
    if (v.lean === 'pro') proVoters.push(seated);
    else if (v.lean === 'con') conVoters.push(seated);
    else neutralVoters.push(seated);
  }

  for (const m of MOCK_SENATORS) {
    const seated: SeatedVoter = {
      voterId: m.id,
      profile: {
        id: m.id,
        handle: m.handle,
        publicKey: '',
        elo: m.elo,
        debatesWon: 0,
        debatesLost: 0,
        bio: '',
        avatarSeed: '',
        createdAt: 0,
      },
      lean: m.lean,
      proVotes: m.lean === 'pro' ? 3 : 1,
      conVotes: m.lean === 'con' ? 3 : 1,
      totalVotes: 4,
    };
    if (m.lean === 'pro') proVoters.push(seated);
    else if (m.lean === 'con') conVoters.push(seated);
    else neutralVoters.push(seated);
  }

  const proSeats = placeZoneSeats(proVoters, 'pro', -ARC_ANGLE_SPAN, -ZONE_GAP);
  const conSeats = placeZoneSeats(conVoters, 'con', ZONE_GAP, ARC_ANGLE_SPAN);
  const neutralSeats = placeZoneSeats(neutralVoters, 'neutral', -ZONE_GAP, ZONE_GAP);
  const allSeats = [...proSeats, ...conSeats, ...neutralSeats];

  const occupiedSeats = allSeats.filter((s) => s.voter !== null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    occupiedSeats.forEach(({ voter }) => {
      const mockData = MOCK_SENATORS.find((m) => m.id === voter!.voterId);
      const delay = mockData ? mockData.delay : 200;
      timers.push(
        setTimeout(() => {
          setMountedSeats((prev) => new Set(prev).add(voter!.voterId));
        }, delay),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const totalSeated = proVoters.length + conVoters.length + neutralVoters.length;
  const totalSlots = allSeats.length;
  const emptySlots = totalSlots - totalSeated;

  return (
    <div className="relative" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Section headers */}
      <div className="flex items-center justify-between mb-1 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] tracking-widest text-blue-400/70">PARTES · {proVoters.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-[10px] tracking-widest text-gray-400/60">MVNDVS · {neutralVoters.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest text-red-400/70">{conVoters.length} · CONTRA</span>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>

      {/* Senate bowl — rostrum above, seats curve down toward the bottom */}
      <div className="relative w-full" style={{ height: 320 }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
          {/* Concentric U-shaped floor lines aligned with every seat row */}
          {ARC_RADII.map((r, i) => {
            const opacity = 0.15 - i * 0.04;
            const steps = 24;
            const pts: string[] = [];
            for (let s = 0; s <= steps; s++) {
              const angle = -ARC_ANGLE_SPAN + (2 * ARC_ANGLE_SPAN * s) / steps;
              const { x, y } = polarToXY(r, angle);
              pts.push(`${s === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
            }
            return (
              <path
                key={`arc-${i}`}
                d={pts.join(' ')}
                fill="none"
                stroke={`rgba(180, 83, 9, ${opacity})`}
                strokeWidth={i === 0 ? 1.5 : 1}
              />
            );
          })}

          {/* Radial divider lines between zones */}
          {[-ZONE_GAP, ZONE_GAP].map((angle) => {
            const inner = polarToXY(ARC_RADII[0] - 8, angle);
            const outer = polarToXY(ARC_RADII[3] + 10, angle);
            return (
              <line
                key={`div-${angle}`}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="rgba(160, 160, 160, 0.1)"
                strokeWidth="0.5"
                strokeDasharray="2,3"
              />
            );
          })}

          {/* Radial step lines between rows */}
          {[-ARC_ANGLE_SPAN, -ARC_ANGLE_SPAN / 2, ARC_ANGLE_SPAN / 2, ARC_ANGLE_SPAN].map((angle) => {
            const inner = polarToXY(ARC_RADII[0], angle);
            const outer = polarToXY(ARC_RADII[3], angle);
            return (
              <line
                key={`step-${angle}`}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="rgba(180, 83, 9, 0.04)"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>

        {/* Rostrum above the open center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: 4 }}>
          <div className="w-10 h-10 rounded-lg border border-amber-700/30 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(40,33,20,0.9), rgba(20,16,10,0.9))' }}>
            <span className="text-[7px] text-amber-600/40 tracking-widest">ROSTRA</span>
          </div>
        </div>

        {/* Seats along the arc */}
        <div className="absolute inset-0">
          {allSeats.map(({ voter, x, y, row, lean, slotIdx }) => {
            const leftPct = (x / 400) * 100;
            const topPct = (y / 300) * 100;

            // Blacked-out empty seat
            if (!voter) {
              return (
                <div
                  key={`empty-${lean}-${row}-${slotIdx}`}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Silhouette head */}
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: 22,
                        height: 22,
                        backgroundColor: 'rgba(15, 12, 8, 0.85)',
                        border: '1px solid rgba(60, 50, 35, 0.3)',
                        opacity: 0.72 - row * 0.08,
                        zIndex: 2,
                      }}
                    />
                    {/* Silhouette shoulders */}
                    <div
                      className="rounded-t-md -mt-1.5"
                      style={{
                        width: 20,
                        height: 10,
                        background: 'linear-gradient(135deg, rgba(15,12,8,0.7), rgba(10,8,5,0.7))',
                        opacity: 0.58 - row * 0.06,
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>
              );
            }

            // Occupied seat
            const isMounted = mountedSeats.has(voter.voterId);
            const isYou = voter.voterId === currentVoterId;
            const color = voter.lean === 'neutral' ? '#9ca3af' : voter.lean === 'pro' ? '#3b82f6' : '#ef4444';
            const togaGradient = voter.lean === 'neutral'
              ? 'linear-gradient(135deg, #4b5563, #374151)'
              : voter.lean === 'pro'
              ? 'linear-gradient(135deg, #1e3a5f, #1e2a4f)'
              : 'linear-gradient(135deg, #5f1e2a, #4f1e2a)';

            return (
              <div
                key={`${voter.voterId}-${row}`}
                className="absolute flex flex-col items-center transition-all duration-700"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: `translate(-50%, -50%) scale(${isMounted ? 1 : 0})`,
                  opacity: isMounted ? 1 : 0,
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Head */}
                  <div
                    className="rounded-full flex items-center justify-center text-white text-[8px] font-bold relative transition-all"
                    style={{
                      width: isYou ? 28 : 22,
                      height: isYou ? 28 : 22,
                      backgroundColor: color,
                      opacity: 0.65 + (row === 0 ? 0.3 : 0.2 - row * 0.06),
                      boxShadow: isYou ? `0 0 8px ${color}` : 'none',
                      border: isYou ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                      zIndex: 2,
                    }}
                    title={`${voter.profile?.handle || voter.voterId} — ${voter.proVotes}P / ${voter.conVotes}C`}
                  >
                    {voter.profile?.handle.substring(1, 3).toUpperCase() || '?'}
                  </div>
                  {/* Toga shoulders */}
                  <div
                    className="rounded-t-md -mt-1.5 transition-all"
                    style={{
                      width: isYou ? 24 : 20,
                      height: 10,
                      background: togaGradient,
                      opacity: 0.45 + (row === 0 ? 0.25 : 0.15 - row * 0.04),
                      zIndex: 1,
                    }}
                  />
                </div>
                {isYou && (
                  <span className="text-[7px] text-amber-400 mt-0.5 whitespace-nowrap">You</span>
                )}
                {!isYou && voter.profile && (
                  <span className="text-[6px] mt-0.5 whitespace-nowrap hidden md:block"
                    style={{ color: voter.lean === 'neutral' ? 'rgba(156,163,175,0.3)' : 'rgba(147,197,253,0.2)' }}>
                    {voter.profile.handle.length > 8 ? voter.profile.handle.substring(0, 8) : voter.profile.handle}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty seat count */}
      {emptySlots > 0 && (
        <div className="text-center mt-1">
          <span className="text-[9px] text-gray-600/40 tracking-wider">{emptySlots} seats awaiting senators</span>
        </div>
      )}

      {totalSeated === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-amber-700/40">The galleries stand empty. Votes will seat the senators.</p>
        </div>
      )}
    </div>
  );
}
