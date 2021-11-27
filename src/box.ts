import {gsap as gs} from "gsap";
import Timeline = gsap.core.Timeline;

export class Box {
    private readonly _snakeDiv: HTMLDivElement;
    private readonly _snakeHeadImage: HTMLImageElement;
    private readonly _snakeBodyImage: HTMLImageElement;
    private readonly _snakeTongueImage: HTMLImageElement;
    private readonly _screenZeroY: number;
    private readonly _maxDeltaY: number;
    private readonly _animation: Timeline;

    private _targetPosition11: number = 0;
    private _actualPosition11: number = 0;
    private readonly MAX_SPEED_11: number = 4.0 / 1000.0; // Full amplitude (-1..+1 = 2.0) per millisecond.
    private _time: number | undefined = undefined;

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

        // gsap.to("#snake_head_img", {duration: 1, y: 100});
        this._animation = gs.timeline()
            .to("#snake_head_img", {duration: 1, y: 32}, 0)
            .to("#snake_body_img", {duration: 1, scaleY: 0.5}, 0)
            .to("#snake_tongue_img", {duration: 1, opacity: 1}, 0)
            .pause();
    }

    /**
     * y11 - value in interval [-1..1].
     **/
    setPosition11(y11: number) {
        this._targetPosition11 = Math.min(Math.max(y11, -1), 1);
    }

    /**
     * Must be called continuously.
     */
    update() {
        const time = Date.now();
        if (this._time === undefined) {
            this._actualPosition11 = this._targetPosition11;
        } else {
            const deltaTime = time - this._time;

            let deltaY = this._targetPosition11 - this._actualPosition11;

            let maxDeltaY = this.MAX_SPEED_11 * deltaTime;
            maxDeltaY = Math.min(Math.abs(deltaY), maxDeltaY);

            deltaY = deltaY > 0 ? maxDeltaY : -maxDeltaY;
            this._actualPosition11 += deltaY;
        }
        this._time = time;

        this._snakeDiv.style.top = (this._screenZeroY - this._maxDeltaY * this._actualPosition11) + "px";
        this._animate(this._actualPosition11);
    }

    private _animate(y11: number) {
        if (y11 < -0.5) {
            // Values on edges:
            // y11=-0.5 => 0
            // y11=-1.0 => 1
            this._animation.progress(-(y11 + 0.5) * 2);
        } else {
            this._animation.progress(0);
        }
    }
}
