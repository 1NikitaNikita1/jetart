import { Container, Graphics } from 'pixi.js';
import { GameConfig } from '../GameConfig';

interface Star {
    graphic: Graphics;
    speed: number;
}

export class StarField extends Container {
    private readonly stars: Star[] = [];

    constructor(count = 90) {
        super();

        for (let i = 0; i < count; i++) {
            const graphic = new Graphics();
            const radius = Math.random() * 1.6 + 0.4;
            graphic
                .circle(0, 0, radius)
                .fill({ color: GameConfig.colors.starfield, alpha: 0.3 + Math.random() * 0.6 });
            graphic.position.set(
                Math.random() * GameConfig.canvas.width,
                Math.random() * GameConfig.canvas.height
            );

            this.addChild(graphic);
            this.stars.push({ graphic, speed: 20 + Math.random() * 60 });
        }
    }

    update(deltaSec: number): void {
        for (const star of this.stars) {
            star.graphic.y += star.speed * deltaSec;
            if (star.graphic.y > GameConfig.canvas.height) {
                star.graphic.y = -2;
                star.graphic.x = Math.random() * GameConfig.canvas.width;
            }
        }
    }
}
