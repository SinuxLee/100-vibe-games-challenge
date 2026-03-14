export function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function randomEdgePoint(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  margin: number = 80,
): { x: number; y: number } {
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0: return { x: cx + Phaser.Math.Between(-halfW, halfW), y: cy - halfH - margin };
    case 1: return { x: cx + Phaser.Math.Between(-halfW, halfW), y: cy + halfH + margin };
    case 2: return { x: cx - halfW - margin, y: cy + Phaser.Math.Between(-halfH, halfH) };
    default: return { x: cx + halfW + margin, y: cy + Phaser.Math.Between(-halfH, halfH) };
  }
}

import Phaser from 'phaser';

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
