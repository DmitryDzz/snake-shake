import {ControlMode, ControlModeState} from "./ControlMode";

export class AutomaticControlMode extends ControlMode {
    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Stopped;
    }

    async activate() {
    }

    async deactivate() {
    }

    getPosition11(): number {
        return 0;
    }
}