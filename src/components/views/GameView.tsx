import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Player, PathCoord, TileType, TaskEventData, LandingOutcome, LandingMeta,
  Movement, GameMode, GrantFeed,
} from '../../types';
import { GameBoard } from '../GameBoard';
import { Dice } from '../Dice';
import { ToastStack, ToastItem } from '../Toast';
import {
  calculateNewPosition, rollDice, riggedDice, isExtraRoll, MAX_ROLLS_PER_TURN,
} from '../../utils/gameLogic';
import { MODE_CONFIGS } from '../../data/gameModes';
import { BAND_NAMES, effectiveBand } from '../../utils/heat';
import { playSound, isMuted, setMuted as setMutedPref } from '../../utils/sound';
import { ArrowLeft, HelpCircle, ShoppingBag, Heart, Volume2, VolumeX, Flame } from 'lucide-react';

const STEP_DELAY_MS = 220;
const CHAIN_DELAY_MS = 300;

type Phase = 'awaitRoll' | 'rolling' | 'moving' | 'resolving';

interface GameViewProps {
  players: Player[];
  boardMap: TileType[];
  pathCoords: PathCoord[];
  currentTurn: number;
  mode: GameMode;
  frozenPlayerId: number | null;
  riggedRoll: { playerId: number; total: number } | null;
  grantFeed: GrantFeed | null;
  pendingLanding: { landingStep: number; rollCount: number; dice: number[] } | null;
  heat: number;
  heatCeiling: number;
  modalOpen: boolean; // 有弹层盖住时禁用空格掷骰与掷骰按钮
  onMove: (steps: number) => void;
  onResolveLanding: (landingStep: number) => LandingOutcome;
  onApplyMovement: (m: Movement) => void;
  onApplyOutcomeMeta: (meta?: LandingMeta) => void;
  onGainShield: () => void;
  onGainHearts: (playerId: number, amount: number, reason: string) => void;
  onCheckMilestones: (step: number) => void;
  onConsumeFrozen: () => void;
  onConsumeRigged: () => void;
  onEndTurn: () => void;
  onSetRolling: (rolling: boolean) => void;
  onRecordRoll: () => void;
  onApplyBackfire: () => void;
  onSetPendingLanding: (p: { landingStep: number; rollCount: number; dice: number[] } | null) => void;
  onWin: (winnerId: number) => void;
  onTaskTrigger: (data: TaskEventData) => void;
  onSyncTrigger: (question: string) => void;
  onOpenShop: () => void;
  onBack: () => void;
  onOpenRules: () => void;
}

