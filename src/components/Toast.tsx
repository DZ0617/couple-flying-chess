export interface ToastItem {
  id: number;
  text: string;
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-2 rounded-full bg-white/90 text-black text-sm font-medium shadow-lg"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
