import { Application as PixiApplication, Container } from 'pixi.js';
import { GameConfig } from './GameConfig';
import { InputController } from './core/InputController';
import { circlesIntersect, circleIntersectsRect } from './core/CollisionUtils';
import { Player } from './entities/Player';
import { Bullet } from './entities/Bullet';
import { HUD } from './ui/HUD';
import { MessageOverlay } from './ui/MessageOverlay';
import { StarField } from './ui/StarField';
import { AsteroidLevel } from './levels/AsteroidLevel';
import { BossLevel } from './levels/BossLevel';
import { clamp } from '../utils/device';

type GamePhase = 'level1' | 'level2' | 'ended';

export class SpaceShooterGame {
    private readonly pixiApp = new PixiApplication();
    private readonly input = new InputController();

    private readonly backgroundLayer = new Container();
    private readonly levelLayer = new Container();
    private readonly bulletsLayer = new Container();
    private readonly playerLayer = new Container();

    private readonly starfield = new StarField();
    private readonly player = new Player();
    private readonly hud = new HUD();
    private readonly overlay = new MessageOverlay();

    private readonly container: HTMLElement;

    private playerBullets: Bullet[] = [];
    private bossBullets: Bullet[] = [];

    private asteroidLevel: AsteroidLevel | null = null;
    private bossLevel: BossLevel | null = null;

    private phase: GamePhase = 'level1';
    private shotsFired = 0;
    private timeLeft = GameConfig.timeLimitSec;

