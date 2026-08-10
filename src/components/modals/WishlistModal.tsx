import { useState } from 'react';
import { X, Gift, Check, Share2 } from 'lucide-react';
import { Player, Wish } from '../../types';
import { ModalSheet } from '../ModalSheet';
import { CouponShareModal } from './CouponShareModal';

interface WishlistModalProps {
  isOpen: boolean;
  wishlist: Wish[];
  players: Player[];
  bank: [number, number];
  onClose: () => void;
  onFulfill: (wishId: string) => void;
}

export function WishlistModal({ isOpen, wishlist, players, bank, onClose, onFulfill }: WishlistModalProps) {
  const [shareTarget, setShareTarget] = useState<Wish | null>(null);

  return (
    <>
      <ModalSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-bold text-white">愿望清单</h3>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          心愿银行：{players[0].name} {bank[0]} · {players[1].name} {bank[1]}（余额可随时在心愿商店兑换）
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-8">
          {wishlist.length === 0 && (
            <div className="text-sm text-gray-500 bg-[#2C2C2E] rounded-xl p-4 border border-white/5">
              还没有心愿券。赢下对局攒心愿银行，去「心愿商店」兑换第一张吧。
            </div>
          )}
          {[...wishlist].reverse().map(w => {
            const owner = players[w.ownerPlayerId];
            const done = w.redeemedAt !== null;
            return (
              <div
                key={w.id}
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  done ? 'bg-[#2C2C2E]/50 border-white/5 opacity-50' : 'bg-[#2C2C2E] border-white/10'
                }`}
              >
                <Gift className={`w-5 h-5 shrink-0 ${done ? 'text-gray-500' : 'text-[#FF9F0A]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {w.title}
                    <span className="ml-2 text-[10px] text-gray-500">属于 {owner?.name}</span>
                    {w.price === 0 && <span className="ml-1.5 text-[9px] text-[#30D158]">爱心商店</span>}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(w.createdAt).toLocaleDateString()} 兑换
                    {done && ` · ${new Date(w.redeemedAt!).toLocaleDateString()} 已兑现`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!done && (
                    <button
                      onClick={() => onFulfill(w.id)}
                      className="h-8 px-3 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center gap-1 active:scale-95 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      兑现
                    </button>
                  )}
                  <button
                    onClick={() => setShareTarget(w)}
                    className="h-8 px-3 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center gap-1 active:scale-95 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    分享
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ModalSheet>

      <CouponShareModal wish={shareTarget} players={players} onClose={() => setShareTarget(null)} />
    </>
  );
}
