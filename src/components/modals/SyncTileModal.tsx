import { useEffect, useState } from 'react';
import { Users, Eye, PartyPopper, Frown } from 'lucide-react';
import { Player, SyncChallenge, SyncResult } from '../../types';
import { useLockBody } from '../../hooks/useLockBody';
import { playSound } from '../../utils/sound';

type Stage = 'answer' | 'judge' | 'result';

interface SyncTileModalProps {
  isOpen: boolean;
  challenge: SyncChallenge | null;
  players: Player[];
  onResolve: (matched: boolean) => SyncResult; // 返回实际结算数值（Hearts/温度），结果页据此展示
  onClose: () => void;
}

export function SyncTileModal({ isOpen, challenge, players, onResolve, onClose }: SyncTileModalProps) {
  const [stage, setStage] = useState<Stage>('answer');
  const [ansA, setAnsA] = useState('');
  const [ansB, setAnsB] = useState('');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [matched, setMatched] = useState(false);

  useLockBody(isOpen);

  useEffect(() => {
    if (isOpen) {
      setStage('answer');
      setAnsA('');
      setAnsB('');
      setResult(null);
      setMatched(false);
    }
  }, [isOpen]);

  if (!isOpen || !challenge) return null;

  const judge = (ok: boolean) => {
    setMatched(ok);
    setResult(onResolve(ok));
    if (ok) playSound('hearts'); else playSound('backfire');
    setStage('result');
  };

  return (
    <div className="fixed inset-0 z-[116] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-xs rounded-3xl bg-[#2C2C2E] border border-[#FFD60A]/30 p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="text-center mb-4">
          <Users className="w-8 h-8 text-[#FFD60A] mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white">默契考验</h3>
        </div>

        <p className="text-base text-white text-center leading-relaxed mb-5 px-1">
          {challenge.question}
        </p>

        {stage === 'answer' && (
          <div className="space-y-3">
            {[
              { label: `${players[0].name}的答案（别让 TA 看）`, value: ansA, set: setAnsA },
              { label: `${players[1].name}的答案（别让 TA 看）`, value: ansB, set: setAnsB },
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] text-gray-500">{f.label}</div>
                <input
                  type="text"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="text-mask w-full h-11 px-4 rounded-xl bg-black/30 text-white outline-none border border-white/10 focus:border-[#FFD60A]/50"
                  placeholder="各自悄悄写下答案"
                />
              </div>
            ))}
            <button
              disabled={!ansA.trim() || !ansB.trim()}
              onClick={() => { playSound('flip'); setStage('judge'); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD60A] to-[#FF9F0A] font-semibold text-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition"
            >
              <Eye className="w-4 h-4" />
              同时揭晓
            </button>
          </div>
        )}

        {stage === 'judge' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-black/30 p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">{players[0].name}</div>
                <div className="text-sm font-semibold text-white break-words">{ansA}</div>
              </div>
              <div className="rounded-xl bg-black/30 p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">{players[1].name}</div>
                <div className="text-sm font-semibold text-white break-words">{ansB}</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 text-center">算不算一致，你们自己说了算</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => judge(true)}
                className="py-3 rounded-xl bg-[#30D158]/20 border border-[#30D158]/40 text-[#30D158] font-semibold active:scale-95 transition"
              >
                算一致！
              </button>
              <button
                onClick={() => judge(false)}
                className="py-3 rounded-xl bg-white/10 text-white/70 font-semibold active:scale-95 transition"
              >
                这也能算？
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="space-y-4 text-center">
            {matched ? (
              <>
                <PartyPopper className="w-10 h-10 text-[#FFD60A] mx-auto" />
                <p className="text-base font-semibold text-white">默契满分！</p>
                <p className="text-xs text-white/60">
                  双方 +{result?.hearts ?? 10} Hearts
                  {result?.heat != null ? `，温度 +${result.heat}°` : ''}
                </p>
              </>
            ) : (
              <>
                <Frown className="w-10 h-10 text-[#FF9F0A] mx-auto" />
                <p className="text-base font-semibold text-white">默契值为零…</p>
                <div className="rounded-xl bg-[#FF375F]/10 border border-[#FF375F]/30 p-3">
                  <div className="text-[10px] text-[#FF375F] mb-1">小惩罚</div>
                  <div className="text-sm text-white">{result?.punishment}</div>
                </div>
                {result?.heat != null && (
                  <p className="text-[10px] text-white/40">温度 +{result.heat}°</p>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold active:scale-95 transition"
            >
              {matched ? '继续游戏' : '认罚，继续'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