    private initPromise: Promise<void> | null = null;
    private isDestroyed = false;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.runInit();
        return this.initPromise;
    }

    private async runInit(): Promise<void> {
        await this.pixiApp.init({
            width: GameConfig.canvas.width,
            height: GameConfig.canvas.height,
            background: GameConfig.colors.background,
            antialias: true
        });

        if (this.isDestroyed) return;

        this.container.appendChild(this.pixiApp.canvas);

        this.pixiApp.stage.addChild(
            this.backgroundLayer,
            this.levelLayer,
            this.bulletsLayer,
            this.playerLayer,
            this.hud,
            this.overlay
        );

        this.backgroundLayer.addChild(this.starfield);

        this.playerLayer.addChild(this.player);
        this.player.position.set(
            GameConfig.canvas.width / 2,
            GameConfig.canvas.height - GameConfig.player.bottomOffset
        );

        this.input.onShoot(() => this.shoot());

        this.startLevel1();

        this.pixiApp.ticker.add((ticker) => this.update(ticker.deltaMS));
    }

    get canvas(): HTMLCanvasElement {
        return this.pixiApp.canvas;
    }

    async destroy(): Promise<void> {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        if (this.initPromise) {
            await this.initPromise.catch(() => {});
        }

        this.input.destroy();
        this.pixiApp.destroy(true, { children: true });
    }

    private update(deltaMS: number): void {
        if (this.phase === 'ended') return;

        const deltaSec = deltaMS / 1000;

        this.starfield.update(deltaSec);
        this.updatePlayerMovement(deltaSec);
        this.updateBullets(deltaSec);

        this.timeLeft -= deltaSec;
        this.hud.setTimeLeft(this.timeLeft);

        if (this.phase === 'level1' && this.asteroidLevel) {
            this.asteroidLevel.update(deltaSec);
            this.resolveLevel1Collisions();

            if (this.asteroidLevel.isCleared()) {
                this.startLevel2();
                return;
            }
        } else if (this.phase === 'level2' && this.bossLevel) {
            this.bossLevel.update(deltaSec);
            const defeated = this.resolveLevel2Collisions();

            if (defeated) {
                this.endGame(true);
                return;
            }
            if ((this.phase as GamePhase) === 'ended') return;
        }

        this.checkFailureConditions();
    }

    private updatePlayerMovement(deltaSec: number): void {
        const { speed } = GameConfig.player;
        let dx = 0;
        if (this.input.isLeftPressed) dx -= speed * deltaSec;
        if (this.input.isRightPressed) dx += speed * deltaSec;

        const half = this.player.halfWidth;
        this.player.x = clamp(this.player.x + dx, half, GameConfig.canvas.width - half);
    }

    private updateBullets(deltaSec: number): void {
        for (const bullet of this.playerBullets) bullet.update(deltaSec, GameConfig.canvas.height);
        for (const bullet of this.bossBullets) bullet.update(deltaSec, GameConfig.canvas.height);

        this.playerBullets = this.cullDeadBullets(this.playerBullets);
        this.bossBullets = this.cullDeadBullets(this.bossBullets);
    }

    private cullDeadBullets(bullets: Bullet[]): Bullet[] {
        const alive: Bullet[] = [];
        for (const bullet of bullets) {
            if (bullet.isDead) {
                this.bulletsLayer.removeChild(bullet);
                bullet.destroy();
            } else {
                alive.push(bullet);
            }
        }
        return alive;
    }

    private shoot(): void {
        if (this.phase === 'ended') return;
        if (this.shotsFired >= GameConfig.maxShots) return;

        this.shotsFired++;
        this.hud.setShots(GameConfig.maxShots - this.shotsFired, GameConfig.maxShots);

        const bullet = new Bullet({
            x: this.player.x,
            y: this.player.y - GameConfig.player.height / 2,
            velocityY: -GameConfig.bullet.speed,
            color: GameConfig.bullet.color,
            width: GameConfig.bullet.width,
            height: GameConfig.bullet.height,
            owner: 'player'
        });

        this.playerBullets.push(bullet);
        this.bulletsLayer.addChild(bullet);
    }

    private spawnBossBullet(x: number, y: number): void {
        if (this.phase !== 'level2') return;

        const bullet = new Bullet({
            x,
            y,
            velocityY: GameConfig.bossBullet.speed,
            color: GameConfig.bossBullet.color,
            width: GameConfig.bossBullet.width,
            height: GameConfig.bossBullet.height,
            owner: 'boss'
        });

        this.bossBullets.push(bullet);
        this.bulletsLayer.addChild(bullet);
    }

    private resolveLevel1Collisions(): void {
        if (!this.asteroidLevel) return;

        for (const bullet of this.playerBullets) {
            if (bullet.isDead) continue;

            for (const asteroid of this.asteroidLevel.asteroids) {
                const hit = circlesIntersect(
                    { x: bullet.x, y: bullet.y, radius: bullet.radius },
                    { x: asteroid.x, y: asteroid.y, radius: asteroid.radius }
                );
                if (hit) {
                    bullet.isDead = true;
                    this.asteroidLevel.removeAsteroid(asteroid);
                    break;
                }
            }
        }
    }

    private resolveLevel2Collisions(): boolean {
        if (!this.bossLevel) return false;

        for (const bullet of this.bossBullets) {
            if (bullet.isDead) continue;
            const hitsPlayer = circleIntersectsRect(
                { x: bullet.x, y: bullet.y, radius: bullet.radius },
                this.player.boundsRect
            );
            if (hitsPlayer) {
                bullet.isDead = true;
                this.endGame(false, 'WASTED');
                return false;
            }
        }

        for (const playerBullet of this.playerBullets) {
            if (playerBullet.isDead) continue;
            for (const bossBullet of this.bossBullets) {
                if (bossBullet.isDead) continue;
                const collide = circlesIntersect(
                    { x: playerBullet.x, y: playerBullet.y, radius: playerBullet.radius },
                    { x: bossBullet.x, y: bossBullet.y, radius: bossBullet.radius }
                );
                if (collide) {
                    playerBullet.isDead = true;
                    bossBullet.isDead = true;
                }
            }
        }

        for (const bullet of this.playerBullets) {
            if (bullet.isDead) continue;
            const hitsBoss = circleIntersectsRect(
                { x: bullet.x, y: bullet.y, radius: bullet.radius },
                this.bossLevel.boss.boundsRect
            );
            if (hitsBoss) {
                bullet.isDead = true;
                const defeated = this.bossLevel.registerHit();
                if (defeated) return true;
                break;
            }
        }

        return false;
    }

    private checkFailureConditions(): void {
        if (this.phase === 'ended') return;

        const outOfShots = this.shotsFired >= GameConfig.maxShots && this.playerBullets.length === 0;
        const outOfTime = this.timeLeft <= 0;

        if (outOfShots || outOfTime) {
            this.endGame(false, outOfTime ? 'Time is over' : 'No ammo');
        }
    }

    private startLevel1(): void {
        this.phase = 'level1';
        this.hud.setLevelLabel('Level 1');
        this.hud.setShots(GameConfig.maxShots, GameConfig.maxShots);
        this.hud.setTimeLeft(this.timeLeft);

        this.asteroidLevel = new AsteroidLevel();
        this.asteroidLevel.start();
        this.levelLayer.addChild(this.asteroidLevel.container);
    }

    private startLevel2(): void {
        this.asteroidLevel?.destroy();
        this.asteroidLevel = null;
        this.levelLayer.removeChildren();

        this.phase = 'level2';
        this.shotsFired = 0;
        this.timeLeft = GameConfig.timeLimitSec;
        this.hud.setLevelLabel('Level 2');
        this.hud.setShots(GameConfig.maxShots, GameConfig.maxShots);

        this.bossLevel = new BossLevel((x, y) => this.spawnBossBullet(x, y));
        this.bossLevel.start();
        this.levelLayer.addChild(this.bossLevel.container);
    }

    private endGame(win: boolean, subtitle?: string): void {
        if (this.phase === 'ended') return;

        this.phase = 'ended';
        this.input.setEnabled(false);

        this.overlay.show({
            title: win ? 'YOU WIN' : 'YOU LOSE',
            subtitle,
            color: win ? 0x6fcf97 : 0xff5c5c,
            onRestart: () => this.restart()
        });
    }

    private restart(): void {
        this.overlay.hide();
        this.input.setEnabled(true);

        for (const bullet of [...this.playerBullets, ...this.bossBullets]) {
            this.bulletsLayer.removeChild(bullet);
            bullet.destroy();
        }
        this.playerBullets = [];
        this.bossBullets = [];

        this.asteroidLevel?.destroy();
        this.asteroidLevel = null;
        this.bossLevel?.destroy();
        this.bossLevel = null;
        this.levelLayer.removeChildren();

        this.shotsFired = 0;
        this.timeLeft = GameConfig.timeLimitSec;
        this.player.x = GameConfig.canvas.width / 2;

        this.startLevel1();
    }
}
