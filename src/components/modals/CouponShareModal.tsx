import { useEffect, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { Wish, Player } from '../../types';
import { WISH_ITEMS, SHOP_ITEMS } from '../../data/shopItems';
import { generateCouponBlob, downloadBlob, shareBlob } from '../../utils/couponImage';
import { useLockBody } from '../../hooks/useLockBody';

interface CouponShareModalProps {
  wish: Wish | null;
  players: Player[];
  onClose: () => void;
}

export function CouponShareModal({ wish, players, onClose }: CouponShareModalProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');

  useLockBody(wish !== null);

  useEffect(() => {
    if (!wish) return;
    // 来源感知查找：服务券（source:'shop'）查 SHOP_ITEMS，避免与 WISH_ITEMS 的 id 撞车（如 massage）
    const item =
      (wish.source === 'shop' ? SHOP_ITEMS : WISH_ITEMS).find(w => w.id === wish.itemId) ??
      WISH_ITEMS.find(w => w.id === wish.itemId) ??
      SHOP_ITEMS.find(w => w.id === wish.itemId);
    const owner = players[wish.ownerPlayerId];
    const partner = players[wish.ownerPlayerId === 0 ? 1 : 0];
    let cancelled = false;
    let url: string | null = null;

    generateCouponBlob({
      title: wish.title, // 落账时的名称是权威数据，绕过 id 撞车
      desc: item?.desc ?? '',
      ownerName: owner?.name ?? '',
      partnerName: partner?.name ?? '',
      createdAt: wish.createdAt,
      redeemedAt: wish.redeemedAt,
    })
      .then(b => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setImgUrl(url);
      })
      .catch(() => !cancelled && setError('图片生成失败，请重试'));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setImgUrl(null);
      setBlob(null);
      setError('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wish?.id]);

  if (!wish) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={onClose}>
      <div
        className="w-full max-w-xs md:max-w-sm bg-[#1C1C1E] rounded-3xl border border-white/10 p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">分享心愿券</h3>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden bg-black/30 mb-4 aspect-[3/4] flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt="心愿券" className="w-full h-full object-contain" />
          ) : (
            <span className="text-sm text-white/40">{error || '生成中…'}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!blob}
            onClick={() => blob && downloadBlob(blob, `${wish.title}.png`)}
            className="h-11 rounded-xl bg-white/10 text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            保存图片
          </button>
          <button
            disabled={!blob}
            onClick={() => blob && shareBlob(blob, wish.title)}
            className="h-11 rounded-xl bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" />
            分享给 TA
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">发给对方，提醒 TA 该兑现了</p>
      </div>
    </div>
  );
}
