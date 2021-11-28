import {ControlModeState, ControlModeType} from "./ControlMode";
import {BaseAutoControlMode} from "./BaseAutoControlMode";

enum ThumbType { Amplitude, Frequency }

type OnChangedFunction = (thumbType: ThumbType, thumbElement: HTMLDivElement, newValue11: number, oldValue: number) => void;

class ThumbData {
    thumbType: ThumbType;
    pointerId: number | undefined;
    pointerStartY: number = 0;
    buttonStartY: number = 0;
    thumbElement: HTMLDivElement | undefined;
    backgroundElement: HTMLDivElement | undefined;
    screenZeroY: number = 0;
    maxDeltaY: number = 0;
    minY: number = 0;
    maxY: number = 0;
    readonly onChanged: OnChangedFunction;

    private _position11: number = 0;
    set position11(value: number) {
        if (value !== this._position11 && this.thumbElement) {
            this.onChanged(this.thumbType, this.thumbElement, value, this._position11);
            this._position11 = value;
        }
    }
    get position11(): number { return this._position11; }

    constructor(thumbType: ThumbType, onChanged: OnChangedFunction) {
        this.thumbType = thumbType;
        this.onChanged = onChanged;
    }
}

export class AutomaticControlMode extends BaseAutoControlMode {
    private static readonly TWO_PI = 2 * Math.PI;

    private readonly _sliderBackgroundNormalColor = "#006539";
    private readonly _sliderBackgroundFocusedColor = "#009051";

    private _parentDiv: HTMLDivElement | undefined = undefined;
    private _sliders: HTMLDivElement | undefined = undefined;
    private _legendDiv: HTMLDivElement | undefined = undefined;

    private readonly _amplitudeData: ThumbData;
    private readonly _frequencyData: ThumbData;

    private _startTime: number | undefined = undefined;
    private _period: number = 1000;
    private _amplitude: number = 1;
    private _phase: number = 0;
    private _previousPhase: number = 0;
    private _position11: number = 0;

    private readonly _minPeriod: number = 500;
    private readonly _maxPeriod: number = 2000;
    private readonly _minAmplitude: number = 0.1;
    private readonly _maxAmplitude: number = 1;

