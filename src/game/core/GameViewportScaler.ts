import { GameConfig } from '../GameConfig';

export class GameViewportScaler {
    private resizeObserver: ResizeObserver | null = null;
    private readonly viewport: HTMLElement;
    private readonly gameRoot: HTMLElement;

    constructor(viewport: HTMLElement, gameRoot: HTMLElement) {
        this.viewport = viewport;
        this.gameRoot = gameRoot;

        this.applyScale();

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.applyScale());
            this.resizeObserver.observe(this.viewport);
        } else {
            window.addEventListener('resize', this.applyScale);
            window.addEventListener('orientationchange', this.applyScale);
        }
    }

    private applyScale = (): void => {
        const availableWidth = this.viewport.clientWidth;
        const availableHeight = this.viewport.clientHeight;
        if (availableWidth === 0 || availableHeight === 0) return;

        const scale = Math.min(
            availableWidth / GameConfig.canvas.width,
            availableHeight / GameConfig.canvas.height
        );

        this.gameRoot.style.transform = `scale(${scale})`;
    };

    destroy(): void {
        this.resizeObserver?.disconnect();
        window.removeEventListener('resize', this.applyScale);
        window.removeEventListener('orientationchange', this.applyScale);
    }
}
