import { TileType } from '../types';
import type { FC, SVGProps } from 'react';
import {
  LuckyIcon, TrapIcon, ForwardIcon, BackwardIcon, ExtraIcon,
  DuoIcon, SwapIcon, JumpIcon, VortexIcon, ShieldIcon, SyncIcon,
} from './icons/tileIcons';

export type TileIconComponent = FC<SVGProps<SVGSVGElement>>;

export const TILE_STYLE: Record<
  TileType,
  { className: string; Icon: TileIconComponent | null; label: string; iconColor: string }
> = {
  blank:    { className: 'bg-[#2C2C2E]',     Icon: null,         label: '空白格',   iconColor: '#FFFFFF' },
  lucky:    { className: 'bg-[#FF375F]/20',  Icon: LuckyIcon,    label: '幸运格',   iconColor: '#FF6B8A' },
  trap:     { className: 'bg-[#BF5AF2]/20',  Icon: TrapIcon,     label: '陷阱格',   iconColor: '#C77DFF' },
  forward:  { className: 'bg-[#0A84FF]/20',  Icon: ForwardIcon,  label: '前进格',   iconColor: '#4DA3FF' },
  backward: { className: 'bg-white/10',      Icon: BackwardIcon, label: '后退格',   iconColor: '#9A9AA4' },
  extra:    { className: 'bg-[#30D158]/20',  Icon: ExtraIcon,    label: '再来一次', iconColor: '#43D17C' },
  duo:      { className: 'bg-[#FF9F0A]/20',  Icon: DuoIcon,      label: '双人任务', iconColor: '#FFB340' },
  swap:     { className: 'bg-[#BF5AF2]/40',  Icon: SwapIcon,     label: '交换格',   iconColor: '#B28DFF' },
  jump:     { className: 'bg-[#64D2FF]/20',  Icon: JumpIcon,     label: '飞跃格',   iconColor: '#5ED4FF' },
  vortex:   { className: 'bg-[#5E5CE6]/30',  Icon: VortexIcon,   label: '漩涡格',   iconColor: '#9B99FF' },
  shield:   { className: 'bg-[#30D158]/30',  Icon: ShieldIcon,   label: '护盾格',   iconColor: '#3ED9A0' },
  sync:     { className: 'bg-[#FFD60A]/20',  Icon: SyncIcon,     label: '默契考验', iconColor: '#FFD60A' },
};
