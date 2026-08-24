import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class HPBar extends Container {
    private readonly track = new Graphics();
    private readonly fill = new Graphics();
    private readonly labelText: Text;
    private readonly barWidth: number;
    private readonly barHeight: number = 18;

    constructor(barWidth = 220, barHeight = 18) {
        super();

        this.barWidth = barWidth;
        this.barHeight = barHeight;

        this.track
            .roundRect(0, 0, this.barWidth, this.barHeight, 8)
            .fill({ color: 0x1f2130 })
            .stroke({ width: 2, color: 0xffffff, alpha: 0.25 });

        this.labelText = new Text({
            text: 'BOSS',
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 14,
                fontFamily: 'Arial, sans-serif',
                fontWeight: '700'
            })
        });
        this.labelText.anchor.set(0.5);
        this.labelText.position.set(this.barWidth / 2, -14);

        this.addChild(this.track, this.fill, this.labelText);
        this.setRatio(1);
    }

    setRatio(ratio: number): void {
        const clamped = Math.max(0, Math.min(1, ratio));
        this.fill.clear();
        const width = this.barWidth * clamped;
        if (width > 0) {
            const color = clamped > 0.5 ? 0x6fcf97 : clamped > 0.25 ? 0xf5a742 : 0xff5c5c;
            this.fill.roundRect(0, 0, width, this.barHeight, 8).fill({ color });
        }
    }
}
