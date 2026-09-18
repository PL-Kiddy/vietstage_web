export function cosmeticUnlockLabel(item: { unlockType: string; unlockValue?: number }): string {
  if (item.unlockType === 'DEFAULT') return 'Mở khóa mặc định';
  if (item.unlockType === 'ACHIEVEMENT') return 'Mở khóa theo thành tích';
  if (item.unlockType === 'STARS') return item.unlockValue ? `${item.unlockValue} Sao` : 'Miễn phí (0 Sao)';
  return 'Chưa xác định điều kiện mở khóa';
}

export function matchesCosmeticCost(item: { unlockType: string; unlockValue?: number }, filter: string): boolean {
  if (filter === 'FREE') return item.unlockType === 'DEFAULT' || (item.unlockType === 'STARS' && item.unlockValue === 0);
  if (filter === 'PAID') return item.unlockType === 'STARS' && (item.unlockValue ?? 0) > 0;
  if (filter === 'ACHIEVEMENT') return item.unlockType === 'ACHIEVEMENT';
  return true;
}
