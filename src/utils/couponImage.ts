interface CouponCardOptions {
  title: string;
  desc: string;
  ownerName: string;
  partnerName: string;
  createdAt: number;
  redeemedAt: number | null;
}

const W = 750;
const H = 1000;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = '#D8D8DC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

export function generateCouponBlob(opts: CouponCardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('canvas unavailable'));

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FF375F');
  bg.addColorStop(1, '#BF5AF2');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 装饰圆
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (const [cx, cy, cr] of [[80, 120, 90], [690, 200, 60], [120, 880, 70], [660, 900, 100]] as const) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 白色卡体
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 120, W - 120, H - 240, 36);
  ctx.fill();

  // 卡体顶部色条
  ctx.save();
  roundRect(ctx, 60, 120, W - 120, H - 240, 36);
  ctx.clip();
  const bar = ctx.createLinearGradient(60, 120, W - 60, 120);
  bar.addColorStop(0, '#FF375F');
  bar.addColorStop(1, '#BF5AF2');
  ctx.fillStyle = bar;
  ctx.fillRect(60, 120, W - 120, 16);
  ctx.restore();

  // 图标与标题
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1C1C1E';
  ctx.font = '90px system-ui, sans-serif';
  ctx.fillText('🎁', W / 2, 300);

  ctx.font = 'bold 56px system-ui, -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(opts.title, W / 2, 420);

  ctx.font = '28px system-ui, -apple-system, "PingFang SC", sans-serif';
  ctx.fillStyle = '#8E8E93';
  // 描述超长截断
  const desc = opts.desc.length > 24 ? opts.desc.slice(0, 24) + '…' : opts.desc;
  ctx.fillText(desc, W / 2, 480);

  // 虚线分隔 + 两侧半圆缺口（票券感）
  drawDashedLine(ctx, 90, 560, W - 90);
  ctx.fillStyle = '#FF375F';
  ctx.beginPath(); ctx.arc(60, 560, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#BF5AF2';
  ctx.beginPath(); ctx.arc(W - 60, 560, 22, 0, Math.PI * 2); ctx.fill();

  // 归属信息
  ctx.fillStyle = '#3A3A3C';
  ctx.font = '30px system-ui, -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(`由 ${opts.partnerName} 为 ${opts.ownerName} 兑现`, W / 2, 650);
  ctx.fillStyle = '#AEAEB2';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(new Date(opts.createdAt).toLocaleDateString(), W / 2, 700);

  // 页脚品牌
  ctx.fillStyle = '#C7C7CC';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText("情侣飞行棋 · Couple's Ludo", W / 2, H - 70);

  // 已兑现印章
  if (opts.redeemedAt) {
    ctx.save();
    ctx.translate(W / 2, 470);
    ctx.rotate(-Math.PI / 10);
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 6;
    ctx.strokeRect(-150, -55, 300, 110);
    ctx.fillStyle = '#FF3B30';
    ctx.font = 'bold 56px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('已兑现', 0, 20);
    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function shareBlob(blob: Blob, title: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const file = new File([blob], `${title}.png`, { type: 'image/png' });
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return 'shared';
    }
  } catch {
    // 用户取消或不支持，落回下载
  }
  try {
    downloadBlob(blob, `${title}.png`);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
