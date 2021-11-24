import {ControlMode, ControlModeState} from "./ControlMode";

export class ManualControlMode extends ControlMode {
    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Started;
    }

    async activate() {
    }

    async deactivate() {
    }

    getPosition11(): number {
        return 0;
    }
}