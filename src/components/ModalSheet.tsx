import type { ReactNode } from 'react';
import { useLockBody } from '../hooks/useLockBody';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean; // 内容较宽的弹层（如心愿商店）用
}

// 移动端：底部抽屉；桌面端：居中对话框
export function ModalSheet({ isOpen, onClose, children, wide }: ModalSheetProps) {
  useLockBody(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] md:flex md:items-center md:justify-center md:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto
          bg-[#1C1C1E] rounded-t-[32px] md:rounded-[28px] md:border md:border-white/10 md:shadow-2xl
          p-6 max-h-[88vh] flex flex-col ${wide ? 'md:w-full md:max-w-lg' : 'md:w-full md:max-w-md'}`}
      >
        {/* 移动端抽屉把手，桌面端隐藏 */}
        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-5 md:hidden" />
        {children}
      </div>
    </div>
  );
}
