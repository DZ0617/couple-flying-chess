// 七夕当天（2026-08-19）。明年改成农历表或配置即可
export function isQixi(date: Date = new Date()): boolean {
  return date.getFullYear() === 2026 && date.getMonth() === 7 && date.getDate() === 19;
}

export function heartsMultiplier(date: Date = new Date()): number {
  return isQixi(date) ? 2 : 1;
}

// 数字梗：520 / 一生一世
export function isLoveNumber(hearts: number): boolean {
  return hearts === 520;
}

export function isThirteenFourteen(stepA: number, stepB: number): boolean {
  return (stepA === 13 && stepB === 14) || (stepA === 14 && stepB === 13);
}
