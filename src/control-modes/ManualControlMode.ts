import {ControlMode, ControlModeState} from "./ControlMode";

export class ManualControlMode extends ControlMode {
    private _moveDiv: HTMLDivElement | undefined = undefined;
    private _screenZeroY!: number;
    private _maxDeltaY!: number;
    private _minY!: number;
    private _maxY!: number;

    private _mouseStartY: number | undefined = undefined;
    private _buttonStartY: number | undefined = undefined;

    private _position11: number = 0;

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Started;

        const parentDiv = document.getElementById("animation_div") as HTMLDivElement;
        this._moveDiv = document.getElementById("move_div") as HTMLDivElement;

        const padding = 20;
        this._minY = padding;
        const screenHeight = parentDiv.offsetHeight;
        const moveDivSize = this._moveDiv.clientWidth;
        this._maxY = screenHeight - padding - moveDivSize;
        this._maxDeltaY = (this._maxY - this._minY) / 2;
        this._screenZeroY = padding + this._maxDeltaY;
        this._moveDiv.style.top = this._screenZeroY + "px";
        this._moveDiv.style.visibility = "visible";

        this._moveDiv.removeEventListener("mousedown", this._mouseDownHandler);
        this._moveDiv.addEventListener("mousedown", this._mouseDownHandler);
        this._moveDiv.removeEventListener("mouseup", this._mouseUpHandler);
        this._moveDiv.addEventListener("mouseup", this._mouseUpHandler);
        this._moveDiv.removeEventListener("mousemove", this._mouseMoveHandler);
        this._moveDiv.addEventListener("mousemove", this._mouseMoveHandler);
        document.removeEventListener("mouseleave", this._mouseLeaveHandler);
        document.addEventListener("mouseleave", this._mouseLeaveHandler);
    }

    async activate() {
        if (this._moveDiv) {
            this._moveDiv.style.top = this._screenZeroY + "px";
            this._moveDiv.style.visibility = "visible";
        }
    }

    async deactivate() {
        if (this._moveDiv)
            this._moveDiv.style.visibility = "hidden";
    }

    getPosition11(): number {
        return this._position11;
    }

    private _mouseDownHandler = (ev: any) => {
        const rect = ev.target.getBoundingClientRect();
        this._buttonStartY = rect.top;
        this._mouseStartY = ev.clientY;
    }

    private _mouseUpHandler = (ev: any) => {
        this._mouseStartY = undefined;
        this._buttonStartY = undefined;
    }

    private _mouseMoveHandler = (ev: any) => {
        if (this._mouseStartY && this._buttonStartY && this._moveDiv) {
            const deltaY = ev.clientY - this._mouseStartY;
            let top = this._buttonStartY + deltaY;
            if (top > this._maxY)
                top = this._maxY;
            else if (top < this._minY)
                top = this._minY;

            this._position11 = -(top - this._screenZeroY) / this._maxDeltaY;

            this._moveDiv.style.top = top + "px";
        } else {
            this._mouseStartY = undefined;
            this._buttonStartY = undefined;
        }
    }

    private _mouseLeaveHandler = () => {
        this._mouseStartY = undefined;
        this._buttonStartY = undefined;
    }
}