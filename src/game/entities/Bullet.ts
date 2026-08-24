import { Container, Graphics } from 'pixi.js';

export type BulletOwner = 'player' | 'boss';

export interface BulletOptions {
    x: number;
    y: number;
    velocityY: number;
    color: number;
    width: number;
    height: number;
    owner: BulletOwner;
}

export class Bullet extends Container {
    private readonly graphic = new Graphics();

    readonly owner: BulletOwner;
    readonly velocityY: number;
    readonly bulletWidth: number;
    readonly bulletHeight: number;

    isDead = false;

    constructor(options: BulletOptions) {
        super();
        this.owner = options.owner;
        this.velocityY = options.velocityY;
        this.bulletWidth = options.width;
        this.bulletHeight = options.height;

        this.addChild(this.graphic);
        this.graphic
            .roundRect(-options.width / 2, -options.height / 2, options.width, options.height, 2)
            .fill({ color: options.color });

        this.position.set(options.x, options.y);
    }

    update(deltaSec: number, canvasHeight: number): void {
        this.y += this.velocityY * deltaSec;
        if (this.y < -this.bulletHeight || this.y > canvasHeight + this.bulletHeight) {
            this.isDead = true;
        }
    }

    get radius(): number {
        return Math.max(this.bulletWidth, this.bulletHeight) / 2;
    }
}
