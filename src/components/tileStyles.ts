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
  lucky:    { className: 'bg-[#FF375F]/20',  Icon: LuckyIcon,    label: '幸运格',   iconColor: '#FFFFFF' },
  trap:     { className: 'bg-[#BF5AF2]/20',  Icon: TrapIcon,     label: '陷阱格',   iconColor: '#FFFFFF' },
  forward:  { className: 'bg-[#0A84FF]/20',  Icon: ForwardIcon,  label: '前进格',   iconColor: '#FFFFFF' },
  backward: { className: 'bg-white/10',      Icon: BackwardIcon, label: '后退格',   iconColor: '#FFFFFF' },
  extra:    { className: 'bg-[#30D158]/20',  Icon: ExtraIcon,    label: '再来一次', iconColor: '#FFFFFF' },
  duo:      { className: 'bg-[#FF9F0A]/20',  Icon: DuoIcon,      label: '双人任务', iconColor: '#7A3C00' },
  swap:     { className: 'bg-[#BF5AF2]/40',  Icon: SwapIcon,     label: '交换格',   iconColor: '#FFFFFF' },
  jump:     { className: 'bg-[#64D2FF]/20',  Icon: JumpIcon,     label: '飞跃格',   iconColor: '#083B52' },
  vortex:   { className: 'bg-[#5E5CE6]/30',  Icon: VortexIcon,   label: '漩涡格',   iconColor: '#FFFFFF' },
  shield:   { className: 'bg-[#30D158]/30',  Icon: ShieldIcon,   label: '护盾格',   iconColor: '#FFFFFF' },
  sync:     { className: 'bg-[#FFD60A]/20',  Icon: SyncIcon,     label: '默契考验', iconColor: '#7A3C00' },
};
