import { Container, Graphics } from 'pixi.js';
import { GameConfig } from '../GameConfig';

export class Player extends Container {
    private readonly body = new Graphics();

    constructor() {
        super();
        this.addChild(this.body);
        this.draw();
    }

    private draw(): void {
        const w = GameConfig.player.width;
        const h = GameConfig.player.height;

        this.body.clear();

        this.body
            .moveTo(w / 2, 0)
            .lineTo(w, h)
            .lineTo(w * 0.66, h * 0.72)
            .lineTo(w * 0.34, h * 0.72)
            .lineTo(0, h)
            .closePath()
            .fill({ color: GameConfig.colors.player });

        this.body.circle(w / 2, h * 0.42, w * 0.13).fill({ color: 0xbfe0ff });

        this.body.rect(w * 0.28, h * 0.78, w * 0.14, h * 0.22).fill({ color: 0xff9a4d });
        this.body.rect(w * 0.58, h * 0.78, w * 0.14, h * 0.22).fill({ color: 0xff9a4d });

        this.body.pivot.set(w / 2, h / 2);
    }

    get halfWidth(): number {
        return GameConfig.player.width / 2;
    }

    get boundsRect(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x,
            y: this.y,
            width: GameConfig.player.width,
            height: GameConfig.player.height
        };
    }
}
