import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameConfig } from '../GameConfig';

export class MessageOverlay extends Container {
    private readonly backdrop = new Graphics();
    private readonly titleText: Text;
    private readonly subtitleText: Text;
    private readonly restartButton = new Container();

    private onRestart: (() => void) | null = null;

    constructor() {
        super();
        this.visible = false;
        this.eventMode = 'none';

        const { width, height } = GameConfig.canvas;

        this.backdrop.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.68 });
        this.addChild(this.backdrop);

        this.titleText = new Text({
            text: '',
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 72,
                fontWeight: '900',
                fontFamily: 'Arial, Helvetica, sans-serif',
                letterSpacing: 4
            })
        });
        this.titleText.anchor.set(0.5);
        this.titleText.position.set(width / 2, height / 2 - 60);
        this.addChild(this.titleText);

        this.subtitleText = new Text({
            text: '',
            style: new TextStyle({
                fill: 0xcfd2e0,
                fontSize: 22,
                fontFamily: 'Arial, Helvetica, sans-serif'
            })
        });
        this.subtitleText.anchor.set(0.5);
        this.subtitleText.position.set(width / 2, height / 2 + 4);
        this.addChild(this.subtitleText);

        this.buildRestartButton();
        this.addChild(this.restartButton);
    }

    private buildRestartButton(): void {
        const btnWidth = 240;
        const btnHeight = 58;
        const bg = new Graphics()
            .roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14)
            .fill({ color: 0x4f6df5 });

        const label = new Text({
            text: 'Play again',
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 22,
                fontWeight: '700',
                fontFamily: 'Arial, Helvetica, sans-serif'
            })
        });
        label.anchor.set(0.5);

        this.restartButton.addChild(bg, label);
        this.restartButton.position.set(GameConfig.canvas.width / 2, GameConfig.canvas.height / 2 + 90);
        this.restartButton.eventMode = 'static';
        this.restartButton.cursor = 'pointer';
        this.restartButton.on('pointertap', () => this.onRestart?.());

        this.restartButton.on('pointerover', () => (bg.tint = 0xdadfff));
        this.restartButton.on('pointerout', () => (bg.tint = 0xffffff));
    }

    show(options: { title: string; subtitle?: string; color: number; onRestart: () => void }): void {
        this.titleText.text = options.title;
        this.titleText.style.fill = options.color;
        this.subtitleText.text = options.subtitle ?? '';
        this.onRestart = options.onRestart;

        this.visible = true;
        this.eventMode = 'static';
    }

    hide(): void {
        this.visible = false;
        this.eventMode = 'none';
    }
}
