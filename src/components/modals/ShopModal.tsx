import { useEffect, useMemo, useState } from 'react';
import { X, Heart, Minus, Plus } from 'lucide-react';
import { Player, GameMode } from '../../types';
import { SHOP_ITEMS, SHOP_CATEGORY_LABEL, ShopCategory, ShopItem } from '../../data/shopItems';
import { MODE_CONFIGS } from '../../data/gameModes';
import { ModalSheet } from '../ModalSheet';

interface ShopModalProps {
  isOpen: boolean;
  buyer: Player;
  opponent: Player;
  mode: GameMode;
  usage: Record<string, number>;
  onClose: () => void;
  onPurchase: (itemId: string, opts?: { total?: number }) => boolean;
}

export function ShopModal({ isOpen, buyer, opponent, mode, usage, onClose, onPurchase }: ShopModalProps) {
  const [tab, setTab] = useState<ShopCategory>('tactical');
  const [rigTarget, setRigTarget] = useState<ShopItem | null>(null);
  const [rigTotal, setRigTotal] = useState(7);
  const [confirmNuke, setConfirmNuke] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTab('tactical');
    setRigTarget(null);
    setConfirmNuke(false);
    const cfg = MODE_CONFIGS[mode];
    setRigTotal(cfg.diceCount === 1 ? 3 : 7);
  }, [isOpen, mode]);

  const items = useMemo(() => SHOP_ITEMS.filter(i => i.category === tab), [tab]);

  if (!isOpen) return null;

  const cfg = MODE_CONFIGS[mode];
  const rigMin = cfg.diceCount === 1 ? 1 : 2;
  const rigMax = cfg.diceCount === 1 ? 6 : 12;

  const disabledReason = (item: ShopItem): string | null => {
    if (item.femaleOnly && buyer.role !== 'female') return '女方专属';
    if (buyer.hearts < item.price) return 'Hearts 不足';
    if (item.leaderRestricted && buyer.hearts > opponent.hearts * 1.5) return '领先过多时不可用';
    if (item.limitPerMatch && (usage[item.id] ?? 0) >= item.limitPerMatch) return '本局已用完';
    if (item.id === 'robinhood' && buyer.hearts >= opponent.hearts) return '你并不比对方穷';
    return null;
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">爱心商店</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#FF375F] font-bold">
            <Heart className="w-4 h-4" /> {buyer.hearts}
          </span>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(Object.keys(SHOP_CATEGORY_LABEL) as ShopCategory[]).map(c => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`h-9 rounded-xl text-sm font-semibold border transition ${
              tab === c ? 'bg-white text-black border-white' : 'bg-[#2C2C2E] text-gray-300 border-white/5'
            }`}
          >
            {SHOP_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-8">
        {items.map(item => {
          const reason = disabledReason(item);
          return (
            <div key={item.id} className="p-3.5 bg-[#2C2C2E] rounded-xl border border-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {item.name}
                    {item.limitPerMatch && (
                      <span className="ml-2 text-[10px] text-gray-500">限购 {item.limitPerMatch} 次/局</span>
                    )}
                    {item.femaleOnly && (
                      <span className="ml-2 text-[10px] text-[#FF375F]">女方专属</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug">{item.desc}</div>
                  {reason && <div className="text-[10px] text-[#FF453A] mt-1">{reason}</div>}
                </div>
                <button
                  disabled={!!reason}
                  onClick={() => {
                    if (item.id === 'nuke' && !confirmNuke) {
                      setConfirmNuke(true);
                      return;
                    }
                    if (item.needsRigTotal) {
                      setRigTarget(item);
                    } else {
                      onPurchase(item.id);
                    }
                    if (item.id !== 'nuke') setConfirmNuke(false);
                  }}
                  className="shrink-0 h-9 px-3 rounded-full bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-white text-sm font-bold disabled:opacity-30 active:scale-95 transition flex items-center gap-1"
                >
                  {item.id === 'nuke' && confirmNuke ? (
                    '确认清零？'
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5" />
                      {item.price}
                    </>
                  )}
                </button>
              </div>

              {rigTarget?.id === item.id && (
                <div className="mt-3 flex items-center justify-between gap-3 bg-black/30 rounded-xl p-2.5">
                  <span className="text-xs text-gray-300">指定对方总点数</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRigTotal(t => Math.max(rigMin, t - 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{rigTotal}</span>
                    <button
                      onClick={() => setRigTotal(t => Math.min(rigMax, t + 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (onPurchase(item.id, { total: rigTotal })) setRigTarget(null);
                      }}
                      className="h-8 px-3 rounded-lg bg-white text-black text-xs font-bold"
                    >
                      确认
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalSheet>
  );
}
