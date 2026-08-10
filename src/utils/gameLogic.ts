import { TileType, PathCoord } from '../types';
import { TilePlanEntry } from '../data/gameModes';

const GRID_SIZE = 7;
const TILES_COUNT = 49;
export const WIN_STEP = 48;
export const MAX_CHAIN = 3;
export const MAX_ROLLS_PER_TURN = 3;
export const JUMP_DISTANCE = 6;

export type Rng = () => number;

export function generateSpiralPath(): PathCoord[] {
  const path: PathCoord[] = [];
  let r = 0, c = 0, dr = 0, dc = 1;
  const visited: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

  for (let i = 0; i < TILES_COUNT; i++) {
    path[i] = { r, c };
    visited[r][c] = true;

    const nr = r + dr;
    const nc = c + dc;

    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited[nr][nc]) {
      r = nr;
      c = nc;
    } else {
      if (dr === 0 && dc === 1) { dr = 1; dc = 0; }
      else if (dr === 1 && dc === 0) { dr = 0; dc = -1; }
      else if (dr === 0 && dc === -1) { dr = -1; dc = 0; }
      else if (dr === -1 && dc === 0) { dr = 0; dc = 1; }
      r += dr;
      c += dc;
    }
  }

  return path;
}

// 棋盘配比按模式注入（见 data/gameModes.ts），生成逻辑共用
export function generateBoardMap(plan: TilePlanEntry[], rng: Rng = Math.random): TileType[] {
  const boardMap: TileType[] = new Array(TILES_COUNT).fill('blank');

  const availableIndices: number[] = [];
  for (let i = 1; i < TILES_COUNT - 1; i++) availableIndices.push(i);

  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }

  let cursor = 0;
  for (const { type, count } of plan) {
    for (let k = 0; k < count; k++) {
      boardMap[availableIndices[cursor++]] = type;
    }
  }

  return boardMap;
}

const VALID_TILES: TileType[] = [
  'blank', 'lucky', 'trap', 'forward', 'backward',
  'extra', 'duo', 'swap', 'sync', 'jump', 'vortex', 'shield',
];

export function isValidBoardMap(map: unknown): map is TileType[] {
  return Array.isArray(map) && map.length === TILES_COUNT && map.every(t => VALID_TILES.includes(t));
}

// 双向 clamp 到 [0, 48]；是否获胜由调用方以 >= WIN_STEP 判定
export function calculateNewPosition(current: number, steps: number): number {
  return Math.min(WIN_STEP, Math.max(0, current + steps));
}

export function rollDice(count: 1 | 2, rng: Rng = Math.random): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(Math.floor(rng() * 6) + 1);
  return out;
}

export function isExtraRoll(dice: number[], rule: 'six' | 'doubles'): boolean {
  if (rule === 'six') return dice[0] === 6;
  return dice.length === 2 && dice[0] === dice[1];
}

export function riggedDice(total: number, count: 1 | 2, rng: Rng = Math.random): number[] {
  if (count === 1) return [Math.min(6, Math.max(1, Math.round(total)))];
  const t = Math.min(12, Math.max(2, Math.round(total)));
  const lo = Math.max(1, t - 6);
  const hi = Math.min(6, t - 1);
  const a = lo + Math.floor(rng() * (hi - lo + 1));
  return [a, t - a];
}

export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}
