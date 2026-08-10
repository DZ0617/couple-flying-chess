import { X, Heart, Gift, Lock, Trophy } from 'lucide-react';
import { Player, Records, Theme } from '../../types';
import { WISH_ITEMS, CONQUER_LEVEL_IDS } from '../../data/shopItems';
import { isQixi } from '../../utils/events';
import { ModalSheet } from '../ModalSheet';

interface WishShopModalProps {
  isOpen: boolean;
  players: Player[];
  records: Records;
  themes: Theme[];
  onClose: () => void;
  onRedeem: (wishItemId: string, playerId: number) => boolean;
}

export function WishShopModal({ isOpen, players, records, themes, onClose, onRedeem }: WishShopModalProps) {
  if (!isOpen) return null;

  const themeName = (id: string) => themes.find(t => t.id === id)?.name ?? id;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">心愿商店</h3>
        <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-8">
        {players.map(player => {
          const bank = records.bank[player.id];
          const conquered = records.conquered[player.id];
          const conquerAll = CONQUER_LEVEL_IDS.every(id => conquered.includes(id));
          return (
            <div key={player.id} className="rounded-2xl bg-[#2C2C2E] border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-semibold text-white">{player.name}</span>
                </div>
                <span className="flex items-center gap-1 text-[#FF375F] font-bold text-sm">
                  <Heart className="w-4 h-4" /> {bank}
                </span>
              </div>

              {/* 征服进度 */}
              <div className="mb-3">
                <div className="text-[10px] text-gray-500 mb-1.5">
                  难度征服 {conquered.filter(id => CONQUER_LEVEL_IDS.includes(id)).length}/5
                  （用该难度主题赢一局即点亮）
                </div>
                <div className="flex gap-1.5">
                  {CONQUER_LEVEL_IDS.map(id => {
                    const done = conquered.includes(id);
                    return (
                      <div
                        key={id}
                        className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[9px] font-medium ${
                          done ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-black/30 text-gray-600'
                        }`}
                      >
                        {done ? <Trophy className="w-3 h-3" /> : themeName(id).slice(0, 2)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 商品（七夕限定券仅当天可见） */}
              <div className="space-y-2">
                {WISH_ITEMS.filter(w => w.id !== 'qixi2026' || isQixi()).map(w => {
                  const gated = w.needsConquerAll && !conquerAll;
                  const afford = bank >= w.price && !gated;
                  return (
                    <div key={w.id} className="flex items-center justify-between gap-2 bg-black/20 rounded-xl p-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                          {w.name}
                          {gated && <Lock className="w-3 h-3 text-gray-500" />}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-snug">
                          {gated ? '需征服全部 5 个难度后解锁' : w.desc}
                        </div>
                      </div>
                      <button
                        disabled={!afford}
                        onClick={() => onRedeem(w.id, player.id)}
                        className="shrink-0 h-8 px-3 rounded-full bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-xs font-bold text-white disabled:opacity-30 active:scale-95 transition"
                      >
                        {w.price}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 text-center flex items-center justify-center gap-1">
        <Gift className="w-3 h-3" />
        兑换后进入「愿望清单」，由对方兑现
      </p>
    </ModalSheet>
  );
}
