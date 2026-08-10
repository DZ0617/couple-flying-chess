import { TileType, PathCoord, Player } from '../types';
import { WIN_STEP } from '../utils/gameLogic';
import { Trophy, User, UserRound, Shield } from 'lucide-react';
import { TILE_STYLE } from './tileStyles';
import { useMemo } from 'react';

interface GameBoardProps {
  boardMap: TileType[];
  pathCoords: PathCoord[];
  players: Player[];
  currentTurn: number;
}

export function GameBoard({ boardMap, pathCoords, players, currentTurn }: GameBoardProps) {
  const coordToIndex: Record<string, number> = {};
  pathCoords.forEach((coord, idx) => {
    coordToIndex[`${coord.r},${coord.c}`] = idx;
  });

  const renderTile = (r: number, c: number) => {
    const idx = coordToIndex[`${r},${c}`];
    const type: TileType = boardMap[idx] ?? 'blank';
    const isStart = idx === 0;
    const isEnd = idx === WIN_STEP;
    const style = TILE_STYLE[type];

    let className =
      'relative w-full h-full rounded-xl flex items-center justify-center transition-colors duration-300 ';
    if (isStart) className += 'bg-white/10 border border-white/20';
    else if (isEnd) className += 'bg-white shadow-lg shadow-white/20';
    else className += style.className;

    const Icon = style.Icon;
    return (
      <div key={`${r}-${c}`} className="aspect-square">
        <div className={className}>
          {isStart && <span className="text-[8px] text-white/60 font-medium">START</span>}
          {isEnd && <Trophy className="w-4 h-4 text-yellow-500" />}
          {!isStart && !isEnd && Icon && <Icon className="w-4 h-4 text-white/70" />}
        </div>
      </div>
    );
  };

  // 棋盘一局内不变：格子网格按 boardMap 缓存，棋子覆盖层独立渲染
  const tiles = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 7 }).map((_, c) => renderTile(r, c))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardMap]
  );

  return (
    <div className="relative w-full aspect-square">
      <div className="grid grid-cols-7 grid-rows-7 gap-1 w-full h-full">
        {tiles}
      </div>

      {players.map(player => {
        const coord = pathCoords[player.step];
        if (!coord) return null;
        const playersOnSameTile = players.filter(p => p.step === player.step);
        const isOverlapping = playersOnSameTile.length > 1;
        const indexOnTile = playersOnSameTile.findIndex(p => p.id === player.id);
        const offset = isOverlapping ? (indexOnTile === 0 ? -5 : 5) : 0;
        const isActive = player.id === currentTurn;
        const isMale = player.id === 0;
        return (
          <div
            key={player.id}
            className="absolute w-7 h-7 transition-all duration-200 z-10 pointer-events-none"
            style={{
              left: `calc(${((coord.c + 0.5) / 7) * 100}% - 14px + ${offset}px)`,
              top: `calc(${((coord.r + 0.5) / 7) * 100}% - 14px + ${offset}px)`,
            }}
          >
            <div
              className={`relative w-full h-full rounded-full flex items-center justify-center border-2 ${
                isActive ? 'border-white shadow-lg' : 'border-white/40'
              }`}
              style={{ backgroundColor: player.color }}
            >
              {isMale ? <User className="w-4 h-4 text-white" /> : <UserRound className="w-4 h-4 text-white" />}
              {player.shield && (
                <Shield className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-[#64D2FF]" fill="currentColor" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
