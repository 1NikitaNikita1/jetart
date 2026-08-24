import { Container, Graphics } from 'pixi.js';

export class Asteroid extends Container {
    private readonly graphic = new Graphics();

    readonly radius: number;
    velocityX: number;
    velocityY: number;

    isDead = false;

    constructor(radius: number, color: number, velocityX: number, velocityY: number) {
        super();
        this.radius = radius;
        this.velocityX = velocityX;
        this.velocityY = velocityY;

        this.addChild(this.graphic);
        this.drawIrregularShape(color);
    }

    private drawIrregularShape(color: number): void {
        const sides = 8 + Math.floor(Math.random() * 3);
        const points: number[] = [];

        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const r = this.radius * (0.72 + Math.random() * 0.32);
            points.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }

        this.graphic.poly(points).fill({ color }).stroke({ width: 2, color: 0x000000, alpha: 0.25 });
    }

    update(deltaSec: number, bounds: { width: number; height: number }): void {
        this.x += this.velocityX * deltaSec;
        this.y += this.velocityY * deltaSec;

        const minY = this.radius;
        const maxY = bounds.height * 0.62;
        const minX = this.radius;
        const maxX = bounds.width - this.radius;

        if (this.x < minX) {
            this.x = minX;
            this.velocityX *= -1;
        } else if (this.x > maxX) {
            this.x = maxX;
            this.velocityX *= -1;
        }

        if (this.y < minY) {
            this.y = minY;
            this.velocityY *= -1;
        } else if (this.y > maxY) {
            this.y = maxY;
            this.velocityY *= -1;
        }
    }
}
