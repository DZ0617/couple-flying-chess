import { useState } from 'react';
import { Player, MatchStats, Records, DebtItem, GameMode } from '../../types';
import { Trophy, RotateCcw, Gift, Flame, Home, ReceiptText, Check, Coins } from 'lucide-react';
import { DEBT_RANSOM } from '../../hooks/useGameState';

interface WinModalProps {
  isOpen: boolean;
  winner: Player | null;
  players: Player[];
  match: MatchStats;
  records: Records;
  debtList: DebtItem[];
  mode: GameMode;
  maxBand: number;
  onDrawPunishment: () => string;
  onRemoveDebt: (debtId: string) => void;
  onPayDebt: (debtId: string) => boolean;
  onConvertDebts: (playerId: number) => string | null; // 2 张欠账折 1 次惩罚，返回惩罚文本
  onOpenWishShop: () => void;
  onRematch: () => void;
  onGoHome: () => void;
}

const BAND_NAMES = ['甜蜜带', '暧昧带', '烈火带', '诱惑带', '灵肉带'];

export function WinModal({
  isOpen, winner, players, match, records, debtList, mode, maxBand,
  onDrawPunishment, onRemoveDebt, onPayDebt, onConvertDebts,
  onOpenWishShop, onRematch, onGoHome,
}: WinModalProps) {
  const [act, setAct] = useState<'report' | 'punish'>('report');
  const [punishment, setPunishment] = useState<string | null>(null);
  const [extraPunishment, setExtraPunishment] = useState<string | null>(null);

  if (!isOpen || !winner) return null;

  const loser = players[winner.id === 0 ? 1 : 0];
  // 用结算时刻算用时，刷新结算页不虚增
  const endedAt = match.endedAt ?? Date.now();
  const minutes = Math.max(1, Math.round((endedAt - match.startedAt) / 60000));
  const spicyUnlocked = mode === 'heat' && maxBand >= 2;

  const stats: { label: string; value: string }[] = [
    { label: '本局用时', value: `约 ${minutes} 分钟` },
    { label: '掷骰次数', value: `${match.rolls}` },
    { label: '完成任务', value: `${match.tasksCompleted}` },
    { label: '命运交换', value: `${match.swaps}` },
    { label: `${players[0].name}收入`, value: `❤ ${match.heartsEarned[0]}` },
    { label: `${players[1].name}收入`, value: `❤ ${match.heartsEarned[1]}` },
  ];

  const titles: string[] = [];
  if (records.winStreak[winner.id] >= 5) titles.push('情场棋圣');
  if (match.backfires >= 2) titles.push('天谴之人');
  if (match.heartsEarned[winner.id] >= 300) titles.push('爱心富豪');
  if (match.swaps >= 2) titles.push('命运操盘手');
  if (mode === 'heat' && maxBand >= 4) titles.push('灵肉合一');
  else if (mode === 'heat' && maxBand >= 2) titles.push('干柴烈火');

  const debtSection = (p: Player) => {
    const mine = debtList.filter(d => d.ownerPlayerId === p.id);
    const afford = records.bank[p.id] >= DEBT_RANSOM;
    return (
      <div key={p.id} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/80">
            {p.name}的欠账 <span className="text-gray-500">· {mine.length} 笔</span>
          </span>
          <button
            disabled={mine.length < 2}
            onClick={() => {
              const text = onConvertDebts(p.id);
              if (text) setExtraPunishment(text);
            }}
            className="h-7 px-2.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] text-[10px] font-bold disabled:opacity-30 active:scale-95 transition"
          >
            折算：2 笔 → 1 次惩罚
          </button>
        </div>
        {mine.length === 0 && (
          <div className="text-[11px] text-gray-600 bg-black/20 rounded-xl p-3">无欠账，一身轻</div>
        )}
        <div className="space-y-2">
          {mine.map(d => (
            <div key={d.id} className="p-3 bg-black/30 rounded-xl border border-white/5">
              <div className="text-xs text-white leading-relaxed mb-2">{d.task}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRemoveDebt(d.id)}
                  className="flex-1 h-7 rounded-full bg-white/10 text-[10px] font-semibold text-white flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Check className="w-3 h-3" /> 当场补做
                </button>
                <button
                  disabled={!afford}
                  onClick={() => onPayDebt(d.id)}
                  className="flex-1 h-7 rounded-full bg-white/10 text-[10px] font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-40 active:scale-95 transition"
                >
                  <Coins className="w-3 h-3" /> 赎买 {DEBT_RANSOM}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-xs rounded-3xl bg-[#2C2C2E] border border-white/10 p-6 text-center shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">

        {act === 'report' ? (
          <>
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-1">{winner.name}获胜！</h3>
            <p className="text-xs text-white/50 mb-4">
              累计战绩：{players[0].name} {records.wins[0]} 胜 : {records.wins[1]} 胜 {players[1].name}
              <br />
              心愿银行：{records.bank[0]} : {records.bank[1]}
              {mode === 'heat' && (
                <>
                  <br />
                  今晚最高温度带：{BAND_NAMES[maxBand]}
                </>
              )}
            </p>

            {titles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {titles.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] text-[10px] font-bold">
                    ✦ {t}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-5">
              {stats.map(s => (
                <div key={s.label} className="rounded-xl bg-white/5 py-2.5">
                  <div className="text-sm font-semibold text-white">{s.value}</div>
                  <div className="text-[10px] text-white/50">{s.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAct('punish')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF9F0A] to-[#FF375F] font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Flame className="w-4 h-4" />
              进入惩罚与清算
            </button>
          </>
        ) : (
          <>
            <div className="text-left mb-4">
              <h3 className="text-lg font-bold text-white text-center mb-1">惩罚时间</h3>
              <p className="text-[10px] text-gray-500 text-center">
                {spicyUnlocked ? '今晚到过烈火带：升温档惩罚已解锁' : '惩罚池：搞笑档 + 甜蜜档'}
              </p>
            </div>

            {/* 败者惩罚券 */}
            <div className="rounded-2xl bg-black/30 border border-[#FF375F]/20 p-4 mb-4">
              <div className="text-xs text-white/60 mb-2 text-center">
                {winner.name}，给 {loser.name} 抽一张
              </div>
              {punishment ? (
                <div className="text-sm text-white leading-relaxed text-center py-2">{punishment}</div>
              ) : (
                <button
                  onClick={() => setPunishment(onDrawPunishment())}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-sm font-semibold text-white active:scale-95 transition"
                >
                  抽惩罚
                </button>
              )}
              {extraPunishment && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-[10px] text-[#FF9F0A] mb-1 text-center">折算追加惩罚</div>
                  <div className="text-sm text-white leading-relaxed text-center">{extraPunishment}</div>
                </div>
              )}
            </div>

            {/* 欠账清算 */}
            <div className="text-left mb-2 flex items-center gap-1.5">
              <ReceiptText className="w-4 h-4 text-[#FF9F0A]" />
              <span className="text-sm font-semibold text-white">欠账清算</span>
            </div>
            <div className="text-left">
              {debtSection(loser)}
              {debtSection(winner)}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={onOpenWishShop}
                className="w-full py-3 rounded-xl bg-white/10 text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Gift className="w-4 h-4 text-[#FF9F0A]" />
                查看心愿商店
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onGoHome}
                  className="py-3 rounded-xl bg-white/10 text-sm font-semibold text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Home className="w-4 h-4" />
                  回首页
                </button>
                <button
                  onClick={onRematch}
                  className="py-3 rounded-xl bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] font-semibold text-white flex items-center justify-center gap-1.5 active:scale-95 transition text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  再来一局
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
