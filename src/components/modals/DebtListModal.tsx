import { X, ReceiptText, Check, Coins } from 'lucide-react';
import { DebtItem, Player } from '../../types';
import { ModalSheet } from '../ModalSheet';
import { DEBT_RANSOM } from '../../hooks/useGameState';

interface DebtListModalProps {
  isOpen: boolean;
  debtList: DebtItem[];
  players: Player[];
  bank: [number, number];
  onClose: () => void;
  onRemove: (debtId: string) => void;
  onPay: (debtId: string) => boolean;
}

export function DebtListModal({ isOpen, debtList, players, bank, onClose, onRemove, onPay }: DebtListModalProps) {
  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xl font-bold text-white">欠账清单</h3>
        <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        拒绝过的任务都会记在这里，跨局不清零。补做免费，赎买每张 {DEBT_RANSOM} 心愿银行 Hearts。
      </p>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-8">
        {debtList.length === 0 && (
          <div className="text-sm text-gray-500 bg-[#2C2C2E] rounded-xl p-4 border border-white/5">
            两袖清风，没有欠账。
          </div>
        )}
        {[...debtList].reverse().map(d => {
          const owner = players[d.ownerPlayerId];
          const afford = bank[d.ownerPlayerId] >= DEBT_RANSOM;
          return (
            <div key={d.id} className="p-3.5 bg-[#2C2C2E] rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <ReceiptText className="w-4 h-4 shrink-0 mt-0.5 text-[#FF9F0A]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white leading-relaxed">{d.task}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {owner?.name} 欠 · {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => onRemove(d.id)}
                  className="flex-1 h-8 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  补做完成
                </button>
                <button
                  disabled={!afford}
                  onClick={() => onPay(d.id)}
                  className="flex-1 h-8 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-40 active:scale-95 transition"
                >
                  <Coins className="w-3.5 h-3.5" />
                  赎买（{DEBT_RANSOM}）
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ModalSheet>
  );
}
