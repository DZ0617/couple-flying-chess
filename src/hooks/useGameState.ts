import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState, GameMode, Player, TaskEventData, Theme, Movement,
  LandingOutcome, LandingResolution, LandingMeta, HeartGrant, MatchStats,
  Wish, DebtItem, SyncChallenge,
} from '../types';
import { loadFromStorage, saveToStorage } from '../utils/localStorage';
import {
  generateSpiralPath, generateBoardMap, calculateNewPosition,
  isValidBoardMap, WIN_STEP, MAX_CHAIN, JUMP_DISTANCE, randomInt,
} from '../utils/gameLogic';
import { DEFAULT_THEMES } from '../data/defaultThemes';
import { MINI_INTERACTIONS } from '../data/miniInteractions';
import { MODE_CONFIGS } from '../data/gameModes';
import { TRUTH_QUESTIONS, RARE_TRUTH_QUESTIONS } from '../data/truthDare';
import { SHOP_ITEMS, WISH_ITEMS, CONQUER_LEVEL_IDS } from '../data/shopItems';
import { SYNC_SWEET, SYNC_SPICY } from '../data/syncQuestions';
import { PUNISH_FUNNY, punishmentPool } from '../data/punishments';
import {
  BAND_NAMES, BAND_THEME_IDS, HEAT_GAIN,
  clampHeat, effectiveBand, poolForBandTasks, poolForBandDuo,
} from '../utils/heat';
import { heartsMultiplier, isLoveNumber, isQixi } from '../utils/events';
import { playSound } from '../utils/sound';

const STORAGE_KEY = 'couples-ludo-game-state';
export const CURRENT_CONTENT_VERSION = 2;
const MINI_POOL_KEY = '__mini__';
const TRUTH_POOL_KEY = '__truth__';

// 欠账赎买价格（心愿银行）
export const DEBT_RANSOM = 25;

// 经济数值
const REWARD = {
  task: 10, duo: 12, truth: 5, mini: 3,
  doubles: 5, luckyTile: 5, jump: 3, shieldBlock: 5, swap: 8,
  backfire: 10, halfway: 20, sprint: 20, streakBonus: 15,
  win: 80, lose: 20, comebackStart: 30,
};

const initialPlayers: Player[] = [
  { id: 0, name: '男方', color: '#0A84FF', role: 'male', step: 0, themeId: null, shield: false, hearts: 0 },
  { id: 1, name: '女方', color: '#FF375F', role: 'female', step: 0, themeId: null, shield: false, hearts: 0 },
];

function freshMatch(): MatchStats {
  return {
    rolls: 0, tasksCompleted: 0, tasksRejected: 0, swaps: 0, backfires: 0,
    heartsEarned: [0, 0], streaks: [0, 0], startedAt: Date.now(), ended: false,
  };
}

