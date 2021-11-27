import {ControlMode, ControlModeState, ControlModeType} from "./ControlMode";

interface PointerData {
    pointerId: number;
    pointerStartY: number;
    buttonStartY: number;
}

export class ManualControlMode extends ControlMode {
    private _moveDiv: HTMLDivElement | undefined = undefined;
    private _screenZeroY!: number;
    private _maxDeltaY!: number;
    private _minY!: number;
    private _maxY!: number;

    private _pointerData: PointerData | undefined = undefined;
    private _position11: number = 0;

    constructor() {
        super(ControlModeType.Manual);
    }

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Started;

        const parentDiv = document.getElementById("container_div") as HTMLDivElement;
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
    }

    async activate() {
        if (this._moveDiv) {
            this._moveDiv.style.top = this._screenZeroY + "px";
            this._moveDiv.style.visibility = "visible";
            this._removeListeners();
            this._addListeners();
        }
    }

    async deactivate() {
        if (this._moveDiv) {
            this._moveDiv.style.visibility = "hidden";
            this._removeListeners();
        }
    }

    getPosition11(): number {
        return this._position11;
    }

    private _addListeners() {
        this._moveDiv!.addEventListener("pointerdown", this._pointerDownHandler);
        document.addEventListener("pointerup", this._pointerUpHandler);
        document.addEventListener("pointermove", this._pointerMoveHandler);
        document.addEventListener("pointerleave", this._pointerLeaveHandler);
    }

    private _removeListeners() {
        this._moveDiv!.removeEventListener("pointerdown", this._pointerDownHandler);
        document.removeEventListener("pointerup", this._pointerUpHandler);
        document.removeEventListener("pointermove", this._pointerMoveHandler);
        document.removeEventListener("pointerleave", this._pointerLeaveHandler);
    }

    private _pointerDownHandler = (ev: any) => {
        if (this._pointerData) return;
        const rect = ev.target.getBoundingClientRect();
        this._pointerData = {
            pointerId: ev.pointerId,
            pointerStartY: ev.clientY,
            buttonStartY: rect.top,
        }
    }

    private _pointerUpHandler = (ev: any) => {
        if (this._pointerData && ev.pointerId === this._pointerData.pointerId) {
            this._pointerData = undefined;
        }
    }

    private _pointerMoveHandler = (ev: any) => {
        if (this._moveDiv && this._pointerData && ev.pointerId === this._pointerData.pointerId) {
            const deltaY = ev.clientY - this._pointerData.pointerStartY;
            let top = this._pointerData.buttonStartY + deltaY;
            if (top > this._maxY)
                top = this._maxY;
            else if (top < this._minY)
                top = this._minY;

            this._position11 = -(top - this._screenZeroY) / this._maxDeltaY;

            this._moveDiv.style.top = top + "px";
        }
    }

    private _pointerLeaveHandler = (ev: any) => {
        if (this._pointerData && ev.pointerId === this._pointerData.pointerId) {
            this._pointerData = undefined;
        }
    }
}