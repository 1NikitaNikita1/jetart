import { Container, Text, TextStyle } from 'pixi.js';
import { GameConfig } from '../GameConfig';

export class HUD extends Container {
    private readonly shotsText: Text;
    private readonly timerText: Text;
    private readonly levelText: Text;

    constructor() {
        super();

        const style = new TextStyle({
            fill: 0xffffff,
            fontSize: 24,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: '700'
        });

        this.shotsText = new Text({ text: '', style });
        this.shotsText.position.set(24, 18);

        this.timerText = new Text({ text: '', style: style.clone() });
        this.timerText.anchor.set(0.5, 0);
        this.timerText.position.set(GameConfig.canvas.width / 2, 18);

        this.levelText = new Text({ text: '', style: style.clone() });
        this.levelText.anchor.set(1, 0);
        this.levelText.position.set(GameConfig.canvas.width - 24, 18);

        this.addChild(this.shotsText, this.timerText, this.levelText);
    }

    setShots(remaining: number, max: number): void {
        this.shotsText.text = `Ammo: ${remaining}/${max}`;
    }

    setTimeLeft(seconds: number): void {
        const clamped = Math.max(0, Math.ceil(seconds));
        const mm = Math.floor(clamped / 60)
            .toString()
            .padStart(2, '0');
        const ss = (clamped % 60).toString().padStart(2, '0');
        this.timerText.text = `⏱ ${mm}:${ss}`;
        this.timerText.style.fill = clamped <= 10 ? 0xff5c5c : 0xffffff;
    }

    setLevelLabel(label: string): void {
        this.levelText.text = label;
    }
}
