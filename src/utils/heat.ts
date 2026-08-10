import { Theme } from '../types';

// 温度带定义：与五个默认主题一一对应
export const BAND_THEME_IDS = ['sweet', 'love', 'couple', 'intimate', 'advanced'];
export const BAND_NAMES = ['甜蜜带', '暧昧带', '烈火带', '诱惑带', '灵肉带'];
export const GATE_STEPS = [20, 40, 60, 80]; // 闸口位置

// 温度增减（渐进之夜模式）
export const HEAT_GAIN = {
  task: 1,      // 普通任务（含 lucky/trap/collision/mini）
  duo: 3,       // 双人任务
  truth: 2,     // 真心话
  syncMatch: 4, // 默契考验答案一致
  syncMiss: 2,  // 默契考验不一致（小惩罚，气氛照涨）
  reject: -3,   // 拒绝任务
  gateDecline: -8, // 闸口选择「不要」
};

export function clampHeat(h: number): number {
  return Math.min(100, Math.max(0, Math.round(h)));
}

// 温度 → 温度带（0~4）
export function bandFromHeat(heat: number): number {
  if (heat >= 80) return 4;
  if (heat >= 60) return 3;
  if (heat >= 40) return 2;
  if (heat >= 20) return 1;
  return 0;
}

// 生效温度带：不超过对局前约定的上限
export function effectiveBand(heat: number, ceiling: number): number {
  return Math.min(bandFromHeat(heat), ceiling);
}

// 温度带任务池 = 该带默认主题 + 所有归属该带的自定义主题（去重，保持顺序）
export function poolForBandTasks(band: number, themes: Theme[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of themes) {
    if (t.id !== BAND_THEME_IDS[band] && t.band !== band) continue;
    for (const task of t.tasks) {
      if (!seen.has(task)) { seen.add(task); out.push(task); }
    }
  }
  return out;
}

export function poolForBandDuo(band: number, themes: Theme[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of themes) {
    if (t.id !== BAND_THEME_IDS[band] && t.band !== band) continue;
    for (const task of t.duoTasks) {
      if (!seen.has(task)) { seen.add(task); out.push(task); }
    }
  }
  return out;
}