function cloneTheme(t: Theme): Theme {
  return { ...t, tasks: [...t.tasks], duoTasks: [...t.duoTasks] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isThemeAllowedForRole(theme: Theme, role: Player['role']) {
  return theme.audience === 'common' || theme.audience === role;
}

function cleanTasks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of input) {
    const v = typeof x === 'string' ? x.trim() : '';
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function mergeUnique(saved: string[], defaults: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...saved, ...defaults]) {
    const v = t.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizePlayers(input: unknown): Player[] {
  const incoming = Array.isArray(input) ? input : [];

  return initialPlayers.map(base => {
    const found = incoming.find(p => isRecord(p) && typeof p.id === 'number' && p.id === base.id);
    const record = isRecord(found) ? found : {};
    const roleValue = record.role;
    const themeIdValue = record.themeId;

    return {
      id: base.id,
      name: typeof record.name === 'string' ? record.name : base.name,
      color: typeof record.color === 'string' ? record.color : base.color,
      role: roleValue === 'male' || roleValue === 'female' ? roleValue : base.role,
      step: typeof record.step === 'number' ? Math.min(WIN_STEP, Math.max(0, record.step)) : 0,
      themeId: typeof themeIdValue === 'string' || themeIdValue === null ? themeIdValue : null,
      shield: typeof record.shield === 'boolean' ? record.shield : false,
      hearts: typeof record.hearts === 'number' ? Math.max(0, Math.floor(record.hearts)) : 0,
    };
  });
}

function normalizeThemes(input: unknown, savedVersion: number): Theme[] {
  const incoming = Array.isArray(input) ? input : [];
  const normalized: Theme[] = incoming
    .map(t => {
      const record = isRecord(t) ? t : {};
      const audienceValue = record.audience;

      return {
        id: typeof record.id === 'string' ? record.id : `theme_${Date.now()}`,
        name: typeof record.name === 'string' ? record.name : '未命名主题',
        desc: typeof record.desc === 'string' ? record.desc : '',
        audience:
          audienceValue === 'common' || audienceValue === 'male' || audienceValue === 'female'
            ? audienceValue
            : 'common',
        tasks: cleanTasks(record.tasks),
        duoTasks: cleanTasks(record.duoTasks),
        band: typeof record.band === 'number' && record.band >= 0 && record.band <= 4
          ? Math.floor(record.band)
          : undefined,
      } satisfies Theme;
    })
    .reduce<Theme[]>((acc, theme) => {
      if (acc.some(t => t.id === theme.id)) return acc;
      acc.push(theme);
      return acc;
    }, []);

  if (normalized.length === 0) return DEFAULT_THEMES.map(cloneTheme);

  // 内容版本升级：仅执行一次合并。默认主题按 id 补入缺失任务（去重），自建主题不动
  if (savedVersion < CURRENT_CONTENT_VERSION) {
    const result = [...normalized];
    for (const def of DEFAULT_THEMES) {
      const idx = result.findIndex(t => t.id === def.id);
      if (idx === -1) {
        result.push(cloneTheme(def));
      } else {
        result[idx] = {
          ...result[idx],
          tasks: mergeUnique(result[idx].tasks, def.tasks),
          duoTasks: mergeUnique(result[idx].duoTasks, def.duoTasks),
        };
      }
    }
    return result;
  }
  return normalized;
}

function normalizeGameState(saved: unknown): GameState | null {
  if (!isRecord(saved)) return null;
  const s = saved;
  const savedVersion = typeof s.contentVersion === 'number' ? s.contentVersion : 1;
  const themes = normalizeThemes(s.themes, savedVersion);
  const players = normalizePlayers(s.players).map(p => {
    if (p.themeId === null) return p;
    const theme = themes.find(t => t.id === p.themeId);
    if (!theme) return { ...p, themeId: null };
    if (!isThemeAllowedForRole(theme, p.role)) return { ...p, themeId: null };
    return p;
  });

  const m = isRecord(s.match) ? s.match : {};
  const r = isRecord(s.records) ? s.records : {};
  const drawnRaw = isRecord(s.drawnTaskMap) ? s.drawnTaskMap : {};
  const drawnTaskMap: Record<string, number[]> = {};
  for (const k of Object.keys(drawnRaw)) {
    const arr = drawnRaw[k];
    if (Array.isArray(arr)) drawnTaskMap[k] = arr.filter((x): x is number => typeof x === 'number');
  }

  const wishlist: Wish[] = Array.isArray(s.wishlist)
    ? s.wishlist.filter(isRecord).map(w => ({
        id: typeof w.id === 'string' ? w.id : `wish_${Date.now()}`,
        itemId: typeof w.itemId === 'string' ? w.itemId : '',
        title: typeof w.title === 'string' ? w.title : '心愿券',
        price: typeof w.price === 'number' ? w.price : 0,
        ownerPlayerId: w.ownerPlayerId === 1 ? 1 : 0,
        createdAt: typeof w.createdAt === 'number' ? w.createdAt : Date.now(),
        redeemedAt: typeof w.redeemedAt === 'number' ? w.redeemedAt : null,
        source: w.source === 'shop' ? 'shop' : w.source === 'wishShop' ? 'wishShop' : undefined,
      }))
    : [];

  const pair = (v: unknown): [number, number] =>
    Array.isArray(v) && typeof v[0] === 'number' && typeof v[1] === 'number' ? [v[0], v[1]] : [0, 0];

  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const conqueredRaw = Array.isArray(r.conquered) ? r.conquered : [];

  const pending =
    isRecord(s.pendingTask) && typeof s.pendingTask.task === 'string'
      ? (s.pendingTask as unknown as TaskEventData)
      : null;

  const pendingLanding =
    isRecord(s.pendingLanding) &&
    typeof s.pendingLanding.landingStep === 'number' &&
    typeof s.pendingLanding.rollCount === 'number' &&
    Array.isArray(s.pendingLanding.dice)
      ? {
          landingStep: s.pendingLanding.landingStep,
          rollCount: s.pendingLanding.rollCount,
          dice: s.pendingLanding.dice.filter((x): x is number => typeof x === 'number'),
        }
      : null;

  const rigged = isRecord(s.riggedRoll) && typeof s.riggedRoll.total === 'number'
    ? { playerId: s.riggedRoll.playerId === 1 ? 1 : 0, total: s.riggedRoll.total }
    : null;

  const ms = isRecord(s.milestones) ? s.milestones : {};

  const debtList: DebtItem[] = Array.isArray(s.debtList)
    ? s.debtList.filter(isRecord).map(d => {
        const t = d.type;
        const validType: DebtItem['type'] =
          t === 'lucky' || t === 'trap' || t === 'collision' || t === 'duo' || t === 'mini' || t === 'truth'
            ? t
            : 'lucky';
        return {
          id: typeof d.id === 'string' ? d.id : `debt_${Date.now()}`,
          task: typeof d.task === 'string' ? d.task : '',
          type: validType,
          ownerPlayerId: d.ownerPlayerId === 1 ? 1 : 0,
          createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
        };
      }).filter(d => d.task.length > 0)
    : [];

  return {
    view: s.view === 'home' || s.view === 'game' || s.view === 'themes' ? s.view : 'home',
    mode: s.mode === 'classic' || s.mode === 'double' || s.mode === 'truth' || s.mode === 'heat' ? s.mode : 'double',
    turn: s.turn === 0 || s.turn === 1 ? s.turn : 0,
    players,
    themes,
    boardMap: isValidBoardMap(s.boardMap) ? s.boardMap : generateBoardMap(MODE_CONFIGS.double.plan),
    pathCoords: Array.isArray(s.pathCoords) ? s.pathCoords : generateSpiralPath(),
    isRolling: !!s.isRolling,
    drawnTaskMap,
    pendingTask: pending,
    pendingLanding,
    match: {
      rolls: typeof m.rolls === 'number' ? m.rolls : 0,
      tasksCompleted: typeof m.tasksCompleted === 'number' ? m.tasksCompleted : 0,
      tasksRejected: typeof m.tasksRejected === 'number' ? m.tasksRejected : 0,
      swaps: typeof m.swaps === 'number' ? m.swaps : 0,
      backfires: typeof m.backfires === 'number' ? m.backfires : 0,
      heartsEarned: pair(m.heartsEarned),
      streaks: pair(m.streaks),
      startedAt: typeof m.startedAt === 'number' ? m.startedAt : Date.now(),
      ended: !!m.ended,
    },
    records: {
      games: typeof r.games === 'number' ? r.games : 0,
      wins: pair(r.wins),
      bank: pair(r.bank),
      winStreak: pair(r.winStreak),
      conquered: [strArr(conqueredRaw[0]), strArr(conqueredRaw[1])],
    },
    wishlist,
    milestones: { halfway: !!ms.halfway, sprint: !!ms.sprint },
    shopUsage: isRecord(s.shopUsage) ? (s.shopUsage as Record<string, number>) : {},
    frozenPlayerId: s.frozenPlayerId === 0 || s.frozenPlayerId === 1 ? s.frozenPlayerId : null,
    riggedRoll: rigged,
    grantFeed: null, // 瞬时播报，不持久化
    contentVersion: CURRENT_CONTENT_VERSION,
    // 渐进之夜
    heat: typeof s.heat === 'number' ? clampHeat(s.heat) : 0,
    heatCeiling: typeof s.heatCeiling === 'number' ? Math.min(4, Math.max(0, Math.floor(s.heatCeiling))) : 4,
    pendingGate: typeof s.pendingGate === 'number' && s.pendingGate >= 1 && s.pendingGate <= 4 ? s.pendingGate : null,
    maxBand: typeof s.maxBand === 'number' ? Math.min(4, Math.max(0, Math.floor(s.maxBand))) : 0,
    debtList,
    pendingSync:
      isRecord(s.pendingSync) && typeof s.pendingSync.question === 'string'
        ? { question: s.pendingSync.question }
        : null,
    queenBuff:
      isRecord(s.queenBuff) && typeof s.queenBuff.turnsLeft === 'number'
        ? { turnsLeft: s.queenBuff.turnsLeft, beneficiary: s.queenBuff.beneficiary === 1 ? 1 : 0 }
        : null,
  };
}

function createThemeId(existingIds: Set<string>) {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as Crypto).randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  let id = `user_${base}`;
  while (existingIds.has(id)) {
    id = `user_${base}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return id;
}

function drawIndex(poolSize: number, drawn: number[]): { index: number; nextDrawn: number[] } {
  const valid = drawn.filter(i => i >= 0 && i < poolSize);
  const used = valid.length >= poolSize ? [] : valid; // 抽完重置
  const available: number[] = [];
  for (let i = 0; i < poolSize; i++) if (!used.includes(i)) available.push(i);
  if (available.length === 0) return { index: -1, nextDrawn: used };
  const index = available[Math.floor(Math.random() * available.length)];
  return { index, nextDrawn: [...used, index] };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadFromStorage<GameState | null>(STORAGE_KEY, null);
    const normalized = normalizeGameState(saved);

    if (normalized) return normalized;

    return {
      view: 'home',
      mode: 'double',
      turn: 0,
      players: initialPlayers,
      themes: DEFAULT_THEMES.map(cloneTheme),
      boardMap: generateBoardMap(MODE_CONFIGS.double.plan),
      pathCoords: generateSpiralPath(),
      isRolling: false,
      drawnTaskMap: {},
      pendingTask: null,
      pendingLanding: null,
      match: freshMatch(),
      records: { games: 0, wins: [0, 0], bank: [0, 0], winStreak: [0, 0], conquered: [[], []] },
      wishlist: [],
      milestones: { halfway: false, sprint: false },
      shopUsage: {},
      frozenPlayerId: null,
      riggedRoll: null,
      grantFeed: null,
      contentVersion: CURRENT_CONTENT_VERSION,
      heat: 0,
      heatCeiling: 4,
      pendingGate: null,
      maxBand: 0,
      debtList: [],
      pendingSync: null,
      queenBuff: null,
    };
  });

  // 存档写入防抖 + 关闭前兜底：走棋动画期间每 220ms 一次全量序列化太耗电
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const t = setTimeout(() => saveToStorage(STORAGE_KEY, state), 400);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => {
    const flush = () => saveToStorage(STORAGE_KEY, stateRef.current);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  // ---- 基础 ----
  const switchView = useCallback((view: GameState['view']) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const selectTheme = useCallback((playerId: number, themeId: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === playerId ? { ...p, themeId } : p)),
    }));
  }, []);

  const renamePlayer = useCallback((playerId: number, name: string) => {
    const trimmed = name.trim().slice(0, 8);
    if (!trimmed) return;
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === playerId ? { ...p, name: trimmed } : p)),
    }));
  }, []);

  const createTheme = useCallback((input: { name: string; desc?: string; audience: Theme['audience'] }) => {
    const name = input.name.trim();
    const desc = (input.desc || '').trim();
    if (!name) return null;
    let createdId: string | null = null;
    setState(prev => {
      const existingIds = new Set(prev.themes.map(t => t.id));
      const id = createThemeId(existingIds);
      createdId = id;
      return {
        ...prev,
        themes: [...prev.themes, { id, name, desc, audience: input.audience, tasks: [], duoTasks: [] }],
      };
    });
    return createdId;
  }, []);

  const updateThemeMeta = useCallback(
    (themeId: string, patch: Partial<Pick<Theme, 'name' | 'desc' | 'audience'>> & { band?: number | null }) => {
      setState(prev => ({
        ...prev,
        themes: prev.themes.map(t => {
          if (t.id !== themeId) return t;
          const nextName = typeof patch.name === 'string' ? patch.name.trim() : t.name;
          const nextDesc = typeof patch.desc === 'string' ? patch.desc.trim() : t.desc;
          const nextAudience = patch.audience || t.audience;
          const nextBand =
            patch.band === undefined ? t.band
              : patch.band === null ? undefined
              : Math.min(4, Math.max(0, Math.floor(patch.band)));
          return { ...t, name: nextName || t.name, desc: nextDesc, audience: nextAudience, band: nextBand };
        }),
      }));
    },
    []
  );

  const addThemeTask = useCallback((themeId: string, taskText: string, field: 'tasks' | 'duoTasks' = 'tasks') => {
    const trimmed = taskText.trim();
    if (!trimmed) return;
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        if (t[field].includes(trimmed)) return t;
        return { ...t, [field]: [...t[field], trimmed] };
      }),
    }));
  }, []);

  const removeThemeTask = useCallback((themeId: string, index: number, field: 'tasks' | 'duoTasks' = 'tasks') => {
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => {
        if (t.id !== themeId) return t;
        if (index < 0 || index >= t[field].length) return t;
        return { ...t, [field]: t[field].filter((_, i) => i !== index) };
      }),
    }));
  }, []);

  const importThemeTasks = useCallback(
    (themeId: string, tasks: string[], mode: 'append' | 'replace' = 'append', field: 'tasks' | 'duoTasks' = 'tasks') => {
      const cleaned = tasks.map(t => (typeof t === 'string' ? t.trim() : '')).filter(t => t.length > 0);
      if (cleaned.length === 0) return;
      setState(prev => ({
        ...prev,
        themes: prev.themes.map(t => {
          if (t.id !== themeId) return t;
          const base = mode === 'replace' ? [] : t[field];
          const seen = new Set<string>();
          const merged: string[] = [];
          for (const item of [...base, ...cleaned]) {
            if (seen.has(item)) continue;
            seen.add(item);
            merged.push(item);
          }
          return { ...t, [field]: merged };
        }),
      }));
    },
    []
  );

  // ---- Hearts 统一入口（女王时刻：非受益方收入归受益人）----
  const gainHearts = useCallback((playerId: number, amount: number, reason: string) => {
    if (amount <= 0) return;
    const finalAmount = amount * heartsMultiplier();
    setState(prev => {
      const qb = prev.queenBuff;
      const target = qb ? qb.beneficiary : playerId;
      const name = prev.players[target]?.name ?? '';
      const earned: [number, number] = [...prev.match.heartsEarned];
      earned[target === 0 ? 0 : 1] += finalAmount;
      const after = (prev.players[target]?.hearts ?? 0) + finalAmount;
      const feed = isLoveNumber(after)
        ? `❤ 520 · 我爱你 ❤`
        : `${name} +${finalAmount} Hearts · ${reason}${qb && target !== playerId ? '（女王时刻）' : ''}${heartsMultiplier() > 1 ? '（七夕双倍）' : ''}`;
      return {
        ...prev,
        players: prev.players.map(p => (p.id === target ? { ...p, hearts: after } : p)),
        match: { ...prev.match, heartsEarned: earned },
        grantFeed: { id: Date.now() + Math.random(), text: feed },
      };
    });
    playSound('hearts');
  }, []);

  // ---- 对局流程 ----
  const startGame = useCallback((mode: GameMode, heatCeiling = 4) => {
    // 渐进之夜无需选择主题包（按温度带抽池）；其余模式仍校验
    if (mode !== 'heat') {
      for (const player of state.players) {
        if (!player.themeId) return false;
        const theme = state.themes.find(t => t.id === player.themeId);
        if (!theme) return false;
        if (!isThemeAllowedForRole(theme, player.role)) return false;
        if (theme.tasks.length === 0) return false;
      }
    }
    setState(prev => ({
      ...prev,
      view: 'game',
      mode,
      turn: Math.random() < 0.5 ? 0 : 1,
      players: prev.players.map(p => {
        const opponentStreak = prev.records.winStreak[p.id === 0 ? 1 : 0];
        const comeback = opponentStreak >= 2 ? REWARD.comebackStart : 0;
        return { ...p, step: 0, shield: false, hearts: comeback };
      }),
      boardMap: generateBoardMap(MODE_CONFIGS[mode].plan),
      match: freshMatch(),
      drawnTaskMap: {},
      pendingTask: null,
      pendingLanding: null,
      pendingSync: null,
      milestones: { halfway: false, sprint: false },
      shopUsage: {},
      frozenPlayerId: null,
      riggedRoll: null,
      heat: 0,
      heatCeiling,
      pendingGate: null,
      maxBand: 0,
      queenBuff: null,
      // debtList 跨局保留，不在开局清空
      grantFeed: mode === 'heat'
        ? { id: Date.now(), text: `🔥 渐进之夜：从甜蜜带开始，上限「${BAND_NAMES[heatCeiling]}」` }
        : isQixi()
          ? { id: Date.now(), text: '🎋 七夕特别场：全场 Hearts 双倍！' }
          : prev.records.winStreak[0] >= 2 || prev.records.winStreak[1] >= 2
            ? { id: Date.now(), text: `连败补助：落后方开局 +${REWARD.comebackStart} Hearts` }
            : null,
    }));
    return true;
  }, [state.players, state.themes]);

  // 再来一局：保留模式、主题选择与温度约定，直接重开
  const rematch = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'game',
      turn: Math.random() < 0.5 ? 0 : 1,
      players: prev.players.map(p => {
        const opponentStreak = prev.records.winStreak[p.id === 0 ? 1 : 0];
        const comeback = opponentStreak >= 2 ? REWARD.comebackStart : 0;
        return { ...p, step: 0, shield: false, hearts: comeback };
      }),
      boardMap: generateBoardMap(MODE_CONFIGS[prev.mode].plan),
      match: freshMatch(),
      drawnTaskMap: {},
      pendingTask: null,
      pendingLanding: null,
      pendingSync: null,
      milestones: { halfway: false, sprint: false },
      shopUsage: {},
      frozenPlayerId: null,
      riggedRoll: null,
      heat: 0,
      pendingGate: null,
      maxBand: 0,
      queenBuff: null,
      grantFeed: isQixi()
        ? { id: Date.now(), text: '🎋 七夕特别场：全场 Hearts 双倍！' }
        : null,
    }));
  }, []);

  const movePlayer = useCallback((steps: number) => {
    setState(prev => {
      const activePlayer = prev.players[prev.turn];
      const newStep = calculateNewPosition(activePlayer.step, steps);
      return {
        ...prev,
        players: prev.players.map(p => (p.id === activePlayer.id ? { ...p, step: newStep } : p)),
      };
    });
  }, []);

  const applyMovement = useCallback((m: Movement) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === m.playerId ? { ...p, step: calculateNewPosition(m.to, 0) } : p
      ),
    }));
  }, []);

  const endTurn = useCallback(() => {
    setState(prev => ({
      ...prev,
      turn: prev.turn === 0 ? 1 : 0,
      isRolling: false,
      queenBuff: prev.queenBuff
        ? prev.queenBuff.turnsLeft <= 1
          ? null
          : { ...prev.queenBuff, turnsLeft: prev.queenBuff.turnsLeft - 1 }
        : null,
    }));
  }, []);

  const setIsRolling = useCallback((rolling: boolean) => {
    setState(prev => ({ ...prev, isRolling: rolling }));
  }, []);

  const recordRoll = useCallback(() => {
    setState(prev => ({ ...prev, match: { ...prev.match, rolls: prev.match.rolls + 1 } }));
  }, []);

  const applyBackfire = useCallback(() => {
    setState(prev => {
      const bonus = REWARD.backfire * heartsMultiplier();
      const earned: [number, number] = [...prev.match.heartsEarned];
      earned[prev.turn] += bonus;
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === prev.turn ? { ...p, step: 0, hearts: p.hearts + bonus } : p
        ),
        match: { ...prev.match, backfires: prev.match.backfires + 1, heartsEarned: earned },
      };
    });
  }, []);

  const checkMilestones = useCallback(
    (step: number) => {
      const activeId = state.players[state.turn].id;
      // 阈值随棋盘尺寸推导，不写死
      if (!state.milestones.halfway && step >= Math.floor(WIN_STEP / 2)) {
        setState(prev => ({ ...prev, milestones: { ...prev.milestones, halfway: true } }));
        gainHearts(activeId, REWARD.halfway, '率先过半');
        playSound('milestone');
      }
      if (!state.milestones.sprint && step >= WIN_STEP - 8) {
        setState(prev => ({ ...prev, milestones: { ...prev.milestones, sprint: true } }));
        gainHearts(activeId, REWARD.sprint, '进入冲刺区');
        playSound('milestone');
      }
    },
    [state.players, state.turn, state.milestones, gainHearts]
  );

  // 局末结算：胜负奖励 + 折算入银行 + 连胜（幂等：ended 标记防刷新/过期闭包重复入账）
  const settleMatch = useCallback((winnerId: number) => {
    setState(prev => {
      if (prev.match.ended) return prev;
      const loserId = winnerId === 0 ? 1 : 0;
      const newStreak = prev.records.winStreak[winnerId] + 1;
      const rate = newStreak >= 3 ? 0.7 : newStreak === 2 ? 0.6 : 0.5;
      const m = heartsMultiplier();
      const wHearts = prev.players[winnerId].hearts + REWARD.win * m;
      const lHearts = prev.players[loserId].hearts + REWARD.lose * m;
      const bank: [number, number] = [...prev.records.bank] as [number, number];
      bank[winnerId] += Math.floor(wHearts * rate);
      bank[loserId] += Math.floor(lHearts * 0.5);
      const wins: [number, number] =
        winnerId === 0
          ? [prev.records.wins[0] + 1, prev.records.wins[1]]
          : [prev.records.wins[0], prev.records.wins[1] + 1];
      const winStreak: [number, number] = winnerId === 0 ? [newStreak, 0] : [0, newStreak];
      // 征服记录：渐进之夜按本局最高温度带点亮；其余模式按赢家主题
      const conquerId =
        prev.mode === 'heat'
          ? BAND_THEME_IDS[Math.max(0, Math.min(4, prev.maxBand))]
          : prev.players[winnerId].themeId;
      const conquered: [string[], string[]] = [prev.records.conquered[0], prev.records.conquered[1]];
      if (conquerId && !conquered[winnerId].includes(conquerId)) {
        conquered[winnerId] = [...conquered[winnerId], conquerId];
      }
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === winnerId ? { ...p, hearts: wHearts } : p.id === loserId ? { ...p, hearts: lHearts } : p
        ),
        records: { games: prev.records.games + 1, wins, bank, winStreak, conquered },
        match: { ...prev.match, ended: true, endedAt: Date.now() },
        grantFeed: {
          id: Date.now() + Math.random(),
          text: `胜利 +${REWARD.win * m} · 安慰 +${REWARD.lose * m} · 已按 ${Math.round(rate * 100)}% 存入心愿银行${m > 1 ? '（七夕双倍）' : ''}`,
        },
      };
    });
  }, []);

  // ---- 抽卡 ----
  const drawFromPool = useCallback(
    (key: string, pool: string[]): string => {
      if (pool.length === 0) return '';
      const prevDrawn = state.drawnTaskMap[key] ?? [];
      const { index, nextDrawn } = drawIndex(pool.length, prevDrawn);
      const text = index >= 0 ? pool[index] : '';
      setState(prev => ({ ...prev, drawnTaskMap: { ...prev.drawnTaskMap, [key]: nextDrawn } }));
      return text;
    },
    [state.drawnTaskMap]
  );

  const setPendingTask = useCallback((task: TaskEventData) => {
    setState(prev => ({ ...prev, pendingTask: task }));
  }, []);

  // 刷新恢复结算：走棋动画进入前写入、结算后清除（持久化防白嫖）
  const setPendingLanding = useCallback((p: GameState['pendingLanding']) => {
    setState(prev => ({ ...prev, pendingLanding: p }));
  }, []);

  // 一生一世彩蛋：双方停在 13/14 时各 +7（图个彩头；由 App 层监听触发，避免闭包过期）
  const grantThirteenFourteen = useCallback(() => {
    setState(prev => {
      if (prev.shopUsage['__1314__']) return prev;
      const bonus = 7 * heartsMultiplier();
      return {
        ...prev,
        players: prev.players.map(p => ({ ...p, hearts: p.hearts + bonus })),
        match: {
          ...prev.match,
          heartsEarned: [prev.match.heartsEarned[0] + bonus, prev.match.heartsEarned[1] + bonus],
        },
        shopUsage: { ...prev.shopUsage, __1314__: 1 },
        grantFeed: { id: Date.now() + Math.random(), text: `❤ 一生一世 · 双方 +${bonus} Hearts ❤` },
      };
    });
    playSound('hearts');
  }, []);

  const applyOutcomeMeta = useCallback((meta?: LandingMeta) => {
    if (!meta) return;
    if (meta.consumeShieldFor !== undefined || meta.countSwap) {
      setState(prev => ({
        ...prev,
        players:
          meta.consumeShieldFor !== undefined
            ? prev.players.map(p => (p.id === meta.consumeShieldFor ? { ...p, shield: false } : p))
            : prev.players,
        match: meta.countSwap ? { ...prev.match, swaps: prev.match.swaps + 1 } : prev.match,
      }));
    }
    for (const g of meta.grants ?? []) gainHearts(g.playerId, g.amount, g.reason);
  }, [gainHearts]);

  const gainShield = useCallback(() => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === prev.turn ? { ...p, shield: true } : p)),
    }));
    playSound('shield');
  }, []);

  // ---- 落点结算 ----
  const resolveLanding = useCallback(
    (landingStep: number): LandingOutcome => {
      const activePlayer = state.players[state.turn];
      const opponent = state.players[state.turn === 0 ? 1 : 0];
      const movements: Movement[] = [];
      const grants: HeartGrant[] = [];
      let meta: LandingMeta = {};
      const useTruth = MODE_CONFIGS[state.mode].useTruthDare;
      const isHeat = state.mode === 'heat';
      const band = effectiveBand(state.heat, state.heatCeiling);

      if (landingStep >= WIN_STEP) return { movements, final: { kind: 'win' } };

      const buildTask = (
        type: TaskEventData['type'],
        executorId: number,
        theme: Theme | undefined,
        task: string,
        title: string,
        icon: string,
        color: string,
        rejectable = true,
        poolKey?: string,
        subtitleText?: string
      ): TaskEventData => ({
        type,
        initiatorPlayerId: activePlayer.id,
        executorPlayerId: executorId,
        rejectable,
        title,
        subtitle: subtitleText ?? (theme ? `任务来自「${theme.name}」` : '答不出或拒答倒退 1 格'),
        icon,
        color,
        task,
        taskSourceId: theme?.id || '',
        poolKey,
      });

      // 渐进之夜：按温度带抽池的快捷封装
      const heatTask = (
        type: TaskEventData['type'],
        executorId: number,
        field: 'tasks' | 'duo',
        title: string,
        icon: string,
        color: string,
        rejectable = true
      ): TaskEventData => {
        const pool = field === 'duo' ? poolForBandDuo(band, state.themes) : poolForBandTasks(band, state.themes);
        const key = `band_${band}:${field}`;
        const task = drawFromPool(key, pool);
        return buildTask(type, executorId, undefined, task, title, icon, color, rejectable, key, `任务来自「${BAND_NAMES[band]}」`);
      };

      const settle = (pos: number, allowMoveTiles = true): LandingResolution => {
        // 追尾优先
        if (pos !== 0 && pos === opponent.step) {
          if (opponent.shield) {
            meta = { ...meta, consumeShieldFor: opponent.id };
            grants.push({ playerId: opponent.id, amount: REWARD.shieldBlock, reason: '护盾抵挡' });
            return { kind: 'shieldBlock' };
          }
          if (isHeat) {
            return { kind: 'task', data: heatTask('collision', opponent.id, 'tasks', '亲密追尾', 'handshake', 'text-yellow-400') };
          }
          const theme = state.themes.find(t => t.id === activePlayer.themeId);
          const task = drawFromPool(`${activePlayer.themeId || ''}:tasks`, theme?.tasks ?? []);
          return {
            kind: 'task',
            data: buildTask('collision', opponent.id, theme, task, '亲密追尾', 'handshake', 'text-yellow-400', true, `${activePlayer.themeId || ''}:tasks`),
          };
        }

        const tileType = state.boardMap[pos];

        if (tileType === 'lucky') {
          grants.push({ playerId: activePlayer.id, amount: REWARD.luckyTile, reason: '幸运格' });
          if (useTruth) {
            const drawnCount = (state.drawnTaskMap[TRUTH_POOL_KEY] ?? []).length;
            const rare = (drawnCount + 1) % 7 === 0;
            const pool = rare ? RARE_TRUTH_QUESTIONS : TRUTH_QUESTIONS;
            const q = drawFromPool(TRUTH_POOL_KEY, pool);
            return {
              kind: 'task',
              data: {
                ...buildTask('truth', opponent.id, undefined, q, rare ? '稀有真心话 ✦' : '真心话', 'message', rare ? 'text-[#FFD60A]' : 'text-[#64D2FF]', true, TRUTH_POOL_KEY),
                rare,
              },
            };
          }
          if (isHeat) {
            return { kind: 'task', data: heatTask('lucky', opponent.id, 'tasks', '幸运时刻', 'favorite', 'text-[#FF375F]') };
          }
          const theme = state.themes.find(t => t.id === activePlayer.themeId);
          const task = drawFromPool(`${theme?.id || ''}:tasks`, theme?.tasks ?? []);
          return {
            kind: 'task',
            data: buildTask('lucky', opponent.id, theme, task, '幸运时刻', 'favorite', 'text-[#FF375F]', true, `${theme?.id || ''}:tasks`),
          };
        }

        if (tileType === 'trap') {
          if (activePlayer.shield) {
            meta = { ...meta, consumeShieldFor: activePlayer.id };
            grants.push({ playerId: activePlayer.id, amount: REWARD.shieldBlock, reason: '护盾抵挡' });
            return { kind: 'shieldBlock' };
          }
          const title = useTruth ? '大冒险' : '意外陷阱';
          if (isHeat) {
            return { kind: 'task', data: heatTask('trap', activePlayer.id, 'tasks', title, 'lock', 'text-[#BF5AF2]') };
          }
          const theme = state.themes.find(t => t.id === opponent.themeId);
          const task = drawFromPool(`${theme?.id || ''}:tasks`, theme?.tasks ?? []);
          return {
            kind: 'task',
            data: buildTask('trap', activePlayer.id, theme, task, title, 'lock', 'text-[#BF5AF2]', true, `${theme?.id || ''}:tasks`),
          };
        }

        if (tileType === 'duo') {
          if (isHeat) {
            const duoPool = poolForBandDuo(band, state.themes);
            const field = duoPool.length > 0 ? 'duo' : 'tasks';
            return { kind: 'task', data: heatTask('duo', activePlayer.id, field, '双人任务', 'duo', 'text-[#FF9F0A]') };
          }
          const theme = state.themes.find(t => t.id === activePlayer.themeId);
          const useDuoPool = !!theme && theme.duoTasks.length > 0;
          const pool = useDuoPool ? theme.duoTasks : theme?.tasks ?? [];
          const key = `${activePlayer.themeId || ''}:${useDuoPool ? 'duoTasks' : 'tasks'}`;
          const task = drawFromPool(key, pool);
          return {
            kind: 'task',
            data: buildTask('duo', activePlayer.id, theme, task, '双人任务', 'duo', 'text-[#FF9F0A]', true, key),
          };
        }

        // 默契考验格：温度模式 L3 起用升温题，其余用日常题
        if (tileType === 'sync') {
          const spicy = isHeat && band >= 2;
          const pool = spicy ? SYNC_SPICY : SYNC_SWEET;
          const q = drawFromPool(spicy ? '__sync_spicy__' : '__sync_sweet__', pool);
          if (!q) return { kind: 'none' };
          return { kind: 'sync', question: q };
        }

        if (tileType === 'extra') return { kind: 'extraRoll', reason: 'tile' };

        if (tileType === 'swap') {
          meta = { ...meta, countSwap: true };
          grants.push({ playerId: activePlayer.id, amount: REWARD.swap, reason: '交换格' });
          movements.push(
            { playerId: activePlayer.id, from: pos, to: opponent.step },
            { playerId: opponent.id, from: opponent.step, to: pos }
          );
          return { kind: 'swap' };
        }

        if (tileType === 'shield') {
          if (activePlayer.shield) return { kind: 'none' };
          return { kind: 'shieldGain' };
        }

        if (tileType === 'jump') {
          if (!allowMoveTiles) return { kind: 'none' };
          grants.push({ playerId: activePlayer.id, amount: REWARD.jump, reason: '飞跃格' });
          const to = calculateNewPosition(pos, JUMP_DISTANCE);
          movements.push({ playerId: activePlayer.id, from: pos, to });
          if (to >= WIN_STEP) return { kind: 'win' };
          return settle(to, false);
        }

        if (tileType === 'vortex') {
          if (!allowMoveTiles) return { kind: 'none' };
          const to = 1 + Math.floor(Math.random() * (WIN_STEP - 1));
          movements.push({ playerId: activePlayer.id, from: pos, to });
          return { kind: 'teleport' };
        }

        if (tileType === 'blank') {
          const task = drawFromPool(MINI_POOL_KEY, MINI_INTERACTIONS);
          if (!task) return { kind: 'none' };
          return {
            kind: 'task',
            data: buildTask('mini', activePlayer.id, undefined, task, '轻松一刻', 'smile', 'text-[#30D158]', false, MINI_POOL_KEY),
          };
        }

        return { kind: 'none' };
      };

      const firstTile = state.boardMap[landingStep];
      let final: LandingResolution;
      if (firstTile === 'forward' || firstTile === 'backward') {
        let pos = landingStep;
        let hops = 0;
        while (hops < MAX_CHAIN) {
          const t = state.boardMap[pos];
          const delta = t === 'forward' ? 2 : t === 'backward' ? -2 : 0;
          if (delta === 0) break;
          const next = calculateNewPosition(pos, delta);
          if (next === pos) break;
          movements.push({ playerId: activePlayer.id, from: pos, to: next });
          pos = next;
          hops += 1;
          if (pos >= WIN_STEP) return { movements, final: { kind: 'win' }, meta: { ...meta, grants } };
        }
        final = settle(pos);
      } else {
        final = settle(landingStep);
      }

      return { movements, final, meta: { ...meta, grants: grants.length ? grants : undefined } };
    },
    [state.players, state.turn, state.themes, state.boardMap, state.mode, state.heat, state.heatCeiling, state.drawnTaskMap, drawFromPool]
  );

  // ---- 任务结算（Hearts / 连击 / 温度 / 欠账）----
  const resolveTask = useCallback((task: TaskEventData, outcome: 'accept' | 'reject') => {
    setState(prev => {
      let nextPlayers = prev.players;
      let completed = prev.match.tasksCompleted;
      let rejected = prev.match.tasksRejected;
      const streaks: [number, number] = [...prev.match.streaks] as [number, number];
      const earned: [number, number] = [...prev.match.heartsEarned] as [number, number];
      const feeds: string[] = [];
      const ini = task.initiatorPlayerId;
      const m = heartsMultiplier();
      const qb = prev.queenBuff;

      const grant = (pid: number, amount: number, reason: string) => {
        const target = qb ? qb.beneficiary : pid; // 女王时刻重定向
        const fa = amount * m;
        const after = (nextPlayers.find(p => p.id === target)?.hearts ?? 0) + fa;
        nextPlayers = nextPlayers.map(p => (p.id === target ? { ...p, hearts: after } : p));
        earned[target] += fa;
        feeds.push(
          isLoveNumber(after)
            ? `❤ 520 · 我爱你 ❤`
            : `${nextPlayers.find(p => p.id === target)?.name ?? ''} +${fa} · ${reason}${qb && target !== pid ? '（女王时刻）' : ''}${m > 1 ? '（七夕双倍）' : ''}`
        );
      };

      if (outcome === 'accept') {
        completed += 1;
        streaks[ini] += 1;
        if (task.type === 'duo') {
          grant(0, REWARD.duo, '双人任务');
          grant(1, REWARD.duo, '双人任务');
        } else if (task.type === 'truth') {
          grant(ini, REWARD.truth, '真心话');
        } else if (task.type === 'mini') {
          grant(ini, REWARD.mini, '轻松一刻');
        } else {
          grant(ini, REWARD.task, '完成任务');
        }
        if (task.type === 'lucky') {
          nextPlayers = nextPlayers.map(p =>
            p.id === ini ? { ...p, step: calculateNewPosition(p.step, 1) } : p
          );
        }
        if (streaks[ini] > 0 && streaks[ini] % 3 === 0) {
          grant(ini, REWARD.streakBonus, `连续${streaks[ini]}次不拒绝`);
        }
      } else {
        rejected += 1;
        streaks[ini] = 0;
        const backSteps = Math.floor(Math.random() * 3) + 1;
        nextPlayers = nextPlayers.map(p => {
          if (task.type === 'truth') {
            return p.id === task.executorPlayerId
              ? { ...p, step: calculateNewPosition(p.step, -1) }
              : p;
          }
          if (task.type === 'duo') {
            return p.id === ini ? { ...p, step: calculateNewPosition(p.step, -backSteps) } : p;
          }
          if (p.id !== task.executorPlayerId) return p;
          if (task.type === 'collision') return { ...p, step: 0 };
          return { ...p, step: calculateNewPosition(p.step, -backSteps) };
        });
      }

      // —— 渐进之夜：温度增减 + 闸口检测 ——
      let heat = prev.heat;
      let pendingGate = prev.pendingGate;
      let maxBand = prev.maxBand;
      if (prev.mode === 'heat') {
        const bandBefore = effectiveBand(prev.heat, prev.heatCeiling);
        const delta =
          outcome === 'accept'
            ? task.type === 'duo'
              ? HEAT_GAIN.duo
              : task.type === 'truth'
                ? HEAT_GAIN.truth
                : HEAT_GAIN.task
            : HEAT_GAIN.reject;
        heat = clampHeat(prev.heat + delta);
        const bandAfter = effectiveBand(heat, prev.heatCeiling);
        maxBand = Math.max(maxBand, bandAfter);
        if (bandAfter > bandBefore && pendingGate === null) pendingGate = bandAfter;
      }

      // —— 拒绝记账（全模式生效，跨局保留）——
      const debtList =
        outcome === 'reject'
          ? [
              ...prev.debtList,
              {
                id: `debt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                task: task.task,
                type: task.type,
                ownerPlayerId: task.type === 'duo' ? ini : task.executorPlayerId,
                createdAt: Date.now(),
              },
            ]
          : prev.debtList;

      // 女王时刻随回合切换递减
      const queenBuff = qb ? (qb.turnsLeft <= 1 ? null : { ...qb, turnsLeft: qb.turnsLeft - 1 }) : null;

      return {
        ...prev,
        players: nextPlayers,
        turn: prev.turn === 0 ? 1 : 0,
        isRolling: false,
        pendingTask: null,
        pendingLanding: null,
        heat,
        pendingGate,
        maxBand,
        debtList,
        queenBuff,
        match: { ...prev.match, tasksCompleted: completed, tasksRejected: rejected, streaks, heartsEarned: earned },
        grantFeed: feeds.length ? { id: Date.now() + Math.random(), text: feeds.join('　') } : prev.grantFeed,
      };
    });
  }, []);

  // 换一张：执行方倒退 1 格，同池重抽；swapped 写入存档防刷新重置次数
  const swapTask = useCallback(
    (task: TaskEventData): TaskEventData | null => {
      if (!task.rejectable) return null;
      if (task.swapped) return null; // 每卡限一次（持久化判定）

      let pool: string[] = [];
      let key = '';
      if (task.poolKey?.startsWith('band_')) {
        // 渐进之夜：按卡片来源温度带重抽
        const bandNum = Number(task.poolKey.split(':')[0].split('_')[1]) || 0;
        const isDuo = task.poolKey.endsWith(':duo');
        pool = isDuo ? poolForBandDuo(bandNum, state.themes) : poolForBandTasks(bandNum, state.themes);
        key = task.poolKey;
      } else if (task.type === 'truth') {
        pool = TRUTH_QUESTIONS;
        key = TRUTH_POOL_KEY;
      } else if (task.type === 'duo') {
        const theme = state.themes.find(t => t.id === task.taskSourceId);
        const useDuoPool = !!theme && theme.duoTasks.length > 0;
        pool = useDuoPool ? theme.duoTasks : theme?.tasks ?? [];
        key = `${task.taskSourceId}:${useDuoPool ? 'duoTasks' : 'tasks'}`;
      } else {
        const theme = state.themes.find(t => t.id === task.taskSourceId);
        pool = theme?.tasks ?? [];
        key = `${task.taskSourceId}:tasks`;
      }
      if (pool.length <= 1) return null;
      const nextText = drawFromPool(key, pool);
      if (!nextText) return null;

      // 稀有金卡换题后褪色为普通卡（题是普通池重抽的，视觉与内容对齐）
      const updated: TaskEventData = {
        ...task,
        task: nextText,
        swapped: true,
        rare: false,
        title: task.type === 'truth' ? '真心话' : task.title,
        color: task.type === 'truth' ? 'text-[#64D2FF]' : task.color,
      };
      setState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === task.executorPlayerId ? { ...p, step: calculateNewPosition(p.step, -1) } : p
        ),
        pendingTask: updated,
      }));
      return updated;
    },
    [state.themes, drawFromPool]
  );

  // ---- 商店 ----
  const purchaseItem = useCallback(
    (itemId: string, opts?: { total?: number }): boolean => {
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return false;
      const buyer = state.players[state.turn];
      const opp = state.players[state.turn === 0 ? 1 : 0];
      if (buyer.hearts < item.price) return false;
      if (item.femaleOnly && buyer.role !== 'female') return false;
      if (item.leaderRestricted && buyer.hearts > opp.hearts * 1.5) return false;
      if (item.limitPerMatch && (state.shopUsage[item.id] ?? 0) >= item.limitPerMatch) return false;
      if (item.id === 'robinhood' && buyer.hearts >= opp.hearts) return false;
      if (item.needsRigTotal) {
        const cfg = MODE_CONFIGS[state.mode];
        const t = opts?.total ?? 0;
        const ok = cfg.diceCount === 1 ? t >= 1 && t <= 6 : t >= 2 && t <= 12;
        if (!ok) return false;
      }

      // 公主令：购买前预抽卡（drawFromPool 自带 setState，必须在主 setState 之前调用）
      let princessTask: TaskEventData | null = null;
      let princessDebtId: string | null = null;
      if (item.id === 'princess') {
        const male = state.players.find(p => p.role === 'male');
        const female = state.players.find(p => p.role === 'female');
        if (!male || !female || buyer.id !== female.id) return false;
        const band = effectiveBand(state.heat, state.heatCeiling);
        const debt = state.debtList.find(d => d.ownerPlayerId === male.id);
        let text = '';
        let poolKey: string | undefined;
        if (debt) {
          text = debt.task;
          princessDebtId = debt.id;
        } else {
          const pool = poolForBandTasks(band, state.themes);
          poolKey = `band_${band}:tasks`;
          text = drawFromPool(poolKey, pool);
        }
        if (!text) return false;
        princessTask = {
          type: 'lucky',
          initiatorPlayerId: female.id,
          executorPlayerId: male.id,
          rejectable: false,
          title: '公主令',
          subtitle: princessDebtId ? '强制还账 · 不可拒绝' : `任务来自「${BAND_NAMES[band]}」· 不可拒绝`,
          icon: 'favorite',
          color: 'text-[#FF375F]',
          task: text,
          taskSourceId: '',
          poolKey,
        };
      }

      setState(prev => {
        const me = prev.turn;
        const other = me === 0 ? 1 : 0;
        const players = prev.players.map(p => ({ ...p }));
        const m = heartsMultiplier();
        players[me].hearts -= item.price;
        let feed = `${players[me].name} 购买了「${item.name}」`;
        let frozenPlayerId = prev.frozenPlayerId;
        let riggedRoll = prev.riggedRoll;
        let queenBuff = prev.queenBuff;
        let debtList = prev.debtList;
        let pendingTask = prev.pendingTask;

        switch (item.id) {
          case 'charm':
            players[me].shield = true;
            break;
          case 'leap':
            players[me].step = calculateNewPosition(players[me].step, 4);
            break;
          case 'recall':
            players[other].step = calculateNewPosition(players[other].step, -4);
            break;
          case 'freeze':
            frozenPlayerId = other;
            break;
          case 'remote':
            riggedRoll = { playerId: other, total: opts?.total ?? 7 };
            break;
          case 'swapcard': {
            const a = players[me].step;
            players[me].step = players[other].step;
            players[other].step = a;
            break;
          }
          case 'nuke':
            players[other].hearts = 0;
            feed += '，对方 Hearts 清零！';
            break;
          case 'princess':
            pendingTask = princessTask;
            if (princessDebtId) debtList = debtList.filter(d => d.id !== princessDebtId);
            feed += '，男方必须立刻执行';
            break;
          case 'queen':
            queenBuff = { turnsLeft: 3, beneficiary: me };
            feed += '，接下来 3 回合对方收入归你';
            break;
          case 'mystery': {
            const amount = randomInt(20, 120) * m;
            players[me].hearts += amount;
            feed += `，开出 ${amount} Hearts`;
            break;
          }
          case 'roulette': {
            const roll = randomInt(1, 5);
            if (roll === 1) { players[me].step = calculateNewPosition(players[me].step, 3); feed += '，前进 3 格'; }
            else if (roll === 2) { players[me].step = calculateNewPosition(players[me].step, -3); feed += '，后退 3 格'; }
            else if (roll === 3) { const g = 15 * m; players[0].hearts += g; players[1].hearts += g; feed += `，双方 +${g} Hearts`; }
            else if (roll === 4) {
              const a = players[me].step;
              players[me].step = players[other].step;
              players[other].step = a;
              feed += '，交换位置！';
            } else feed += '，无事发生';
            break;
          }
          case 'robinhood': {
            // 修复：按实际可扣额转移，且转账不翻倍（防印钞）
            const actual = Math.min(30, players[other].hearts);
            players[other].hearts -= actual;
            players[me].hearts += actual;
            feed += `，转移 ${actual} Hearts`;
            break;
          }
          default: {
            // 服务类：自动生成欠条进愿望清单
            feed += '，已放入愿望清单';
            return {
              ...prev,
              players,
              frozenPlayerId,
              riggedRoll,
              queenBuff,
              debtList,
              pendingTask,
              shopUsage: { ...prev.shopUsage, [item.id]: (prev.shopUsage[item.id] ?? 0) + 1 },
              wishlist: [
                ...prev.wishlist,
                {
                  id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  itemId: item.id,
                  title: item.name,
                  price: 0,
                  ownerPlayerId: prev.turn,
                  createdAt: Date.now(),
                  redeemedAt: null,
                  source: 'shop',
                },
              ],
              grantFeed: { id: Date.now() + Math.random(), text: feed },
            };
          }
        }

        return {
          ...prev,
          players,
          frozenPlayerId,
          riggedRoll,
          queenBuff,
          debtList,
          pendingTask,
          shopUsage: { ...prev.shopUsage, [item.id]: (prev.shopUsage[item.id] ?? 0) + 1 },
          grantFeed: { id: Date.now() + Math.random(), text: feed },
        };
      });
      playSound('buy');
      return true;
    },
    [state.players, state.turn, state.shopUsage, state.mode, state.heat, state.heatCeiling, state.themes, state.debtList, drawFromPool]
  );

  const consumeFrozen = useCallback(() => {
    setState(prev => ({ ...prev, frozenPlayerId: null }));
  }, []);

  const consumeRigged = useCallback(() => {
    setState(prev => ({ ...prev, riggedRoll: null }));
  }, []);

  // ---- 心愿银行 ----
  const redeemWish = useCallback((wishItemId: string, playerId: number): boolean => {
    const item = WISH_ITEMS.find(w => w.id === wishItemId);
    if (!item) return false;
    if (state.records.bank[playerId] < item.price) return false;
    if (item.id === 'qixi2026' && !isQixi()) return false; // 七夕限定券仅当天可兑（UI 层之外的兜底）
    if (item.needsConquerAll) {
      const done = new Set(state.records.conquered[playerId]);
      if (!CONQUER_LEVEL_IDS.every(id => done.has(id))) return false;
    }
    setState(prev => {
      const bank: [number, number] = [...prev.records.bank] as [number, number];
      bank[playerId] -= item.price;
      return {
        ...prev,
        records: { ...prev.records, bank },
        wishlist: [
          ...prev.wishlist,
          {
            id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            itemId: item.id,
            title: item.name,
            price: item.price,
            ownerPlayerId: playerId,
            createdAt: Date.now(),
            redeemedAt: null,
          },
        ],
        grantFeed: { id: Date.now() + Math.random(), text: `兑换「${item.name}」成功，已放入愿望清单` },
      };
    });
    return true;
  }, [state.records.bank, state.records.conquered]);

  const markWishRedeemed = useCallback((wishId: string) => {
    setState(prev => ({
      ...prev,
      wishlist: prev.wishlist.map(w => (w.id === wishId ? { ...w, redeemedAt: Date.now() } : w)),
    }));
  }, []);

  // ---- 渐进之夜：闸口 / 默契 / 欠账 / 惩罚 ----
  const setPendingSync = useCallback((sync: SyncChallenge | null) => {
    setState(prev => ({ ...prev, pendingSync: sync }));
  }, []);

  // 闸口确认：要 → 直接进入新温度带；不要 → 温度 -8 退回当前带
  const resolveGate = useCallback((stimulate: boolean) => {
    setState(prev => {
      if (prev.pendingGate === null) return prev;
      if (stimulate) {
        return {
          ...prev,
          pendingGate: null,
          grantFeed: { id: Date.now() + Math.random(), text: `🔥 进入「${BAND_NAMES[prev.pendingGate]}」，今晚更进一步` },
        };
      }
      return {
        ...prev,
        pendingGate: null,
        heat: clampHeat(prev.heat + HEAT_GAIN.gateDecline),
        grantFeed: { id: Date.now() + Math.random(), text: '好，维持这个温度（-8°）' },
      };
    });
  }, []);

  // 默契考验结算：一致双方 +10 且温度 +4；不一致抽搞笑惩罚且温度 +2；换人
  const resolveSync = useCallback((matched: boolean): string | null => {
    let punishment: string | null = null;
    if (!matched) {
      punishment = drawFromPool('__pun_funny__', PUNISH_FUNNY) || PUNISH_FUNNY[0];
    }
    const m = heartsMultiplier();
    setState(prev => {
      let heat = prev.heat;
      let pendingGate = prev.pendingGate;
      let maxBand = prev.maxBand;
      if (prev.mode === 'heat') {
        const bandBefore = effectiveBand(prev.heat, prev.heatCeiling);
        heat = clampHeat(prev.heat + (matched ? HEAT_GAIN.syncMatch : HEAT_GAIN.syncMiss));
        const bandAfter = effectiveBand(heat, prev.heatCeiling);
        maxBand = Math.max(maxBand, bandAfter);
        if (bandAfter > bandBefore && pendingGate === null) pendingGate = bandAfter;
      }
      let players = prev.players;
      const earned: [number, number] = [...prev.match.heartsEarned] as [number, number];
      let feedText = '默契值为零…小惩罚伺候';
      if (matched) {
        const g = 10 * m;
        players = prev.players.map(p => ({ ...p, hearts: p.hearts + g }));
        earned[0] += g;
        earned[1] += g;
        feedText = `默契满分！双方 +${g} Hearts`;
      }
      const qb = prev.queenBuff;
      return {
        ...prev,
        players,
        heat,
        pendingGate,
        maxBand,
        turn: prev.turn === 0 ? 1 : 0,
        isRolling: false,
        pendingSync: null,
        pendingLanding: null,
        queenBuff: qb ? (qb.turnsLeft <= 1 ? null : { ...qb, turnsLeft: qb.turnsLeft - 1 }) : null,
        match: { ...prev.match, heartsEarned: earned },
        grantFeed: { id: Date.now() + Math.random(), text: feedText },
      };
    });
    if (matched) playSound('hearts');
    return punishment;
  }, [drawFromPool]);

  // 欠账：补做销账（免费）
  const removeDebt = useCallback((debtId: string) => {
    setState(prev => ({ ...prev, debtList: prev.debtList.filter(d => d.id !== debtId) }));
  }, []);

  // 欠账：心愿银行赎买
  const payDebt = useCallback((debtId: string): boolean => {
    const debt = state.debtList.find(d => d.id === debtId);
    if (!debt) return false;
    if (state.records.bank[debt.ownerPlayerId] < DEBT_RANSOM) return false;
    setState(prev => {
      const bank: [number, number] = [...prev.records.bank] as [number, number];
      bank[debt.ownerPlayerId] -= DEBT_RANSOM;
      return {
        ...prev,
        records: { ...prev.records, bank },
        debtList: prev.debtList.filter(d => d.id !== debtId),
      };
    });
    return true;
  }, [state.debtList, state.records.bank]);

  // 欠账折算：销掉最早 2 笔，换 1 次额外惩罚抽取
  const convertDebts = useCallback((playerId: number): string | null => {
    const mine = state.debtList.filter(d => d.ownerPlayerId === playerId);
    if (mine.length < 2) return null;
    const spicy = state.mode === 'heat' && state.maxBand >= 2;
    const pool = punishmentPool(spicy);
    const text = drawFromPool(spicy ? '__pun_all__' : '__pun_mild__', pool) || pool[0];
    const removeIds = new Set(mine.slice(0, 2).map(d => d.id));
    setState(prev => ({ ...prev, debtList: prev.debtList.filter(d => !removeIds.has(d.id)) }));
    return text;
  }, [state.debtList, state.mode, state.maxBand, drawFromPool]);

  // 败者惩罚抽取（档次由本局最高温度带决定）
  const drawPunishment = useCallback((): string => {
    const spicy = state.mode === 'heat' && state.maxBand >= 2;
    const pool = punishmentPool(spicy);
    return drawFromPool(spicy ? '__pun_all__' : '__pun_mild__', pool) || pool[0];
  }, [state.mode, state.maxBand, drawFromPool]);

  // 删除自建主题（默认主题受保护，征服图鉴引用其 id）
  const deleteTheme = useCallback((themeId: string) => {
    if (CONQUER_LEVEL_IDS.includes(themeId)) return;
    setState(prev => ({
      ...prev,
      themes: prev.themes.filter(t => t.id !== themeId),
      players: prev.players.map(p => (p.themeId === themeId ? { ...p, themeId: null } : p)),
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'home',
      turn: 0,
      players: prev.players.map(p => ({ ...p, step: 0, shield: false, hearts: 0 })), // 保留 themeId
      boardMap: generateBoardMap(MODE_CONFIGS[prev.mode].plan),
      pathCoords: generateSpiralPath(),
      isRolling: false,
      drawnTaskMap: {},
      pendingTask: null,
      pendingLanding: null,
      pendingSync: null,
      match: freshMatch(),
      milestones: { halfway: false, sprint: false },
      shopUsage: {},
      frozenPlayerId: null,
      riggedRoll: null,
      heat: 0,
      pendingGate: null,
      maxBand: 0,
      queenBuff: null,
      // debtList / heatCeiling 保留
    }));
  }, []);

  return {
    state,
    switchView,
    selectTheme,
    renamePlayer,
    createTheme,
    updateThemeMeta,
    addThemeTask,
    removeThemeTask,
    importThemeTasks,
    startGame,
    rematch,
    movePlayer,
    applyMovement,
    endTurn,
    setIsRolling,
    recordRoll,
    applyBackfire,
    checkMilestones,
    settleMatch,
    setPendingTask,
    setPendingLanding,
    setPendingSync,
    grantThirteenFourteen,
    applyOutcomeMeta,
    gainShield,
    gainHearts,
    resolveLanding,
    resolveTask,
    resolveGate,
    resolveSync,
    swapTask,
    purchaseItem,
    consumeFrozen,
    consumeRigged,
    redeemWish,
    markWishRedeemed,
    removeDebt,
    payDebt,
    convertDebts,
    drawPunishment,
    deleteTheme,
    resetGame,
  };
}
