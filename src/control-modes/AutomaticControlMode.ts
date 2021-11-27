import {ControlModeState, ControlModeType} from "./ControlMode";
import {BaseAutoControlMode} from "./BaseAutoControlMode";

export class AutomaticControlMode extends BaseAutoControlMode {
    constructor() {
        super(ControlModeType.Automatic);
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

    getPosition11(_time: number): number {
        return 0;
    }

    protected _initializeHtmlElements() {
        super._initializeHtmlElements();
        //...
    }

    protected async _start() {
        await super._start();
        //...
        console.log("auto start");
    }

    protected async _stop() {
        await super._stop();
        //...
        console.log("auto stop");
    }
}