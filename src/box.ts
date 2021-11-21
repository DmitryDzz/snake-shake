export class Box {
    private readonly _snakeDiv: HTMLDivElement;
    private readonly _snakeImage: HTMLImageElement;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;

    constructor(parentDiv: HTMLDivElement, snakeDiv: HTMLDivElement, snakeImage: HTMLImageElement, boxSize: number, padding: number) {
        this._snakeDiv = snakeDiv;
        this._snakeImage = snakeImage;
        const minY = padding;
        const screenHeight = parentDiv.offsetHeight;
        const maxY = screenHeight - padding - boxSize;
        this._maxDeltaY = (maxY - minY) / 2;
        this._screenZeroY = padding + this._maxDeltaY;

        snakeDiv.style.left = (window.innerWidth - boxSize) / 2 + "px";
        snakeDiv.style.top = this._screenZeroY + "px";
    }

    private _prevY11: number = 0;

    /**
     * y11 - value in interval [-1..1].
     **/
    setPosition11(y11: number) {
        if (this._prevY11 > 0 && y11 < 0) {
            this._snakeImage.style.animation = "squeeze";
            // this._snakeImage.hidden = true;
            // console.log("squeeze", this._snakeImage.src);
        }
        if (this._prevY11 > 0 && y11 < 0) {
            this._snakeImage.style.animation = "jump";
            // this._snakeImage.hidden = false;
            // console.log("jump", this._snakeImage.src);
        }
        this._prevY11 = y11;

        this._snakeDiv.style.top = this._screenZeroY + this._maxDeltaY * y11 + "px";
    }
}
