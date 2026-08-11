import { useMemo } from 'react';
import { TileType, PathCoord, Player } from '../types';
import { WIN_STEP } from '../utils/gameLogic';
import { TILE_STYLE } from './tileStyles';

interface GameBoardProps {
  boardMap: TileType[];
  pathCoords: PathCoord[];
  players: Player[];
  currentTurn: number;
}

const CELL = 100; // 7×7，每格 100 用户单位，viewBox 700×700

// 每种格子的渐变在 <defs> 中定义一次，49 格复用
function BoardDefs() {
  return (
    <defs>
      <linearGradient id="tile-blank" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#24242B" /><stop offset="100%" stopColor="#1A1A21" />
      </linearGradient>
      <linearGradient id="tile-lucky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF4D6E" /><stop offset="100%" stopColor="#C81E50" />
      </linearGradient>
      <linearGradient id="tile-trap" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C86BFA" /><stop offset="100%" stopColor="#8A2FD0" />
      </linearGradient>
      <linearGradient id="tile-forward" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2E97FF" /><stop offset="100%" stopColor="#0A64C8" />
      </linearGradient>
      <linearGradient id="tile-backward" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4A4A54" /><stop offset="100%" stopColor="#2E2E38" />
      </linearGradient>
      <linearGradient id="tile-extra" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3ED968" /><stop offset="100%" stopColor="#1E9E46" />
      </linearGradient>
      <linearGradient id="tile-duo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFC53D" /><stop offset="100%" stopColor="#F08C00" />
      </linearGradient>
      <linearGradient id="tile-swap" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#B478FF" /><stop offset="100%" stopColor="#6E3FD8" />
      </linearGradient>
      <linearGradient id="tile-jump" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6FD6FF" /><stop offset="100%" stopColor="#2FA3D8" />
      </linearGradient>
      <linearGradient id="tile-vortex" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7A78F0" /><stop offset="100%" stopColor="#4A48C8" />
      </linearGradient>
      <linearGradient id="tile-shield" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3ED968" /><stop offset="100%" stopColor="#1E8E60" />
      </linearGradient>
      <linearGradient id="tile-sync" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFD60A" /><stop offset="100%" stopColor="#FF9F0A" />
      </linearGradient>
      <linearGradient id="tile-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE066" /><stop offset="100%" stopColor="#FF9F0A" />
      </linearGradient>
      <radialGradient id="token-m" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#5EB2FF" /><stop offset="100%" stopColor="#0A58C8" />
      </radialGradient>
      <radialGradient id="token-f" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#FF7A96" /><stop offset="100%" stopColor="#D81E4E" />
      </radialGradient>
      <filter id="token-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.45" />
      </filter>
      <filter id="gold-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFD60A" floodOpacity="0.55" />
      </filter>
    </defs>
  );
}

export function GameBoard({ boardMap, pathCoords, players, currentTurn }: GameBoardProps) {
  const coordToIndex = useMemo(() => {
    const map: Record<string, number> = {};
    pathCoords.forEach((coord, idx) => {
      map[`${coord.r},${coord.c}`] = idx;
    });
    return map;
  }, [pathCoords]);

  // 蛇形路径引导珠点：画在格子下层，从格间缝隙透出，标示行进路线
  const guidePoints = useMemo(
    () => pathCoords.map(p => `${p.c * CELL + 50},${p.r * CELL + 50}`).join(' '),
    [pathCoords]
  );

  const renderTile = (r: number, c: number) => {
    const idx = coordToIndex[`${r},${c}`];
    const type: TileType = (idx !== undefined ? boardMap[idx] : undefined) ?? 'blank';
    const x = c * CELL + 5;
    const y = r * CELL + 5;
    const cx = c * CELL + 50;
    const cy = r * CELL + 50;
    const isStart = idx === 0;
    const isEnd = idx === WIN_STEP;
    const style = TILE_STYLE[type];
    const Icon = style.Icon;

    if (isStart) {
      return (
        <g key={`${r}-${c}`}>
          <rect x={x} y={y} width={90} height={90} rx={20}
            fill="url(#tile-blank)" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight={700}
            fill="#9A9AA4" letterSpacing={1}>START</text>
        </g>
      );
    }

    if (isEnd) {
      return (
        <g key={`${r}-${c}`} filter="url(#gold-glow)">
          <rect x={x} y={y} width={90} height={90} rx={20} fill="url(#tile-gold)" />
          <g transform={`translate(${cx} ${cy})`} fill="#7A3C00">
            <path d="M-11 -16 h22 v8 a11 11 0 0 1 -22 0 Z" />
            <path d="M-11 -14 h-6 a8.5 8.5 0 0 0 8.5 8.5 M11 -14 h6 a8.5 8.5 0 0 1 -8.5 8.5"
              fill="none" stroke="#7A3C00" strokeWidth={3} />
            <rect x={-2.5} y={-3} width={5} height={8} />
            <path d="M-9 11 h18 l-3 -6 h-12 Z" />
          </g>
        </g>
      );
    }

    return (
      <g key={`${r}-${c}`}>
        <rect x={x} y={y} width={90} height={90} rx={20} fill={`url(#tile-${type})`} />
        {Icon && (
          <Icon x={cx - 19} y={cy - 19} width={38} height={38} color={style.iconColor} />
        )}
      </g>
    );
  };

  // 棋盘一局内不变：格子网格按 boardMap 缓存，棋子独立渲染
  const tiles = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 7 }).map((_, c) => renderTile(r, c))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardMap, coordToIndex]
  );

  return (
    <div className="relative w-full aspect-square">
      <svg viewBox="0 0 700 700" className="w-full h-full" role="img" aria-label="游戏棋盘">
        <BoardDefs />

        {/* 路径引导珠点（格间透出） */}
        <polyline
          points={guidePoints}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.12}
          strokeWidth={7}
          strokeDasharray="0.1 16"
          strokeLinecap="round"
        />

        {tiles}

        {/* 棋子层：CSS transform 过渡实现平滑走格 */}
        {players.map(player => {
          const coord = pathCoords[player.step];
          if (!coord) return null;
          const playersOnSameTile = players.filter(p => p.step === player.step);
          const isOverlapping = playersOnSameTile.length > 1;
          const indexOnTile = playersOnSameTile.findIndex(p => p.id === player.id);
          const offset = isOverlapping ? (indexOnTile === 0 ? -13 : 13) : 0;
          const isActive = player.id === currentTurn;
          const cx = coord.c * CELL + 50 + offset;
          const cy = coord.r * CELL + 50 + offset;

          return (
            <g
              key={player.id}
              style={{
                transform: `translate(${cx}px, ${cy}px)`,
                transition: 'transform 220ms ease',
              }}
            >
              {/* 护盾：旋转虚线光环 */}
              {player.shield && (
                <circle r={31} fill="none" stroke="#64D2FF" strokeWidth={3.5}
                  strokeDasharray="26 169" strokeLinecap="round" opacity={0.9}>
                  <animateTransform attributeName="transform" type="rotate"
                    from="0" to="360" dur="3.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r={22}
                fill={player.id === 0 ? 'url(#token-m)' : 'url(#token-f)'}
                stroke={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isActive ? 3.5 : 2}
                filter="url(#token-shadow)"
              />
              {/* 球体高光 */}
              <ellipse cx={-6} cy={-9} rx={7} ry={4.5} fill="#FFFFFF" opacity={0.5} />
              <text y={7.5} textAnchor="middle" fontSize={20} fontWeight={700} fill="#FFFFFF">
                {player.id === 0 ? '♂' : '♀'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
