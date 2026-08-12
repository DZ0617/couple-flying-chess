import { useState, useEffect } from 'react';
import { Player, Theme, GameMode, Records } from '../../types';
import { MODE_LIST } from '../../data/gameModes';
import { BAND_NAMES } from '../../utils/heat';
import { ChevronRight, User, UserRound, Flame, ReceiptText } from 'lucide-react';

interface HomeViewProps {
  players: Player[];
  themes: Theme[];
  records: Records;
  debtCount: number;
  onSelectTheme: (playerId: number) => void;
  onRenamePlayer: (playerId: number, name: string) => void;
  onStartGame: (mode: GameMode, heatCeiling: number) => void;
  onOpenWishShop: () => void;
  onOpenWishlist: () => void;
  onOpenDebts: () => void;
}

// 昵称输入走本地草稿：renamePlayer 会拦截空字符串，
// 直接受控输入会导致最后一个字删不掉（输入被立刻弹回旧值）。
// 改为失焦/回车时才 trim 提交，非空才生效，空值回弹原昵称。
function PlayerNameInput({
  playerId, name, isMale, onRename,
}: {
  playerId: number;
  name: string;
  isMale: boolean;
  onRename: (playerId: number, name: string) => void;
}) {
  const [draft, setDraft] = useState(name);

  // 外部改名（如恢复存档）时同步草稿
  useEffect(() => {
    setDraft(name);
  }, [name]);

  const commit = () => {
    const next = draft.trim();
    if (next) onRename(playerId, next);
    else setDraft(name);
  };

  return (
    <input
      value={draft}
      onClick={e => e.stopPropagation()}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      maxLength={8}
      className="bg-transparent text-base font-semibold text-white outline-none border-b border-transparent focus:border-white/30 w-full max-w-[160px]"
      placeholder={`${isMale ? '男方' : '女方'}昵称`}
    />
  );
}

export function HomeView({
  players, themes, records, debtCount,
  onSelectTheme, onRenamePlayer, onStartGame, onOpenWishShop, onOpenWishlist, onOpenDebts,
}: HomeViewProps) {
  const [mode, setMode] = useState<GameMode>('heat');
  const [ceiling, setCeiling] = useState(4); // 默认不设限
  const isHeat = mode === 'heat';
  const missingTheme = players.some(p => !p.themeId);

  return (
    <div className="flex-1 flex flex-col justify-start space-y-5 mt-4 overflow-y-auto no-scrollbar">
      {isHeat ? (
        /* —— 渐进之夜：今晚的约定 —— */
        <div className="ios-card border border-[#FF375F]/20 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-[#FF9F0A]" />
            <h2 className="text-lg font-semibold text-white">今晚的约定</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            完成任务温度上升，到闸口共同决定是否升温；上限是今晚的底线，不会越过。
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {BAND_NAMES.map((name, i) => (
              <button
                key={name}
                onClick={() => setCeiling(i)}
                className={`h-11 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all ${
                  ceiling === i
                    ? 'bg-[#FF375F]/15 border-[#FF375F]/60 text-white'
                    : 'bg-white/5 text-gray-500 border-white/5'
                }`}
              >
                <Flame className={`w-3 h-3 ${ceiling === i ? 'text-[#FF9F0A]' : 'text-gray-600'}`} />
                {name.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* —— 其他模式：选择主题包 —— */
        <div className="space-y-3">
          {players.map((player, idx) => {
            const theme = themes.find(t => t.id === player.themeId);
            const isMale = idx === 0;
            return (
              <div
                key={player.id}
                className="ios-card p-4 flex items-center justify-between ios-btn cursor-pointer border border-white/5"
                onClick={() => onSelectTheme(player.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg shrink-0"
                    style={{ backgroundColor: player.color, boxShadow: `0 10px 15px -3px ${player.color}30` }}
                  >
                    {isMale ? <User className="text-white" size={22} /> : <UserRound className="text-white" size={22} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <PlayerNameInput
                      playerId={player.id}
                      name={player.name}
                      isMale={isMale}
                      onRename={onRenamePlayer}
                    />
                    <div className="text-sm text-gray-400 mt-0.5 truncate">{theme?.name || '未选择主题'}</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-600 shrink-0" size={20} />
              </div>
            );
          })}
        </div>
      )}

      {/* 选择模式 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">选择模式</div>
        <div className="grid grid-cols-2 gap-2">
          {MODE_LIST.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                mode === m.id
                  ? m.id === 'heat'
                    ? 'bg-gradient-to-br from-[#FF375F] to-[#BF5AF2] text-white border-transparent'
                    : 'bg-white text-black border-white'
                  : 'bg-white/5 text-gray-300 border-white/5'
              }`}
            >
              <div className="text-sm font-bold flex items-center gap-1.5">
                {m.id === 'heat' && <Flame className="w-3.5 h-3.5" />}
                {m.name}
              </div>
              <div className={`text-[10px] mt-1 leading-snug ${
                mode === m.id ? (m.id === 'heat' ? 'text-white/70' : 'text-gray-600') : 'text-gray-500'
              }`}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 经济概览：收成一行，不再抢占主流程 */}
      <div className="ios-card border border-white/5 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {players.map(p => (
            <span key={p.id} className="flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-white/70">{p.name}</span>
              <span className="text-[#FF375F] font-bold tabular-nums">❤{records.bank[p.id]}</span>
              <span className="text-gray-600">{records.wins[p.id]}胜</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenDebts}
            className="h-8 px-2.5 rounded-full bg-white/5 text-[11px] font-semibold text-gray-300 ios-btn flex items-center gap-1"
          >
            <ReceiptText className="w-3 h-3 text-[#FF9F0A]" />
            欠账{debtCount > 0 && <span className="text-[#FF375F]">{debtCount}</span>}
          </button>
          <button
            onClick={onOpenWishlist}
            className="h-8 px-2.5 rounded-full bg-white/5 text-[11px] font-semibold text-gray-300 ios-btn"
          >
            清单
          </button>
          <button
            onClick={onOpenWishShop}
            className="h-8 px-3 rounded-full bg-white text-black text-[11px] font-bold ios-btn"
          >
            心愿商店
          </button>
        </div>
      </div>

      <div className="flex-1" />

      <div className="pb-8">
        <button
          className="w-full h-14 bg-white rounded-full text-black font-semibold text-lg shadow-lg ios-btn flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!isHeat && missingTheme}
          onClick={() => onStartGame(mode, ceiling)}
        >
          <span>{isHeat ? '开始今晚' : '开始游戏'}</span>
          <ChevronRight size={20} />
        </button>
        {!isHeat && missingTheme && (
          <p className="text-center text-xs text-gray-500 mt-2">
            还差 {players.filter(p => !p.themeId).length} 方未选主题
          </p>
        )}
      </div>
    </div>
  );
}
