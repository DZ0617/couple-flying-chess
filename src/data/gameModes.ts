import { GameMode, TileType } from '../types';

export interface TilePlanEntry {
  type: TileType;
  count: number;
}

export interface ModeConfig {
  id: GameMode;
  name: string;
  desc: string;
  diceCount: 1 | 2;
  extraRollRule: 'six' | 'doubles';
  useTruthDare: boolean;
  plan: TilePlanEntry[];
}

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  classic: {
    id: 'classic',
    name: '经典模式',
    desc: '单骰慢节奏，掷 6 连掷，适合边聊边玩',
    diceCount: 1,
    extraRollRule: 'six',
    useTruthDare: false,
    plan: [
      { type: 'lucky', count: 16 },
      { type: 'trap', count: 14 },
      { type: 'jump', count: 4 },
      { type: 'forward', count: 3 },
      { type: 'backward', count: 3 },
      { type: 'extra', count: 2 },
      { type: 'sync', count: 2 },
      // 其余 3 格 blank
    ],
  },
  double: {
    id: 'double',
    name: '双骰狂欢',
    desc: '双骰快节奏，对子连掷，交换与漩涡拉满戏剧性',
    diceCount: 2,
    extraRollRule: 'doubles',
    useTruthDare: false,
    plan: [
      { type: 'lucky', count: 10 },
      { type: 'trap', count: 9 },
      { type: 'duo', count: 4 },
      { type: 'jump', count: 4 },
      { type: 'forward', count: 4 },
      { type: 'backward', count: 4 },
      { type: 'extra', count: 3 },
      { type: 'swap', count: 2 },
      { type: 'vortex', count: 2 },
      { type: 'shield', count: 2 },
      { type: 'sync', count: 2 },
      // 其余 1 格 blank
    ],
  },
  truth: {
    id: 'truth',
    name: '真心话模式',
    desc: '幸运格真心话，陷阱格大冒险，聊得比玩得多',
    diceCount: 2,
    extraRollRule: 'doubles',
    useTruthDare: true,
    plan: [
      { type: 'lucky', count: 12 },
      { type: 'trap', count: 12 },
      { type: 'duo', count: 4 },
      { type: 'jump', count: 3 },
      { type: 'forward', count: 3 },
      { type: 'backward', count: 3 },
      { type: 'extra', count: 3 },
      { type: 'swap', count: 2 },
      { type: 'vortex', count: 2 },
      { type: 'shield', count: 1 },
      { type: 'sync', count: 2 },
    ],
  },
  heat: {
    id: 'heat',
    name: '渐进之夜',
    desc: '从甜蜜开始，温度到了才解锁更深的内容',
    diceCount: 2,
    extraRollRule: 'doubles',
    useTruthDare: false,
    plan: [
      { type: 'lucky', count: 10 },
      { type: 'trap', count: 9 },
      { type: 'duo', count: 4 },
      { type: 'jump', count: 4 },
      { type: 'forward', count: 4 },
      { type: 'backward', count: 4 },
      { type: 'extra', count: 3 },
      { type: 'swap', count: 2 },
      { type: 'vortex', count: 2 },
      { type: 'shield', count: 2 },
      { type: 'sync', count: 3 },
    ],
  },
};

export const MODE_LIST: ModeConfig[] = [
  MODE_CONFIGS.heat,
  MODE_CONFIGS.classic,
  MODE_CONFIGS.double,
  MODE_CONFIGS.truth,
];
