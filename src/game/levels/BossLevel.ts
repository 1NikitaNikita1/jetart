import { Container } from 'pixi.js';
import { Boss } from '../entities/Boss';
import { HPBar } from '../ui/HPBar';
import { GameConfig } from '../GameConfig';
import type { LevelController } from './LevelController';

export class BossLevel implements LevelController {
    readonly container = new Container();
    readonly boss = new Boss();
    private readonly hpBar = new HPBar();

    private readonly onShoot: (x: number, y: number) => void;

    private shootTimer = 0;

    constructor(onShoot: (x: number, y: number) => void) {
        this.onShoot = onShoot;
    }

    start(): void {
        this.boss.position.set(GameConfig.canvas.width / 2, 130);
        this.container.addChild(this.boss);

        this.hpBar.position.set(
            this.boss.x - GameConfig.boss.width / 2 + (GameConfig.boss.width - 220) / 2,
            this.boss.y - GameConfig.boss.height / 2 - 40
        );
        this.container.addChild(this.hpBar);

        this.shootTimer = GameConfig.boss.shootIntervalSec;
    }

    update(deltaSec: number): void {
        this.boss.update(deltaSec, GameConfig.canvas);
        this.hpBar.x = this.boss.x - 110;
        this.hpBar.y = this.boss.y - GameConfig.boss.height / 2 - 40;

        this.shootTimer -= deltaSec;
        if (this.shootTimer <= 0) {
            this.shootTimer = GameConfig.boss.shootIntervalSec;
            this.onShoot(this.boss.x, this.boss.y + GameConfig.boss.height / 2);
        }
    }

    registerHit(): boolean {
        const defeated = this.boss.takeHit();
        this.hpBar.setRatio(this.boss.hp / this.boss.maxHp);
        return defeated;
    }

    isCleared(): boolean {
        return this.boss.hp <= 0;
    }

    destroy(): void {
        this.container.destroy({ children: true });
    }
}
