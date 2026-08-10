import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TaskEventData } from '../../types';
import { Heart, Lock, HandshakeIcon, HeartHandshake, Smile, RefreshCw, MessageCircle } from 'lucide-react';
import { useLockBody } from '../../hooks/useLockBody';
import { playSound } from '../../utils/sound';

interface TaskCardModalProps {
  isOpen: boolean;
  taskData: TaskEventData | null;
  onAccept: () => void;
  onReject: () => void;
  onSwap: () => boolean;
}

const iconMap: Record<string, ReactNode> = {
  favorite: <Heart className="w-10 h-10" />,
  lock: <Lock className="w-10 h-10" />,
  handshake: <HandshakeIcon className="w-10 h-10" />,
  duo: <HeartHandshake className="w-10 h-10" />,
  smile: <Smile className="w-10 h-10" />,
  message: <MessageCircle className="w-10 h-10" />,
};

export function TaskCardModal({ isOpen, taskData, onAccept, onReject, onSwap }: TaskCardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [swapFailed, setSwapFailed] = useState(false);

  useLockBody(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
      setSwapFailed(false);
    }
  }, [isOpen]);

  if (!isOpen || !taskData) return null;

  const rejectLabel =
    taskData.type === 'collision'
      ? '拒绝（回到起点 · 记账）'
      : taskData.type === 'duo'
        ? '拒绝（触发方倒退 1~3 格 · 记账）'
        : taskData.type === 'truth'
          ? '拒答（倒退 1 格 · 记账）'
          : '拒绝（倒退 1~3 格 · 记账）';

  const executorLine =
    taskData.type === 'duo'
      ? '双方共同执行'
      : taskData.type === 'truth'
        ? '由对方回答'
        : taskData.type === 'mini'
          ? '两人一起，轻松完成'
          : `由 ${taskData.executorPlayerId === 0 ? '男方' : '女方'} 执行`;

  const executorClass =
    taskData.type === 'duo' || taskData.type === 'mini' || taskData.type === 'truth'
      ? 'text-[#64D2FF]'
      : taskData.executorPlayerId === 0
        ? 'text-[#0A84FF]'
        : 'text-[#FF375F]';

  const icon = iconMap[taskData.icon] || iconMap.favorite;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div
        className="flip-card w-full max-w-xs aspect-[3/4] cursor-pointer"
        onClick={() => {
          if (!isFlipped) {
            playSound('flip');
            setIsFlipped(true);
          }
        }}
      >
        <div className={`flip-inner relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
          {/* 正面 */}
          <div className="flip-face absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF375F] to-[#BF5AF2] flex flex-col items-center justify-center gap-4 text-white shadow-2xl">
            <div className="opacity-90">{icon}</div>
            <h3 className="text-xl font-bold">{taskData.title}</h3>
            <span className="text-sm text-white/70">点击翻转查看任务</span>
          </div>

          {/* 背面：稀有卡金色边框 */}
          <div
            className={`flip-face flip-back absolute inset-0 rounded-3xl bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 p-6 text-center shadow-2xl ${
              taskData.rare
                ? 'border-2 border-[#FFD60A] shadow-[0_0_30px_rgba(255,214,10,0.25)]'
                : 'border border-white/10'
            }`}
          >
            <div className={taskData.color}>{icon}</div>
            <h3 className="text-lg font-bold text-white">{taskData.title}</h3>
            <p className="text-xs text-white/50">{taskData.subtitle}</p>
            <p className={`text-sm font-medium ${executorClass}`}>{executorLine}</p>
            <p className="text-base text-white leading-relaxed mt-2">{taskData.task}</p>

            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={onAccept}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] font-semibold text-white active:scale-95 transition"
              >
                {taskData.type === 'mini' ? '完成' : taskData.type === 'truth' ? '回答' : '接受挑战'}
              </button>
              {taskData.rejectable && !taskData.swapped && (
                <button
                  onClick={() => {
                    const ok = onSwap();
                    if (!ok) setSwapFailed(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-sm text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  换一张（倒退 1 格）
                </button>
              )}
              {swapFailed && <p className="text-xs text-white/50">没有更多卡片可换了</p>}
              {taskData.rejectable && (
                <button
                  onClick={onReject}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 text-sm active:scale-95 transition"
                >
                  {rejectLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
