import { Application } from 'pixi.js';
import type { GameConfig } from '../../config/Games';

export abstract class BaseGame {
    protected app: Application;
    protected config: GameConfig;

    constructor(config: GameConfig) {
        this.config = config;
        this.app = new Application();
    }

    async init(container: HTMLElement): Promise<void> {
        await this.app.init({
            width: this.config.width,
            height: this.config.height,
            background: '#1a1a1a'
        });

        container.appendChild(this.app.canvas);

        this.setup();
    }

    protected abstract setup(): void;

    public destroy(): void {
        this.app.destroy(true);
    }
}
