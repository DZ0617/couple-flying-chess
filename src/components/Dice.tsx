import { useEffect, useId, useRef, useState } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  delay?: number;
  onSettled?: () => void;
}

// 骰面点数布局：以面心为原点的 (u, v) 网格坐标
const PIPS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

// 顶面为 n 时的两个侧面点数（标准骰：对面之和为 7，侧面避开顶面与对面）
const SIDES: Record<number, [number, number]> = {
  1: [2, 3],
  2: [1, 3],
  3: [1, 2],
  4: [2, 5],
  5: [3, 4],
  6: [4, 5],
};

// 等轴测三个面的点数投影
const topPos = (u: number, v: number): [number, number] => [60 + (u - v) * 15, 40 + (u + v) * 8.5];
const leftPos = (u: number, v: number): [number, number] => [34 + u * 16.1, 80 + u * 9.3 + v * 13.75];
const rightPos = (u: number, v: number): [number, number] => [86 - u * 16.1, 80 + u * 9.3 + v * 13.75];

function FacePips({
  value,
  project,
  rx,
  ry,
  fill,
}: {
  value: number;
  project: (u: number, v: number) => [number, number];
  rx: number;
  ry: number;
  fill: string;
}) {
  return (
    <>
      {PIPS[value].map(([u, v], i) => {
        const [x, y] = project(u, v);
        return <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={fill} />;
      })}
    </>
  );
}

export function Dice({ value, rolling, delay = 0, onSettled }: DiceProps) {
  const [face, setFace] = useState<number>(1);
  const [spinning, setSpinning] = useState(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const firedRef = useRef(false);
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

  const [leftFace, rightFace] = SIDES[face] ?? SIDES[1];

  return (
    <div className={`w-16 h-16 ${spinning ? 'animate-dice-tumble' : ''}`}>
      <svg
        viewBox="0 0 120 140"
        className="w-full h-full drop-shadow-lg"
        role="img"
        aria-label={`骰子 ${face} 点`}
      >
        <defs>
          <linearGradient id={`dt${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E4E4EA" />
          </linearGradient>
          <linearGradient id={`dl${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9C9D4" />
            <stop offset="100%" stopColor="#9A9AA8" />
          </linearGradient>
          <linearGradient id={`dr${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B4B4C2" />
            <stop offset="100%" stopColor="#84848F" />
          </linearGradient>
        </defs>

        {/* 侧面先画，顶面盖在上面 */}
        <path d="M8 40 L60 70 L60 120 L8 90 Z" fill={`url(#dl${uid})`} />
        <path d="M112 40 L60 70 L60 120 L112 90 Z" fill={`url(#dr${uid})`} />
        <FacePips value={leftFace} project={leftPos} rx={3.9} ry={4.5} fill="#4A4A55" />
        <FacePips value={rightFace} project={rightPos} rx={3.9} ry={4.5} fill="#3F3F4A" />

        {/* 顶面 */}
        <path
          d="M8 40 L60 10 L112 40 L60 70 Z"
          fill={`url(#dt${uid})`}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1"
        />
        <FacePips value={face} project={topPos} rx={5.6} ry={3.3} fill="#26262E" />
      </svg>
    </div>
  );
}
