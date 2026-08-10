import { useEffect, useRef, useState } from 'react';

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

export function Dice({ value, rolling, delay = 0, onSettled }: DiceProps) {
  const [face, setFace] = useState<number>(1);
  const [spinning, setSpinning] = useState(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const firedRef = useRef(false);

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

  const pips = PIPS[face] ?? PIPS[1];

  return (
    <div
      className={`w-16 h-16 rounded-2xl bg-white shadow-lg grid grid-cols-3 grid-rows-3 p-2 transition-transform duration-100 ${
        spinning ? 'scale-110 rotate-6' : ''
      }`}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
        </div>
      ))}
    </div>
  );
}
