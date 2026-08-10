import { useEffect } from 'react';

// 引用计数锁：嵌套弹层（愿望清单→分享卡、主题编辑→AI 导入）各自加锁/解锁时，
// 只有全部弹层都关闭后才恢复背景滚动，避免内层关闭时误解外层锁。
let lockCount = 0;

export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (locked) {
      lockCount += 1;
      document.body.style.overflow = 'hidden';
    } else {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = '';
    }
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = '';
    };
  }, [locked]);
}
