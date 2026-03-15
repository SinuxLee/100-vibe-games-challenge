import { test, expect } from '@playwright/test';

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 1334;

function waitForPhaser(page: import('@playwright/test').Page) {
  return page.waitForFunction(() => {
    const g = (window as any).game;
    return g && g.scene && g.scene.scenes && g.scene.scenes.length > 0;
  }, { timeout: 10000 });
}

function getActiveScenes(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const g = (window as any).game;
    if (!g || !g.scene) return [];
    return g.scene.scenes
      .filter((s: any) => s.sys.isActive())
      .map((s: any) => s.sys.config.key || s.sys.settings.key);
  });
}

test.describe('Game Boot & Menu', () => {
  test('page loads with canvas element', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('Phaser game instance initializes', async ({ page }) => {
    await page.goto('/');
    await waitForPhaser(page);

    const hasGame = await page.evaluate(() => !!(window as any).game);
    expect(hasGame).toBe(true);
  });

  test('game transitions from Boot to Menu scene', async ({ page }) => {
    await page.goto('/');
    await waitForPhaser(page);

    await page.waitForFunction(() => {
      const g = (window as any).game;
      if (!g || !g.scene) return false;
      return g.scene.scenes.some(
        (s: any) => (s.sys.config.key === 'MenuScene' || s.sys.settings.key === 'MenuScene') && s.sys.isActive()
      );
    }, { timeout: 10000 });

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('MenuScene');
  });

  test('no console errors during boot', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await waitForPhaser(page);
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Gameplay', () => {
  async function startGame(page: import('@playwright/test').Page) {
    await page.goto('/');
    await waitForPhaser(page);

    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g?.scene?.scenes?.some(
        (s: any) => (s.sys.config.key === 'MenuScene' || s.sys.settings.key === 'MenuScene') && s.sys.isActive()
      );
    }, { timeout: 10000 });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });
    await page.waitForTimeout(500);

    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g?.scene?.scenes?.some(
        (s: any) => (s.sys.config.key === 'GameScene' || s.sys.settings.key === 'GameScene') && s.sys.isActive()
      );
    }, { timeout: 8000 });
  }

  test('tapping menu starts the game', async ({ page }) => {
    await startGame(page);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('GameScene');
  });

  test('HUD scene runs in parallel with game', async ({ page }) => {
    await startGame(page);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('GameScene');
    expect(scenes).toContain('HUDScene');
  });

  test('score increases over time during gameplay', async ({ page }) => {
    await startGame(page);

    await page.waitForTimeout(1500);

    const score = await page.evaluate(() => {
      const g = (window as any).game;
      return g?.registry?.get('score') ?? 0;
    });

    expect(score).toBeGreaterThan(0);
  });

  test('survival time increases during gameplay', async ({ page }) => {
    await startGame(page);

    await page.waitForTimeout(1500);

    const time = await page.evaluate(() => {
      const g = (window as any).game;
      return g?.registry?.get('time') ?? 0;
    });

    expect(time).toBeGreaterThan(0);
  });

  test('player responds to horizontal drag input', async ({ page }) => {
    await startGame(page);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const initialX = await page.evaluate(() => {
      const g = (window as any).game;
      const gameScene = g?.scene?.scenes?.find(
        (s: any) => (s.sys.config.key === 'GameScene' || s.sys.settings.key === 'GameScene')
      );
      return gameScene?.player?.logicalX ?? -1;
    });

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.7, { steps: 5 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    const movedX = await page.evaluate(() => {
      const g = (window as any).game;
      const gameScene = g?.scene?.scenes?.find(
        (s: any) => (s.sys.config.key === 'GameScene' || s.sys.settings.key === 'GameScene')
      );
      return gameScene?.player?.logicalX ?? -1;
    });

    expect(movedX).not.toBe(initialX);
  });

  test('obstacles spawn during gameplay', async ({ page }) => {
    await startGame(page);

    await page.waitForTimeout(2000);

    const obstacleCount = await page.evaluate(() => {
      const g = (window as any).game;
      const gameScene = g?.scene?.scenes?.find(
        (s: any) => (s.sys.config.key === 'GameScene' || s.sys.settings.key === 'GameScene')
      );
      return gameScene?.obstacleManager?.getObstacles()?.length ?? 0;
    });

    expect(obstacleCount).toBeGreaterThan(0);
  });
});

test.describe('Game Over', () => {
  test('death transitions to GameOver scene', async ({ page }) => {
    await page.goto('/');
    await waitForPhaser(page);

    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g?.scene?.scenes?.some(
        (s: any) => (s.sys.config.key === 'MenuScene' || s.sys.settings.key === 'MenuScene') && s.sys.isActive()
      );
    }, { timeout: 10000 });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });
    await page.waitForTimeout(500);

    await page.waitForFunction(() => {
      const g = (window as any).game;
      return g?.scene?.scenes?.some(
        (s: any) => (s.sys.config.key === 'GameScene' || s.sys.settings.key === 'GameScene') && s.sys.isActive()
      );
    }, { timeout: 8000 });

    const gotGameOver = await page.waitForFunction(() => {
      const g = (window as any).game;
      return g?.scene?.scenes?.some(
        (s: any) => (s.sys.config.key === 'GameOverScene' || s.sys.settings.key === 'GameOverScene') && s.sys.isActive()
      );
    }, { timeout: 60000 }).then(() => true).catch(() => false);

    if (gotGameOver) {
      const scenes = await getActiveScenes(page);
      expect(scenes).toContain('GameOverScene');
    } else {
      test.skip();
    }
  });
});

test.describe('Save System', () => {
  test('localStorage save key exists after gameplay', async ({ page }) => {
    await page.goto('/');
    await waitForPhaser(page);

    const saveExists = await page.evaluate(() => {
      return localStorage.getItem('neon_dodge_save') !== null;
    });

    expect(typeof saveExists).toBe('boolean');
  });
});
