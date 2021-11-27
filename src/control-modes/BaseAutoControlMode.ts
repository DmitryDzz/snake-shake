import {ControlMode, ControlModeState} from "./ControlMode";
import NoSleep from "nosleep.js";

export class BaseAutoControlMode extends ControlMode {
    private _noSleep: NoSleep | undefined = undefined;

    private _startButton: HTMLButtonElement | undefined = undefined;

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Stopped;
    }

    async activate() {
        if (this._startButton) {
            this._startButton.removeEventListener("click", this._onStartButtonClickHandler);
            this._startButton.addEventListener("click", this._onStartButtonClickHandler);
            this._startButton.style.visibility = "visible";
        }
    }

    async deactivate() {
        if (this._startButton) {
            this._startButton.style.visibility = "hidden";
            this._startButton.removeEventListener("click", this._onStartButtonClickHandler);
        }
        await this._stop();
    }

    getPosition11(_time: number): number {
        return 0;
    }

    protected _initializeNoSleep() {
        this.disableNoSleep();
        this._noSleep = new NoSleep();
        document.removeEventListener("visibilitychange", this._onPageVisibilityChangeHandler);
        document.addEventListener("visibilitychange", this._onPageVisibilityChangeHandler);
    }

    protected _initializeHtmlElements() {
        this._startButton = document.getElementById("start_button") as HTMLButtonElement;
        this._startButton.style.visibility = "hidden";
    }

    protected async _start() {
        this._state = ControlModeState.Started;
        if (this._startButton) {
            this._startButton.innerText = "Stop";
        }
        await this.enableNoSleepAsync();
    }

    protected async _stop() {
        this._state = ControlModeState.Stopped;
        if (this._startButton) {
            this._startButton.innerText = "Start";
        }
        this.disableNoSleep();
    }

    private readonly _onPageVisibilityChangeHandler = async () => {
        if (document.visibilityState === "visible") {
            if (this._state === ControlModeState.Started)
                await this.enableNoSleepAsync();
        } else if (document.visibilityState === "hidden") {
            if (this._state === ControlModeState.Started)
                this.disableNoSleep();
        }
    };

    private async enableNoSleepAsync() {
        if (this._noSleep) {
            await this._noSleep.enable();
            // console.log("NoSleep enabled");
        }
    }

    private disableNoSleep() {
        if (this._noSleep) {
            this._noSleep.disable();
            // console.log("NoSleep disabled");
        }
    }

    private readonly _onStartButtonClickHandler = async () => {
        if (this._state === ControlModeState.Stopped) {
            await this._start();
        } else if (this._state === ControlModeState.Started) {
            await this._stop();
        }
    }
}