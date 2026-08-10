import { TileType } from '../types';
import {
  Sparkles, Bomb, ChevronsRight, ChevronsLeft, RotateCcw,
  HeartHandshake, ArrowLeftRight, Plane, Tornado, Shield, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const TILE_STYLE: Record<TileType, { className: string; Icon: LucideIcon | null; label: string }> = {
  blank:    { className: 'bg-[#2C2C2E]',     Icon: null,           label: '空白格' },
  lucky:    { className: 'bg-[#FF375F]/20',  Icon: Sparkles,       label: '幸运格' },
  trap:     { className: 'bg-[#BF5AF2]/20',  Icon: Bomb,           label: '陷阱格' },
  forward:  { className: 'bg-[#0A84FF]/20',  Icon: ChevronsRight,  label: '前进格' },
  backward: { className: 'bg-white/10',      Icon: ChevronsLeft,   label: '后退格' },
  extra:    { className: 'bg-[#30D158]/20',  Icon: RotateCcw,      label: '再来一次' },
  duo:      { className: 'bg-[#FF9F0A]/20',  Icon: HeartHandshake, label: '双人任务' },
  swap:     { className: 'bg-[#BF5AF2]/40',  Icon: ArrowLeftRight, label: '交换格' },
  jump:     { className: 'bg-[#64D2FF]/20',  Icon: Plane,          label: '飞跃格' },
  vortex:   { className: 'bg-[#5E5CE6]/30',  Icon: Tornado,        label: '漩涡格' },
  shield:   { className: 'bg-[#30D158]/30',  Icon: Shield,         label: '护盾格' },
  sync:     { className: 'bg-[#FFD60A]/20',  Icon: Users,          label: '默契考验' },
};
