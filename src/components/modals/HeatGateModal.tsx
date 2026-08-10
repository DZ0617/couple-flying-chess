import { Flame, Snowflake } from 'lucide-react';
import { BAND_NAMES } from '../../utils/heat';

interface HeatGateModalProps {
  isOpen: boolean;
  band: number; // 即将进入的温度带（1~4）
  onChoice: (stimulate: boolean) => void;
}

export function HeatGateModal({ isOpen, band, onChoice }: HeatGateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[118] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="w-full max-w-xs rounded-3xl bg-[#1C1C1E] border border-[#FF375F]/30 p-6 text-center shadow-[0_0_40px_rgba(255,55,95,0.25)]">
        <Flame className="w-10 h-10 text-[#FF9F0A] mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-1">温度在上升…</h3>
        <p className="text-sm text-white/60 leading-relaxed mb-1">
          接下来的任务将进入
          <span className="text-[#FF375F] font-semibold">「{BAND_NAMES[band]}」</span>
        </p>
        <p className="text-xs text-white/40 mb-6">问问彼此现在的感受，再决定</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onChoice(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF9F0A] via-[#FF375F] to-[#BF5AF2] font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Flame className="w-4 h-4" />
            要，再刺激一点
          </button>
          <button
            onClick={() => onChoice(false)}
            className="w-full py-3 rounded-xl bg-white/10 text-sm font-semibold text-white/80 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Snowflake className="w-4 h-4" />
            不要，缓一缓（-8°）
          </button>
        </div>
      </div>
    </div>
  );
}
