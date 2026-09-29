import { SCORE } from './constants.js';

export const ITEM_KINDS = {
  apple: { name: '苹果', tile: -1 },
  gold: { name: '金币', tile: -1 },
  potionRed: { name: '红色治疗药水', tile: 115 },
  potionBlue: { name: '蓝色毒液药水', tile: 116 },
  chest: { name: '宝箱', tile: 90 },
  amulet: { name: '古代圣物', tile: 113 },
};

export function itemAt(items, x, y) {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.x === x && it.y === y) return it;
  }
  return null;
}

export function removeItem(items, item) {
  const i = items.indexOf(item);
  if (i >= 0) items.splice(i, 1);
}
