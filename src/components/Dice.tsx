import { useEffect, useId, useRef, useState } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  delay?: number;
  onSettled?: () => void;
}

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// 3×3 点阵索引 → 单位坐标
const uv = (i: number) => ({ u: (i % 3) * 0.25 + 0.25, v: Math.floor(i / 3) * 0.25 + 0.25 });
// 顶面菱形等轴测映射（角点：上(50,4) 右(94,30) 下(50,54) 左(6,30)）
const topXY = (i: number) => {
  const { u, v } = uv(i);
  return { x: 50 + (u - v) * 44, y: 30 + (u + v - 1) * 24 };
};
// 左面（角点：(6,30) (50,54) (50,112) (6,88)）
const leftXY = (i: number) => {
  const { u, v } = uv(i);
  return { x: 6 + 44 * u, y: 30 + 24 * u + 58 * v };
};
// 右面（角点：(94,30) (50,54) (50,112) (94,88)）
const rightXY = (i: number) => {
  const { u, v } = uv(i);
  return { x: 94 - 44 * u, y: 30 + 24 * u + 58 * v };
};

export function Dice({ value, rolling, delay = 0, onSettled }: DiceProps) {
  const [face, setFace] = useState<number>(1);
  const [spinning, setSpinning] = useState(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const firedRef = useRef(false);
  // 双骰模式下两个实例共存，渐变 id 必须唯一
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    if (!rolling) return;
    firedRef.current = false;
    setSpinning(true);
    const shuffle = setInterval(() => {
      setFace(Math.floor(Math.random() * 6) + 1);
    }, 80);
    const stop = setTimeout(() => {
      clearInterval(shuffle);
      if (value) setFace(value);
      setSpinning(false);
      if (!firedRef.current) {
        firedRef.current = true;
        onSettledRef.current?.();
      }
    }, 750 + delay);
    return () => {
      clearInterval(shuffle);
      clearTimeout(stop);
    };
  }, [rolling, value, delay]);

  useEffect(() => {
    if (!rolling && value) setFace(value);
  }, [rolling, value]);

  // 连掷间隙 / 回合切换时清空残留点数（B6）
  useEffect(() => {
    if (!rolling && value === null) setFace(1);
  }, [rolling, value]);

  const topPips = PIPS[face] ?? PIPS[1];

  return (
    <div
      className={`w-16 h-16 transition-transform duration-100 ${
        spinning ? 'scale-110 rotate-6' : ''
      }`}
    >
      <svg viewBox="0 0 100 116" className="w-full h-full drop-shadow-lg" role="img" aria-label={`骰子 ${face} 点`}>
        <defs>
          <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#E2E2EA" />
          </linearGradient>
          <linearGradient id={`${uid}-left`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C6C6D2" /><stop offset="100%" stopColor="#8F8F9E" />
          </linearGradient>
          <linearGradient id={`${uid}-right`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AFAFBD" /><stop offset="100%" stopColor="#7E7E8C" />
          </linearGradient>
        </defs>

        {/* 三个面：先画左右，顶面盖在最上 */}
        <path d="M6 30 50 54 50 112 6 88Z" fill={`url(#${uid}-left)`} />
        <path d="M94 30 50 54 50 112 94 88Z" fill={`url(#${uid}-right)`} />
        <path d="M50 4 94 30 50 54 6 30Z" fill={`url(#${uid}-top)`} />

        {/* 侧面装饰点数：左 2 点、右 3 点 */}
        {[0, 8].map(i => {
          const p = leftXY(i);
          return <ellipse key={`l${i}`} cx={p.x} cy={p.y} rx={3.4} ry={4.4} fill="#3A3A44" opacity={0.85} />;
        })}
        {[0, 4, 8].map(i => {
          const p = rightXY(i);
          return <ellipse key={`r${i}`} cx={p.x} cy={p.y} rx={3.4} ry={4.4} fill="#2E2E38" opacity={0.85} />;
        })}

        {/* 顶面真实点数 */}
        {topPips.map(i => {
          const p = topXY(i);
          return <ellipse key={`t${i}`} cx={p.x} cy={p.y} rx={4.8} ry={3.6} fill="#23232B" />;
        })}
      </svg>
    </div>
  );
}
