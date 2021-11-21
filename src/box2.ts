export class Box2 {
    private readonly _snake: HTMLElement;
    private readonly _boxSize: number;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;
    // private _prevY?: number = undefined;

    constructor(parentDiv: HTMLDivElement, snake: HTMLElement, boxSize: number, padding: number) {
        this._snake = snake;
        this._boxSize = boxSize;
        const minY = padding;
        const screenHeight = parentDiv.offsetHeight;
        const maxY = screenHeight - padding - boxSize;
        this._maxDeltaY = (maxY - minY) / 2;
        this._screenZeroY = padding + this._maxDeltaY;

        snake.style.left = (window.innerWidth - boxSize) / 2 + "px";
        snake.style.top = this._screenZeroY + "px";
    }

    /**
     * y11 - value in interval [-1..1].
     **/
    setPosition11(y11: number) {
        // if (this._prevY !== undefined) {
        //     this._context.clearRect(0, this._prevY - 10, this._boxSize, this._boxSize + 20);
        // }
        // const y = this._screenZeroY + y11 * this._maxDeltaY;
        // this._context.fillRect(0, y, this._boxSize, this._boxSize);
        // this._prevY = y;
        this._snake.style.top = this._screenZeroY + this._maxDeltaY * y11 + "px";
        //console.log(this._snake.style.top);
    }
}
