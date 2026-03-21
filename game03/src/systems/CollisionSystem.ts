import { Player } from '../entities/Player';
import { BaseObstacle, LogicalRect } from '../entities/obstacles/BaseObstacle';
import { BaseCollectible } from '../entities/collectibles/BaseCollectible';
import { NEAR_MISS_DISTANCE, PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants';

export class CollisionSystem {
  checkCollision(player: Player, obstacles: BaseObstacle[]): boolean {
    const pr = player.getCollisionRect();

    for (const obs of obstacles) {
      const rects = obs.getCollisionRects();
      for (const r of rects) {
        if (this.rectsOverlap(pr, r)) {
          return true;
        }
      }
    }
    return false;
  }

  checkNearMiss(player: Player, obstacle: BaseObstacle): boolean {
    const pr = player.getCollisionRect();
    const rects = obstacle.getCollisionRects();

    let minEdgeDistance = Infinity;

    for (const r of rects) {
      const leftEdgeDist = Math.abs((pr.x + pr.w) - r.x);
      const rightEdgeDist = Math.abs(pr.x - (r.x + r.w));

      const verticalOverlap = pr.y < r.y + r.h && pr.y + pr.h > r.y;
      if (verticalOverlap) {
        minEdgeDistance = Math.min(minEdgeDistance, leftEdgeDist, rightEdgeDist);
      }
    }

    return minEdgeDistance < NEAR_MISS_DISTANCE;
  }

  checkCollectible(player: Player, collectibles: BaseCollectible[]): BaseCollectible | null {
    const pr = player.getCollisionRect();
    for (const c of collectibles) {
      if (c.collected) continue;
      const cr = c.getCollisionRect();
      if (this.rectsOverlap(pr, cr)) {
        c.collected = true;
        return c;
      }
    }
    return null;
  }

  private rectsOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: LogicalRect,
  ): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }
}
