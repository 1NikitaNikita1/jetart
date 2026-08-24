export class InputController {
    private readonly pressedKeys = new Set<string>();
    private shootCallback: (() => void) | null = null;
    private enabled = true;

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    onShoot(callback: () => void): void {
        this.shootCallback = callback;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) this.pressedKeys.clear();
    }

    get isLeftPressed(): boolean {
        return this.enabled && this.pressedKeys.has('ArrowLeft');
    }

    get isRightPressed(): boolean {
        return this.enabled && this.pressedKeys.has('ArrowRight');
    }

    destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.pressedKeys.clear();
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.enabled) return;

        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'Space') {
            event.preventDefault();
        }

        if (event.code === 'Space' && !event.repeat) {
            this.shootCallback?.();
        }

        this.pressedKeys.add(event.code);
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        this.pressedKeys.delete(event.code);
    };
}