export function GameView({
  players, boardMap, pathCoords, currentTurn, mode,
  frozenPlayerId, riggedRoll, grantFeed, pendingLanding, heat, heatCeiling, modalOpen,
  onMove, onResolveLanding, onApplyMovement, onApplyOutcomeMeta, onGainShield,
  onGainHearts, onCheckMilestones, onConsumeFrozen, onConsumeRigged,
  onEndTurn, onSetRolling, onRecordRoll, onApplyBackfire, onSetPendingLanding,
  onWin, onTaskTrigger, onSyncTrigger, onOpenShop, onBack, onOpenRules,
}: GameViewProps) {
  const config = MODE_CONFIGS[mode];
  const modeBg: Record<GameMode, string> = {
    classic: 'bg-[#101826]',
    double: 'bg-[#1C1C1E]',
    truth: 'bg-[#0E1F1C]',
    heat: 'bg-[#1A0E14]',
  };
  const [diceValues, setDiceValues] = useState<number[] | null>(null);
  const [phase, setPhase] = useState<Phase>('awaitRoll');
  const [rollCount, setRollCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [muted, setMutedState] = useState(isMuted());
  const settledRef = useRef(0);
  const toastIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const resumedRef = useRef(false);

  // 统一计时器管理（B1）：所有动画 setTimeout 都经 later() 收集，卸载时全部清理
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Toast 生命周期独立于共享计时器池：不走 later()。
  // 原因：StrictMode 开发期会"挂载→模拟卸载→再挂载"，卸载清理会误杀共享池里的
  // Toast 消失计时器（Toast 永不消失）；独立 setTimeout 不受影响，
  // 且 React 18 中组件卸载后 setState 是安全 no-op。
  const pushToast = useCallback((text: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, text }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  // 经济播报：grantFeed → Toast。按 feed id 去重，
  // StrictMode 挂载即触发 effect 时不会重复弹同一条播报。
  const lastFeedIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!grantFeed || grantFeed.id === lastFeedIdRef.current) return;
    lastFeedIdRef.current = grantFeed.id;
    pushToast(grantFeed.text);
  }, [grantFeed, pushToast]);

  const resetTurnLocal = useCallback(() => {
    setDiceValues(null);
    setRollCount(0);
    setPhase('awaitRoll');
    settledRef.current = 0;
  }, []);

  useEffect(() => {
    resetTurnLocal();
  }, [currentTurn, resetTurnLocal]);

  // 刷新恢复结算：挂载时若存在未结算的落点，跳过动画直接结算
  useEffect(() => {
    if (resumedRef.current || !pendingLanding) return;
    resumedRef.current = true;
    // 延迟到挂载周期结束后执行：避开 StrictMode 开发期"挂载→卸载→再挂载"，
    // 防止结算链上的动画计时器被模拟卸载清掉（原生 setTimeout 不注册清理，故意存活）。
    window.setTimeout(() => {
      const me = players[currentTurn];
      if (me.step !== pendingLanding.landingStep) {
        // 先把棋子归位到落点，再结算（恢复路径没有走格动画）
        onApplyMovement({ playerId: me.id, from: me.step, to: pendingLanding.landingStep });
      }
      settleLanding(pendingLanding.landingStep, pendingLanding.rollCount, pendingLanding.dice);
      // pendingLanding 由 settleLanding 的 done() 统一清除
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 定身符：轮到被定身玩家时跳过本回合
  useEffect(() => {
    if (phase === 'awaitRoll' && frozenPlayerId === currentTurn) {
      pushToast(`${players[currentTurn].name} 被定身，跳过本回合`);
      onConsumeFrozen();
      later(() => onEndTurn(), 1200);
    }
  }, [phase, frozenPlayerId, currentTurn, players, onConsumeFrozen, onEndTurn, pushToast, later]);

  const handleRoll = useCallback(() => {
    if (phase !== 'awaitRoll') return;
    onSetRolling(true);
    onRecordRoll();
    playSound('dice');
    if (navigator.vibrate) navigator.vibrate(20);
    settledRef.current = 0;
    if (riggedRoll && riggedRoll.playerId === currentTurn) {
      setDiceValues(riggedDice(riggedRoll.total, config.diceCount));
      onConsumeRigged();
      pushToast('骰子被遥控了…');
    } else {
      setDiceValues(rollDice(config.diceCount));
    }
    setPhase('rolling');
  }, [phase, riggedRoll, currentTurn, config.diceCount, onSetRolling, onRecordRoll, onConsumeRigged, pushToast]);

  // 桌面端键盘操作：空格掷骰（有弹层盖住时禁用，防止穿透）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'awaitRoll' && !modalOpen) {
        e.preventDefault();
        handleRoll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, modalOpen, handleRoll]);

  const settleLanding = useCallback(
    (landingStep: number, currentRollCount: number, dice: number[]) => {
      setPhase('resolving');
      const outcome = onResolveLanding(landingStep);

      const playMovements = (idx: number, done: () => void) => {
        if (idx >= outcome.movements.length) {
          done();
          return;
        }
        onApplyMovement(outcome.movements[idx]);
        later(() => playMovements(idx + 1, done), CHAIN_DELAY_MS);
      };

      playMovements(0, () => {
        // 全部结算提交后才清除待结算落点：连锁动画期间刷新也能恢复
        onSetPendingLanding(null);
        // 动画播完统一提交 meta（护盾消耗 / 交换计数 / 落点 Hearts）
        onApplyOutcomeMeta(outcome.meta);

        // 里程碑以最终落点判定（含连锁/飞跃/漩涡位移）
        const activeMv = outcome.movements.filter(m => m.playerId === players[currentTurn].id);
        const finalPos = activeMv.length ? activeMv[activeMv.length - 1].to : landingStep;
        onCheckMilestones(finalPos);

        const final = outcome.final;

        if (final.kind === 'win') {
          playSound('win');
          onWin(currentTurn);
          return; // 胜利弹层接管，回合状态由下一局重置
        }

        if (final.kind === 'task') {
          onTaskTrigger(final.data); // 任务卡打断连掷，resolveTask 内换人
          return;
        }

        if (final.kind === 'sync') {
          playSound('flip');
          onSyncTrigger(final.question); // 默契卡接管，resolveSync 内换人
          return;
        }

        if (final.kind === 'teleport') { pushToast('漩涡传送！'); playSound('swap'); }
        if (final.kind === 'shieldGain') {
          onGainShield();
          pushToast('获得护盾！');
        }
        if (final.kind === 'shieldBlock') { pushToast('护盾抵挡了一次任务！'); playSound('shield'); }
        if (final.kind === 'swap') { pushToast('命运交换！'); playSound('swap'); }

        if (final.kind === 'extraRoll') {
          if (currentRollCount >= MAX_ROLLS_PER_TURN) {
            pushToast('已达连掷上限');
            onEndTurn();
          } else {
            pushToast(final.reason === 'tile' ? '再来一次！' : '再掷一次！');
            setDiceValues(null);
            setPhase('awaitRoll');
            settledRef.current = 0;
          }
          return;
        }

        // 非任务结算后，对子/6 获得连掷
        if (isExtraRoll(dice, config.extraRollRule)) {
          onGainHearts(players[currentTurn].id, 5, config.extraRollRule === 'doubles' ? '对子奖励' : '掷出 6');
          pushToast('再掷一次！');
          setDiceValues(null);
          setPhase('awaitRoll');
          settledRef.current = 0;
        } else {
          onEndTurn();
        }
      });
    },
    [
      onResolveLanding, onApplyMovement, onApplyOutcomeMeta, onCheckMilestones,
      onWin, onTaskTrigger, onSyncTrigger, onGainShield, onGainHearts, onEndTurn, onSetPendingLanding,
      players, currentTurn, config.extraRollRule, pushToast, later,
    ]
  );

  const handleDiceSettled = useCallback(() => {
    settledRef.current += 1;
    if (settledRef.current < config.diceCount || !diceValues) return;
    onSetRolling(false);

    const newCount = rollCount + 1;
    setRollCount(newCount);

    // 三连反噬：第 3 掷仍触发连掷 → 不移动，回起点并换人
    if (newCount >= MAX_ROLLS_PER_TURN && isExtraRoll(diceValues, config.extraRollRule)) {
      pushToast('三连！反噬回起点');
      playSound('backfire');
      onApplyBackfire();
      onEndTurn();
      return;
    }

    const steps = diceValues.reduce((a, b) => a + b, 0);
    const startStep = players[currentTurn].step;
    const landingStep = calculateNewPosition(startStep, steps);
    setPhase('moving');
    // 进入走棋动画前写入待结算落点（刷新后可恢复）
    onSetPendingLanding({ landingStep, rollCount: newCount, dice: diceValues });

    let moved = 0;
    const total = landingStep - startStep;
    const stepOnce = () => {
      onMove(1);
      playSound('step');
      moved += 1;
      if (moved < total) {
        later(stepOnce, STEP_DELAY_MS);
        return;
      }
      later(() => settleLanding(landingStep, newCount, diceValues), STEP_DELAY_MS);
    };
    later(stepOnce, STEP_DELAY_MS);
  }, [
    diceValues, rollCount, players, currentTurn, config,
    onSetRolling, onApplyBackfire, onEndTurn, onMove, onSetPendingLanding, pushToast, settleLanding, later,
  ]);

  const activePlayer = players[currentTurn];

  return (
    <div className={`fixed inset-0 z-50 ${modeBg[mode]} text-white flex flex-col overflow-y-auto`}>
      <header className="flex items-center justify-between px-4 py-3 shrink-0 md:max-w-5xl md:mx-auto md:w-full">
        <button onClick={onBack} disabled={modalOpen} className="p-2 -ml-2 text-white/70 hover:text-white disabled:opacity-40" aria-label="返回">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenShop}
          disabled={phase !== 'awaitRoll' || modalOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 disabled:opacity-40 active:scale-95 transition"
        >
          <ShoppingBag className="w-4 h-4 text-[#FF9F0A]" />
          <Heart className="w-3.5 h-3.5 text-[#FF375F]" />
          <span className="text-sm font-semibold">{activePlayer.hearts}</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const next = !muted;
              setMutedPref(next);
              setMutedState(next);
            }}
            className="p-2 text-white/70 hover:text-white" aria-label={muted ? '取消静音' : '静音'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={onOpenRules} disabled={modalOpen} className="p-2 -mr-2 text-white/70 hover:text-white disabled:opacity-40" aria-label="规则">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center gap-3 py-2 shrink-0">
        {players.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              p.id === currentTurn ? 'bg-white/15 ring-1 ring-white/40' : 'opacity-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-sm">{p.name}</span>
            <span key={p.hearts} className="text-xs text-[#FF375F] font-semibold tabular-nums animate-ping-once">
              ❤{p.hearts}
            </span>
          </div>
        ))}
      </div>

      {/* 渐进之夜：温度条 */}
      {mode === 'heat' && (
        <div className="w-full max-w-sm md:max-w-md mx-auto px-4 pb-1 shrink-0">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="flex items-center gap-1 text-[#FF9F0A] font-semibold">
              <Flame className="w-3 h-3" />
              {BAND_NAMES[effectiveBand(heat, heatCeiling)]}
            </span>
            <span className="text-white/40 tabular-nums">{heat}°</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF9F0A] via-[#FF375F] to-[#BF5AF2] transition-all duration-500"
              style={{ width: `${heat}%` }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-4 gap-6 md:gap-10 pb-10 md:max-w-5xl md:mx-auto md:w-full">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg md:shrink-0">
          <GameBoard boardMap={boardMap} pathCoords={pathCoords} players={players} currentTurn={currentTurn} />
        </div>

        <div className="flex flex-col items-center gap-4 md:bg-white/5 md:border md:border-white/10 md:rounded-3xl md:p-8 md:w-80">
          <div className="flex items-center gap-4 min-h-[64px]">
            {Array.from({ length: config.diceCount }).map((_, i) => (
              <Dice
                key={i}
                value={diceValues ? diceValues[i] : null}
                rolling={phase === 'rolling'}
                delay={i * 150}
                onSettled={handleDiceSettled}
              />
            ))}
          </div>
          <button
            onClick={handleRoll}
            disabled={phase !== 'awaitRoll' || modalOpen}
            className="px-10 py-3 md:w-full rounded-full bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] font-semibold disabled:opacity-40 active:scale-95 transition"
          >
            {phase === 'awaitRoll'
              ? rollCount > 0
                ? `再掷一次（第 ${rollCount + 1} 掷）`
                : `轮到${activePlayer.name} · 掷骰子`
              : '进行中…'}
          </button>
          {/* 桌面端额外显示双方资产明细 */}
          <div className="hidden md:flex w-full justify-between text-xs text-white/50 pt-2 border-t border-white/10">
            {players.map(p => (
              <span key={p.id}>{p.name} ❤{p.hearts} · 第 {p.step} 格</span>
            ))}
          </div>
        </div>
      </main>

      <ToastStack toasts={toasts} />
    </div>
  );
}
