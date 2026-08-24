import { Container, Graphics } from 'pixi.js';
import { GameConfig } from '../GameConfig';

export class Boss extends Container {
    private readonly graphic = new Graphics();

    readonly maxHp = GameConfig.boss.hp;
    hp = GameConfig.boss.hp;

    private velocityX = 0;
    private phaseTimer = 0;

    constructor() {
        super();
        this.addChild(this.graphic);
        this.draw();
        this.pickNextPhase();
    }

    private draw(): void {
        const w = GameConfig.boss.width;
        const h = GameConfig.boss.height;

        this.graphic.clear();
        this.graphic.roundRect(-w / 2, -h / 2, w, h, 22).fill({ color: GameConfig.boss.color });

        this.graphic.circle(-w * 0.2, -h * 0.08, 12).fill({ color: 0xffffff });
        this.graphic.circle(w * 0.2, -h * 0.08, 12).fill({ color: 0xffffff });
        this.graphic.circle(-w * 0.2, -h * 0.08, 5).fill({ color: 0x1a1a1a });
        this.graphic.circle(w * 0.2, -h * 0.08, 5).fill({ color: 0x1a1a1a });

        this.graphic.rect(-w * 0.12, h * 0.32, w * 0.08, h * 0.22).fill({ color: 0x9c3b58 });
        this.graphic.rect(w * 0.04, h * 0.32, w * 0.08, h * 0.22).fill({ color: 0x9c3b58 });
    }

    takeHit(): boolean {
        this.hp = Math.max(0, this.hp - 1);
        return this.hp <= 0;
    }

    private pickNextPhase(): void {
        const shouldMove = Math.random() > 0.35;
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.velocityX = shouldMove ? direction * GameConfig.boss.speed : 0;

        const { minPauseSec, maxPauseSec } = GameConfig.boss;
        this.phaseTimer = minPauseSec + Math.random() * (maxPauseSec - minPauseSec);
    }

    update(deltaSec: number, bounds: { width: number }): void {
        this.phaseTimer -= deltaSec;
        if (this.phaseTimer <= 0) {
            this.pickNextPhase();
        }

        this.x += this.velocityX * deltaSec;

        const halfW = GameConfig.boss.width / 2;
        if (this.x < halfW) {
            this.x = halfW;
            this.velocityX *= -1;
        } else if (this.x > bounds.width - halfW) {
            this.x = bounds.width - halfW;
            this.velocityX *= -1;
        }
    }

    get boundsRect(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x,
            y: this.y,
            width: GameConfig.boss.width,
            height: GameConfig.boss.height
        };
    }
}
