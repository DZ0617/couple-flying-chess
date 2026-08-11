import type { FC, SVGProps } from 'react';

// 定制格子图标集：填充式 + 描边式混合，统一 24×24 viewBox
// 在棋盘 SVG 内用 x/y/width/height 定位；在 DOM 里用 className 控制尺寸与颜色
type IconProps = SVGProps<SVGSVGElement>;

export const LuckyIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11 20.3C6.2 16 2.8 12.7 2.8 9.1 2.8 6.3 4.9 4.3 7.4 4.3c1.5 0 2.9.7 3.6 1.9.7-1.2 2.1-1.9 3.6-1.9 2.5 0 4.6 2 4.6 4.8 0 3.6-3.4 6.9-8.2 11.2Z" />
    <path d="M18.5 2.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" />
  </svg>
);

export const TrapIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.2 2.5 5.5 13.6h4.9l-1.1 7.9 8-11.4h-4.9l.8-7.6Z" />
  </svg>
);

export const ForwardIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 5.5 11.5 12 5 18.5" />
    <path d="M12 5.5 18.5 12 12 18.5" />
  </svg>
);

export const BackwardIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 5.5 12.5 12 19 18.5" />
    <path d="M12 5.5 5.5 12 12 18.5" />
  </svg>
);

export const ExtraIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 3v5h-5" />
  </svg>
);

export const DuoIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9 15.6C5.9 12.9 3.8 10.9 3.8 8.6c0-1.9 1.4-3.2 3.1-3.2 1 0 1.7.5 2.1 1.2.4-.7 1.1-1.2 2.1-1.2 1.7 0 3.1 1.3 3.1 3.2 0 2.3-2.1 4.3-5.2 7Z" />
    <path d="M16.5 18.6c-2.3-2-3.9-3.5-3.9-5.2 0-1.4 1-2.4 2.3-2.4.7 0 1.3.4 1.6.9.3-.5.9-.9 1.6-.9 1.3 0 2.3 1 2.3 2.4 0 1.7-1.6 3.2-3.9 5.2Z" opacity={0.6} />
  </svg>
);

export const SwapIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 8h12M13 4.5 16.5 8 13 11.5" />
    <path d="M20 16H8M11 12.5 7.5 16 11 19.5" />
  </svg>
);

export const JumpIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12h10M9.5 6.5 15 12l-5.5 5.5" />
    <path d="M3 7.5h4M3 16.5h4" opacity={0.45} />
  </svg>
);

export const VortexIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" {...props}>
    <path d="M12 12.5c.2-.9 1.3-1.2 2-.6 1 .9.6 2.6-.9 3.1-2 .7-4.3-.6-4.7-2.9-.5-2.8 1.7-5.3 4.6-5.4 3.4-.1 6 2.8 5.6 6.3" />
  </svg>
);

export const ShieldIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.8 19 5.3v5.5c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V5.3l7-2.5Z" />
    <path d="M8.8 11.8l2.2 2.2 4.2-4.4" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SyncIcon: FC<IconProps> = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" opacity={0.6} />
  </svg>
);
