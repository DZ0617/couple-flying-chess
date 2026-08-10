export type ViewType = 'home' | 'game' | 'themes';

export type TileType =
  | 'blank' | 'lucky' | 'trap'
  | 'forward' | 'backward' | 'extra'
  | 'duo' | 'swap'
  | 'jump' | 'vortex' | 'shield'
  | 'sync';

export type TaskType = 'lucky' | 'trap' | 'collision' | 'duo' | 'mini' | 'truth';

export type PlayerRole = 'male' | 'female';
export type GameMode = 'classic' | 'double' | 'truth' | 'heat';

export interface Player {
  id: number;
  name: string;
  color: string;
  role: PlayerRole;
  step: number;
  themeId: string | null;
  shield: boolean;
  hearts: number;
}

export interface Theme {
  id: string;
  name: string;
  desc: string;
  audience: 'common' | 'male' | 'female';
  tasks: string[];
  duoTasks: string[];
  band?: number; // 归属温度带（0~4），仅渐进之夜抽池使用；空 = 不参与
}

export interface TaskEventData {
  type: TaskType;
  initiatorPlayerId: number;
  executorPlayerId: number;
  rejectable: boolean;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  task: string;
  taskSourceId: string;
  poolKey?: string; // 换卡用的抽池 key（heat 模式为 band_x:tasks / band_x:duo）
  rare?: boolean;
  swapped?: boolean; // 持久化的「已换过」标记，防刷新重置换卡次数
}

export type LandingResolution =
  | { kind: 'win' }
  | { kind: 'extraRoll'; reason: 'doubles' | 'six' | 'tile' }
  | { kind: 'swap' }
  | { kind: 'teleport' }
  | { kind: 'shieldGain' }
  | { kind: 'shieldBlock' }
  | { kind: 'task'; data: TaskEventData }
  | { kind: 'sync'; question: string }
  | { kind: 'none' };

export interface Movement {
  playerId: number;
  from: number;
  to: number;
}

export interface HeartGrant {
  playerId: number;
  amount: number;
  reason: string;
}

export interface LandingMeta {
  consumeShieldFor?: number;
  countSwap?: boolean;
  grants?: HeartGrant[];
}

export interface LandingOutcome {
  movements: Movement[];
  final: LandingResolution;
  meta?: LandingMeta;
}

export interface PathCoord {
  r: number;
  c: number;
}

export interface MatchStats {
  rolls: number;
  tasksCompleted: number;
  tasksRejected: number;
  swaps: number;
  backfires: number;
  heartsEarned: [number, number];
  streaks: [number, number];
  startedAt: number;
  ended: boolean; // 结算幂等标记：防刷新/过期闭包重复入账
  endedAt?: number; // 结算时刻（展示用时不随刷新虚增）
}

export interface Records {
  games: number;
  wins: [number, number];
  bank: [number, number];
  winStreak: [number, number];
  conquered: [string[], string[]];
}

export interface Wish {
  id: string;
  itemId: string;
  title: string;
  price: number;
  ownerPlayerId: number;
  createdAt: number;
  redeemedAt: number | null;
  source?: 'wishShop' | 'shop';
}

export interface GrantFeed {
  id: number;
  text: string;
}

// ---- 渐进之夜 ----
export interface DebtItem {
  id: string;
  task: string;
  type: TaskType;
  ownerPlayerId: number; // 欠账人（拒绝方）
  createdAt: number;
}

export interface SyncChallenge {
  question: string;
}

export interface QueenBuff {
  turnsLeft: number;
  beneficiary: number;
}

export interface GameState {
  view: ViewType;
  mode: GameMode;
  turn: number;
  players: Player[];
  themes: Theme[];
  boardMap: TileType[];
  pathCoords: PathCoord[];
  isRolling: boolean;
  drawnTaskMap: Record<string, number[]>;
  pendingTask: TaskEventData | null;
  pendingLanding: { landingStep: number; rollCount: number; dice: number[] } | null;
  match: MatchStats;
  records: Records;
  wishlist: Wish[];
  milestones: { halfway: boolean; sprint: boolean };
  shopUsage: Record<string, number>;
  frozenPlayerId: number | null;
  riggedRoll: { playerId: number; total: number } | null;
  grantFeed: GrantFeed | null;
  contentVersion: number;
  // 渐进之夜
  heat: number;
  heatCeiling: number; // 温度上限（带 index 0~4）
  heatRound: number; // 今晚第几局（1 起，续夜递增）
  pendingGate: number | null; // 待确认的目标温度带
  maxBand: number; // 本局到达过的最高温度带（惩罚档次/征服图鉴用）
  debtList: DebtItem[];
  pendingSync: SyncChallenge | null;
  queenBuff: QueenBuff | null;
}