    constructor() {
        super(ControlModeType.Automatic);
        this._amplitudeData = new ThumbData(ThumbType.Amplitude, this._onSliderChanged);
        this._frequencyData = new ThumbData(ThumbType.Frequency, this._onSliderChanged);
    }

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);

        try {
            this._initializeNoSleep();
            this._initializeHtmlElements();

            this._state = ControlModeState.Stopped;
        } catch(e: any) {
            this._outputError(e);
        }
    }

    async activate() {
        await super.activate();
        if (this._sliders) {
            this._resizeHandler();
            if (this._amplitudeData.thumbElement)
                this._amplitudeData.thumbElement.style.top = this._amplitudeData.screenZeroY + "px";
            if (this._frequencyData.thumbElement)
                this._frequencyData.thumbElement.style.top = this._frequencyData.screenZeroY + "px";
            this._sliders.style.visibility = "visible";
            this._removeListeners();
            this._addListeners();
        }

        this._period = this._getPeriod(this._frequencyData.position11);
        this._amplitude = this._getAmplitude(this._amplitudeData.position11);

        if (this._legendDiv) {
            this._updateLegendDiv();
            this._legendDiv.style.display = "block";
        }
    }

    async deactivate() {
        await super.deactivate();
        if (this._sliders) {
            this._sliders.style.visibility = "hidden";
            this._removeListeners();
        }
        if (this._legendDiv) {
            this._clearLegendDiv();
            this._legendDiv.style.visibility = "none";
        }
    }

    getPosition11(time: number): number {
        if (this._state === ControlModeState.Started) {
            if (this._startTime === undefined) {
                this._startTime = time;
                this._previousPhase = this._phase;
            }
            this._phase = (time - this._startTime) * AutomaticControlMode.TWO_PI / this._period + this._previousPhase;
            this._position11 = this._amplitude * Math.sin(this._phase);
        }
        return this._position11;
    }

    protected _initializeHtmlElements() {
        super._initializeHtmlElements();

        this._parentDiv = document.getElementById("container_div") as HTMLDivElement;
        this._sliders = document.getElementById("sliders") as HTMLDivElement;
        this._legendDiv = document.getElementById("periodLegend") as HTMLDivElement;

        this._amplitudeData.backgroundElement = document.getElementById("amplitude_background") as HTMLDivElement;
        this._amplitudeData.thumbElement = document.getElementById("amplitude_thumb") as HTMLDivElement;
        (this._amplitudeData.thumbElement as any).thumbData = this._amplitudeData;

        this._frequencyData.backgroundElement = document.getElementById("frequency_background") as HTMLDivElement;
        this._frequencyData.thumbElement = document.getElementById("frequency_thumb") as HTMLDivElement;
        (this._frequencyData.thumbElement as any).thumbData = this._frequencyData;

        this._resizeHandler();
        this._amplitudeData.thumbElement.style.top = this._amplitudeData.screenZeroY + "px";
        this._frequencyData.thumbElement.style.top = this._frequencyData.screenZeroY + "px";
    }

    protected async _start() {
        await super._start();
    }

    protected async _stop() {
        await super._stop();
        this._startTime = undefined;
    }

    private _addListeners() {
        window.addEventListener("resize", this._resizeHandler);
        this._amplitudeData.thumbElement!.addEventListener("pointerdown", this._pointerDownHandler);
        this._frequencyData.thumbElement!.addEventListener("pointerdown", this._pointerDownHandler);
        document.addEventListener("pointerup", this._pointerUpHandler);
        document.addEventListener("pointermove", this._pointerMoveHandler);
        document.addEventListener("pointerleave", this._pointerLeaveHandler);
    }

    private _removeListeners() {
        window.removeEventListener("resize", this._resizeHandler);
        this._amplitudeData.thumbElement!.removeEventListener("pointerdown", this._pointerDownHandler);
        this._frequencyData.thumbElement!.removeEventListener("pointerdown", this._pointerDownHandler);
        document.removeEventListener("pointerup", this._pointerUpHandler);
        document.removeEventListener("pointermove", this._pointerMoveHandler);
        document.removeEventListener("pointerleave", this._pointerLeaveHandler);
    }

    private readonly _resizeHandler = () => {
        const updateThumbData = (thumbData: ThumbData) => {
            thumbData.backgroundElement!.style.top = ((this._parentDiv!.offsetHeight - thumbData.backgroundElement!.offsetHeight) / 2) + "px";

            thumbData.minY = thumbData.backgroundElement!.offsetTop;
            thumbData.maxY = thumbData.backgroundElement!.offsetTop + thumbData.backgroundElement!.offsetHeight - thumbData.thumbElement!.offsetHeight;
            thumbData.maxDeltaY = (thumbData.maxY - thumbData.minY) / 2;
            thumbData.screenZeroY = thumbData.minY + thumbData.maxDeltaY;

            const top = thumbData.screenZeroY - thumbData.position11 * thumbData.maxDeltaY;
            thumbData.thumbElement!.style.top = top + "px";
        }
        updateThumbData(this._amplitudeData);
        updateThumbData(this._frequencyData);
    }

    private readonly _pointerDownHandler = (ev: any) => {
        const thumbData: ThumbData | undefined = ev.target.thumbData;
        if (thumbData === undefined || thumbData.pointerId) return;
        const rect = ev.target.getBoundingClientRect();
        thumbData.pointerId = ev.pointerId;
        thumbData.pointerStartY = ev.clientY;
        thumbData.buttonStartY = rect.top;
        if (thumbData.backgroundElement) {
            thumbData.backgroundElement.style.background = this._sliderBackgroundFocusedColor;
        }
    }

    private readonly _pointerUpHandler = (ev: any) => {
        const thumbData: ThumbData | undefined = this._amplitudeData.pointerId !== undefined ? this._amplitudeData :
            this._frequencyData.pointerId !== undefined ? this._frequencyData : undefined;

        if (thumbData !== undefined && thumbData.pointerId !== undefined && thumbData.pointerId === ev.pointerId) {
            thumbData.pointerId = undefined;
            if (thumbData.backgroundElement) {
                thumbData.backgroundElement.style.background = this._sliderBackgroundNormalColor;
            }
        }
    }

    private readonly _pointerMoveHandler = (ev: any) => {
        const thumbData: ThumbData | undefined = this._amplitudeData.pointerId !== undefined ? this._amplitudeData :
            this._frequencyData.pointerId !== undefined ? this._frequencyData : undefined;

        if (thumbData !== undefined && thumbData.pointerId !== undefined && thumbData.pointerId === ev.pointerId) {
            const deltaY = ev.clientY - thumbData.pointerStartY;
            let top = thumbData.buttonStartY + deltaY;
            if (top > thumbData.maxY)
                top = thumbData.maxY;
            else if (top < thumbData.minY)
                top = thumbData.minY;

            thumbData.position11 = -(top - thumbData.screenZeroY) / thumbData.maxDeltaY;

            if (thumbData.thumbElement) {
                thumbData.thumbElement.style.top = top + "px";
            }
        }
    }

    private readonly _pointerLeaveHandler = (ev: any) => {
        this._pointerUpHandler(ev);
    }

    private _onSliderChanged = (thumbType: ThumbType, _thumbElement: HTMLDivElement, _newValue11: number, _oldValue: number) => {
        this._startTime = undefined;
        if (thumbType === ThumbType.Frequency) {
            this._period = this._getPeriod(this._frequencyData.position11);
        } else if (thumbType === ThumbType.Amplitude) {
            this._amplitude = this._getAmplitude(this._amplitudeData.position11);
        }
        this._updateLegendDiv();
    }

    private readonly _getPeriod = (thumbPosition11: number): number => {
        const factor = 1.0 - (thumbPosition11 + 1.0) / 2.0;
        return this._minPeriod + factor * (this._maxPeriod - this._minPeriod);
    }

    private readonly _getAmplitude = (thumbPosition11: number): number => {
        const factor = (thumbPosition11 + 1.0) / 2.0;
        return this._minAmplitude + factor * (this._maxAmplitude - this._minAmplitude);
    }

    private _updateLegendDiv = () => {
        if (this._legendDiv) {
            const a = this._amplitude * 10;
            const f = 1000.0 / this._period;
            this._legendDiv.innerText = `Amplitude (Δ): ${a.toFixed(2)} cm\nFrequency (ƒ): ${f.toFixed(2)} Hz`;
        }
    }

    private _clearLegendDiv = () => {
        if (this._legendDiv) {
            this._legendDiv.innerText = "";
        }
    }
}