import { useState, useEffect, useId } from 'react';
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

const HEART_PATH =
  'M12 21C7 16.9 3.4 13.3 3.4 9.3 3.4 6.3 5.5 4.3 8 4.3c1.6 0 3 .8 4 2.1 1-1.3 2.4-2.1 4-2.1 2.5 0 4.6 2 4.6 5 0 4-3.6 7.6-8.6 11.7Z';

// 封面：斜贴心形暗纹
function CoverPattern({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <pattern id={id} width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <path d={HEART_PATH} transform="translate(11 11)" fill="#FFFFFF" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// 卡背：细点纸纹
function BackPattern({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// 稀有卡：烫金流光描边（pathLength 归一化 → dash 动画与卡片实际渲染尺寸无关）
function RareFlowBorder({ id }: { id: string }) {
  return (
    <svg
      className="svg-anim absolute inset-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#FF9F0A" />
          <stop offset="100%" stopColor="#FFE066" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx="21"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="4"
        pathLength={100}
        strokeDasharray="14 86"
        strokeLinecap="round"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3.2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

export function TaskCardModal({ isOpen, taskData, onAccept, onReject, onSwap }: TaskCardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [swapFailed, setSwapFailed] = useState(false);
  const uid = useId().replace(/:/g, '');

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
          {/* 正面：渐变 + 心形暗纹 + 顶部高光 */}
          <div className="flip-face absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-[#FF375F] to-[#BF5AF2] flex flex-col items-center justify-center text-white shadow-2xl">
            <CoverPattern id={`cp${uid}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-4">
              <div className="opacity-90">{icon}</div>
              <h3 className="text-xl font-bold">{taskData.title}</h3>
              <span className="text-sm text-white/70">点击翻转查看任务</span>
            </div>
          </div>

          {/* 背面：深色纸感 + 稀有卡烫金流光 */}
          <div
            className={`flip-face flip-back absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-b from-[#28282F] to-[#1D1D23] flex flex-col items-center justify-center p-6 text-center shadow-2xl ${
              taskData.rare
                ? 'border-2 border-[#FFD60A]/50 shadow-[0_0_36px_rgba(255,214,10,0.3)]'
                : 'border border-white/10'
            }`}
          >
            <BackPattern id={`bp${uid}`} />
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            {taskData.rare && <RareFlowBorder id={`rb${uid}`} />}
            {taskData.rare && (
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#FFD60A]/15 border border-[#FFD60A]/40 text-[#FFD60A] text-[10px] font-bold tracking-wider z-10">
                ✦ 稀有
              </div>
            )}

            <div className="relative z-10 w-full flex flex-col items-center justify-center gap-3">
              <div className={taskData.color}>{icon}</div>
              <h3 className="text-lg font-bold text-white">{taskData.title}</h3>
              <p className="text-xs text-white/50">{taskData.subtitle}</p>
              <p className={`text-sm font-medium ${executorClass}`}>{executorLine}</p>
              <p className="text-base text-white leading-relaxed mt-2">{taskData.task}</p>

              <div className="w-16 h-px mt-3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="flex flex-col gap-2 w-full mt-1">
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
    </div>
  );
}
