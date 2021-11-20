export class Box {
    private readonly _context: CanvasRenderingContext2D;
    private readonly _boxSize: number;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;
    private _prevY?: number = undefined;

    constructor(canvas: HTMLCanvasElement, screenHeight: number, boxSize: number, padding: number) {
        this._context = canvas.getContext("2d")!;
        this._context.fillStyle = "#87ceeb";
        this._boxSize = boxSize;
        const minY = padding;
        const maxY = screenHeight - padding - boxSize;
        this._maxDeltaY = (maxY - minY) / 2;
        this._screenZeroY = padding + this._maxDeltaY;
    }

    /**
     * y11 - value in interval [-1..1].
     **/
    setPosition11(y11: number) {
        if (this._prevY !== undefined) {
            this._context.clearRect(0, this._prevY - 10, this._boxSize, this._boxSize + 20);
        }
        const y = this._screenZeroY + y11 * this._maxDeltaY;
        this._context.fillRect(0, y, this._boxSize, this._boxSize);
        this._prevY = y;
    }
}
