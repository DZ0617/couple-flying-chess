import { useEffect, useRef, useState } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  delay?: number;
  onSettled?: () => void;
}

const SIZE = 54; // 立方体边长（px）
const HALF = SIZE / 2;
const TILT = { x: -16, y: -22 }; // 静止展示倾角：能同时看到顶面与侧面

// 点数朝前时立方体要转到的角度（对面之和为 7）
const FACE_ROT: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

// 六个面在立方体上的摆放位置
const FACE_PLACE: Record<number, string> = {
  1: `rotateY(0deg) translateZ(${HALF}px)`,
  2: `rotateX(90deg) translateZ(${HALF}px)`,
  3: `rotateY(90deg) translateZ(${HALF}px)`,
  4: `rotateY(-90deg) translateZ(${HALF}px)`,
  5: `rotateX(-90deg) translateZ(${HALF}px)`,
  6: `rotateY(180deg) translateZ(${HALF}px)`,
};

// 3×3 宫格中的点数位置
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const randFace = () => Math.floor(Math.random() * 6) + 1;

// 折算到离 ref 最近的等价角度（±360k）：翻滚与停骰都走最短路径，不倒退
const nearest = (target: number, ref: number) =>
  target + 360 * Math.round((ref - target) / 360);

function Face({ value }: { value: number }) {
  const accent = value === 1 || value === 4; // 传统骰子 1/4 点用红色系（这里用品牌粉）
  return (
    <div className="dice-face" style={{ transform: FACE_PLACE[value] }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="dice-cell">
          {PIPS[value].includes(i) && (
            <i className={`dice-dot${accent ? ' accent' : ''}${value === 1 ? ' big' : ''}`} />
          )}
        </span>
      ))}
    </div>
  );
}

export function Dice({ value, rolling, delay = 0, onSettled }: DiceProps) {
  const [face, setFace] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(TILT);
  const rotRef = useRef(rot);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const firedRef = useRef(false);

  // 转到目标点数（保持展示倾角，沿最短路径）
  const turnTo = (f: number) => {
    const cur = rotRef.current;
    const next = {
      x: nearest(TILT.x + FACE_ROT[f].x, cur.x),
      y: nearest(TILT.y + FACE_ROT[f].y, cur.y),
    };
    rotRef.current = next;
    setRot(next);
    setFace(f);
  };

  useEffect(() => {
    if (!rolling) return;
    firedRef.current = false;
    setSpinning(true);
    // 快速朝随机面翻转：短过渡串联起来就是连续翻滚
    const shuffle = window.setInterval(() => {
      setRot(prev => {
        const f = randFace();
        const next = {
          x: nearest(TILT.x + FACE_ROT[f].x, prev.x),
          y: nearest(TILT.y + FACE_ROT[f].y, prev.y),
        };
        rotRef.current = next;
        return next;
      });
    }, 90);
    const stop = window.setTimeout(() => {
      window.clearInterval(shuffle);
      setSpinning(false);
      if (value) turnTo(value);
      if (!firedRef.current) {
        firedRef.current = true;
        onSettledRef.current?.();
      }
    }, 750 + delay);
    return () => {
      window.clearInterval(shuffle);
      window.clearTimeout(stop);
    };
  }, [rolling, value, delay]);

  useEffect(() => {
    if (!rolling && value) turnTo(value);
  }, [rolling, value]);

  // 连掷间隙 / 回合切换时清空残留点数（B6）
  useEffect(() => {
    if (!rolling && value === null) turnTo(1);
  }, [rolling, value]);

  return (
    <div className={`dice-scene${spinning ? ' rolling' : ''}`}>
      <div className="dice-bounce">
        <div
          className="dice-cube"
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
          role="img"
          aria-label={`骰子 ${face} 点`}
        >
          {[1, 2, 3, 4, 5, 6].map(v => (
            <Face key={v} value={v} />
          ))}
        </div>
      </div>
      <div className="dice-shadow" />
    </div>
  );
}
