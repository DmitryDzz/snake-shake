import {AccCore} from "./acc_core";

export class Box {
    private readonly _snakeDiv: HTMLDivElement;
    private readonly _snakeImage: HTMLImageElement;
    private readonly _accCore: AccCore;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;

    constructor(parentDiv: HTMLDivElement, snakeDiv: HTMLDivElement, snakeImage: HTMLImageElement,
                boxSize: number, padding: number, accCore: AccCore) {
        this._snakeDiv = snakeDiv;
        this._snakeImage = snakeImage;
        this._accCore = accCore;

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
        if (this._prevY11 > 0 && y11 <= 0) {
            this._snakeImage.style.animation = `squeeze ${(this._accCore.getPeriod() / 4000.0).toFixed(3)}s`;
            console.log("squeeze", this._snakeImage.style.animation);
        }
        if (this._prevY11 <= 0 && y11 > 0) {
            this._snakeImage.style.animation = `jump ${(this._accCore.getPeriod() / 4000.0).toFixed(3)}s`;
            console.log("jump", this._snakeImage.style.animation);
        }
        this._prevY11 = y11;

        this._snakeDiv.style.top = (this._screenZeroY - this._maxDeltaY * y11) + "px";
    }
}
