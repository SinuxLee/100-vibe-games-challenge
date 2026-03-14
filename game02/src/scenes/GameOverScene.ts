import Phaser from 'phaser';
import { COLORS } from '../config';
import { formatTime } from '../utils/helpers';
import { SoundManager } from '../systems/SoundManager';
import { t } from '../i18n';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { kills: number; time: number; wave: number; level: number }): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.18, t('game_over'), {
      fontSize: '52px',
      fontFamily: 'monospace',
      color: '#e53935',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const stats = [
      t('stat_kills', { n: data.kills }),
      t('stat_time', { n: formatTime(data.time) }),
      t('stat_wave', { n: data.wave }),
      t('stat_level', { n: data.level }),
    ];

    stats.forEach((line, i) => {
      this.add.text(width / 2, height * 0.35 + i * 44, line, {
        fontSize: '26px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5);
    });

    this.saveBestScore(data);

    const bestKills = localStorage.getItem('survivor_best_kills') || '0';
    const bestTime = localStorage.getItem('survivor_best_time') || '0';
    this.add.text(width / 2, height * 0.6, t('best_score', { kills: bestKills, time: formatTime(Number(bestTime)) }), {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffd700',
    }).setOrigin(0.5);

    const restartBtn = this.add.text(width / 2, height * 0.72, t('restart'), {
      fontSize: '30px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#0f3460',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.text(width / 2, height * 0.82, t('menu'), {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#90a4ae',
      backgroundColor: '#16213e',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.start('MenuScene');
    });
  }

  private saveBestScore(data: { kills: number; time: number }): void {
    const bestKills = Number(localStorage.getItem('survivor_best_kills') || '0');
    const bestTime = Number(localStorage.getItem('survivor_best_time') || '0');
    if (data.kills > bestKills) localStorage.setItem('survivor_best_kills', String(data.kills));
    if (data.time > bestTime) localStorage.setItem('survivor_best_time', String(data.time));
  }
}
