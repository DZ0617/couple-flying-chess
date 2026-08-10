import { useState } from 'react';
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

export function HomeView({
  players, themes, records, debtCount,
  onSelectTheme, onRenamePlayer, onStartGame, onOpenWishShop, onOpenWishlist, onOpenDebts,
}: HomeViewProps) {
  const [mode, setMode] = useState<GameMode>('heat');
  const [ceiling, setCeiling] = useState(4); // 默认不设限
  const isHeat = mode === 'heat';

  return (
    <div className="flex-1 flex flex-col justify-start space-y-6 mt-6 overflow-y-auto no-scrollbar">
      {isHeat ? (
        /* —— 渐进之夜：今晚的约定 —— */
        <div className="ios-card border border-[#FF375F]/20 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-[#FF9F0A]" />
            <h2 className="text-lg font-semibold text-white">今晚的约定</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            从甜蜜带开始，完成任务温度上升，到闸口时由你们共同决定是否升温。上限是今晚的底线，游戏不会越过它。
          </p>
          <div className="text-xs text-gray-400 mb-2">温度上限（今晚最远到哪一带）</div>
          <div className="grid grid-cols-5 gap-1.5">
            {BAND_NAMES.map((name, i) => (
              <button
                key={name}
                onClick={() => setCeiling(i)}
                className={`h-11 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all ${
                  ceiling === i
                    ? 'bg-gradient-to-b from-[#FF375F] to-[#BF5AF2] text-white border-transparent'
                    : 'bg-[#2C2C2E] text-gray-400 border-white/5'
                }`}
              >
                <Flame className={`w-3 h-3 ${ceiling === i ? 'text-white' : i <= 1 ? 'text-[#FF9F0A]/50' : 'text-[#FF375F]/50'}`} />
                {name.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* —— 其他模式：选择主题包 —— */
        <>
          <div className="text-center">
            <h2 className="text-xl text-gray-300 font-medium">配置游戏角色</h2>
            <p className="text-sm text-gray-500 mt-2">选择双方的任务主题包</p>
          </div>
          <div className="space-y-4">
            {players.map((player, idx) => {
              const theme = themes.find(t => t.id === player.themeId);
              const isMale = idx === 0;
              return (
                <div
                  key={player.id}
                  className="ios-card p-5 flex items-center justify-between ios-btn cursor-pointer group border border-white/5"
                  onClick={() => onSelectTheme(player.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg shrink-0"
                      style={{ backgroundColor: player.color, boxShadow: `0 10px 15px -3px ${player.color}30` }}
                    >
                      {isMale ? <User className="text-white" size={24} /> : <UserRound className="text-white" size={24} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        value={player.name}
                        onClick={e => e.stopPropagation()}
                        onChange={e => onRenamePlayer(player.id, e.target.value)}
                        maxLength={8}
                        className="bg-transparent text-base font-semibold text-white outline-none border-b border-transparent focus:border-white/30 w-full max-w-[160px]"
                        placeholder={`${isMale ? '男方' : '女方'}昵称`}
                      />
                      <div className="text-sm font-medium text-white mt-0.5 truncate">{theme?.name || '未选择主题'}</div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-600 shrink-0" size={20} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 经济面板 */}
      <div className="ios-card border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">心愿银行</span>
          <div className="flex gap-2">
            <button
              onClick={onOpenDebts}
              className="h-8 px-3 rounded-full bg-white/10 text-xs font-semibold text-white ios-btn flex items-center gap-1"
            >
              <ReceiptText className="w-3.5 h-3.5 text-[#FF9F0A]" />
              欠账{debtCount > 0 && <span className="text-[#FF375F]">·{debtCount}</span>}
            </button>
            <button
              onClick={onOpenWishShop}
              className="h-8 px-3 rounded-full bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-xs font-bold text-white ios-btn"
            >
              心愿商店
            </button>
            <button
              onClick={onOpenWishlist}
              className="h-8 px-3 rounded-full bg-white/10 text-xs font-semibold text-white ios-btn"
            >
              愿望清单
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {players.map(p => (
            <div key={p.id} className="rounded-xl bg-black/30 p-3 text-center">
              <div className="text-xs text-gray-400">{p.name}</div>
              <div className="text-lg font-bold text-[#FF375F]">❤ {records.bank[p.id]}</div>
              <div className="text-[10px] text-gray-600">
                {records.wins[p.id]} 胜 · 连胜 {records.winStreak[p.id]}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-600 mt-2 text-center">共对局 {records.games} 场</div>
      </div>

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
                  : 'bg-[#2C2C2E] text-gray-300 border-white/5'
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

      <div className="flex-1" />

      <div className="mb-8">
        <button
          className="w-full h-14 bg-white rounded-full text-black font-semibold text-lg shadow-lg ios-btn flex items-center justify-center gap-2 mb-8 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!isHeat && players.some(p => !p.themeId)}
          onClick={() => onStartGame(mode, ceiling)}
        >
          <span>{isHeat ? '开始今晚' : '开始游戏'}</span>
          <ChevronRight size={20} />
        </button>
        {!isHeat && players.some(p => !p.themeId) && (
          <p className="text-center text-xs text-gray-500 mt-[-24px] mb-8">
            还差 {players.filter(p => !p.themeId).length} 方未选主题
          </p>
        )}
      </div>
    </div>
  );
}
