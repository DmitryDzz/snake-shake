export class Box {
    private readonly _snakeDiv: HTMLDivElement;
    private readonly _snakeHeadImage: HTMLImageElement;
    private readonly _snakeBodyImage: HTMLImageElement;
    private readonly _snakeTongueImage: HTMLImageElement;
    // private readonly _accCore: AccCore;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;

    constructor(parentDiv: HTMLDivElement,
                snakeDiv: HTMLDivElement,
                snakeHeadImage: HTMLImageElement,
                snakeBodyImage: HTMLImageElement,
                snakeTongueImage: HTMLImageElement,
                boxSize: number, padding: number) {
        this._snakeDiv = snakeDiv;
        this._snakeHeadImage = snakeHeadImage;
        this._snakeBodyImage = snakeBodyImage;
        this._snakeTongueImage = snakeTongueImage;
        // this._accCore = accCore;

        const minY = padding;
        // console.log("++++++++++ oW:", parentDiv.offsetWidth, ", oH:", parentDiv.offsetHeight,
        //     ", wW:", window.innerWidth, ", wH:", window.innerHeight,
        //     ", cW:", parentDiv.clientWidth, ", cH:", parentDiv.clientHeight);
        const screenHeight = parentDiv.offsetHeight;
        // const screenHeight = parentDiv.clientHeight;
        const maxY = screenHeight - padding - boxSize;
        this._maxDeltaY = (maxY - minY) / 2;
        this._screenZeroY = padding + this._maxDeltaY;

        snakeDiv.style.left = (parentDiv.offsetWidth - boxSize) / 2 + "px";
        // snakeDiv.style.left = (parentDiv.clientWidth - boxSize) / 2 + "px";
        snakeDiv.style.top = this._screenZeroY + "px";
        snakeDiv.style.visibility = "visible";
    }

    // private _prevY11?: number = undefined;
    // private _prevDeltaY11?: number = undefined;

    /**
     * y11 - value in interval [-1..1].
     **/
    setPosition11(y11: number) {
        // if (this._prevY11 !== undefined) {
        //     if (this._prevY11 > 0 && y11 <= 0) {
        //         const duration = (this._accCore.getPeriod() / 4000.0).toFixed(3);
        //         this._snakeHeadImage.style.animation = `head_squeeze ${duration}s`;
        //         this._snakeBodyImage.style.animation = `body_squeeze ${duration}s`;
        //         this._snakeTongueImage.style.animation = `fadein ${duration}s`;
        //     }
        //     const deltaY11 = y11 - this._prevY11;
        //     if (this._prevDeltaY11 !== undefined) {
        //         if (this._prevDeltaY11 < 0 && deltaY11 >= 0) {
        //             const duration = (this._accCore.getPeriod() / 4000.0).toFixed(3);
        //             this._snakeHeadImage.style.animation = `head_jump ${duration}s`;
        //             this._snakeBodyImage.style.animation = `body_jump ${duration}s`;
        //             this._snakeTongueImage.style.animation = `fadeout ${duration}s`;
        //         }
        //     }
        //     this._prevDeltaY11 = deltaY11;
        // }
        // this._prevY11 = y11;

        this._snakeDiv.style.top = (this._screenZeroY - this._maxDeltaY * y11) + "px";
    }
}
