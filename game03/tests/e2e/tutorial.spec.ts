import { test, expect } from '@playwright/test';

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

function waitForScene(page: import('@playwright/test').Page, sceneName: string, timeout = 10000) {
  return page.waitForFunction((name: string) => {
    const g = (window as any).game;
    return g?.scene?.scenes?.some(
      (s: any) => (s.sys.config.key === name || s.sys.settings.key === name) && s.sys.isActive()
    );
  }, sceneName, { timeout });
}

test.describe('Tutorial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('neon_dodge_save');
    });
    await page.reload();
    await waitForPhaser(page);
    await waitForScene(page, 'MenuScene');
  });

  test('first-time player goes to TutorialScene from menu', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });

    await waitForScene(page, 'TutorialScene', 8000);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('TutorialScene');
  });

  test('tutorial does not appear when already completed', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neon_dodge_save', JSON.stringify({
        bestScore: 0, longestTime: 0,
        soundEnabled: true, vibrateEnabled: true,
        tutorialCompleted: true,
      }));
    });
    await page.reload();
    await waitForPhaser(page);
    await waitForScene(page, 'MenuScene');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });

    await waitForScene(page, 'GameScene', 8000);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('GameScene');
    expect(scenes).not.toContain('TutorialScene');
  });

  test('no console errors during tutorial', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });
    await waitForScene(page, 'TutorialScene', 8000);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
