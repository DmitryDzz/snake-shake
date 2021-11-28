import {ControlMode, ControlModeState, ControlModeType} from "./ControlMode";

export class JoystickControlMode extends ControlMode {
    private _position11: number = 0;

    constructor() {
        super(ControlModeType.Joystick);
    }

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
        this._state = ControlModeState.Started;
    }

    async activate() {
        this._removeListeners();
        this._addListeners();
    }

    async deactivate() {
        this._removeListeners();
    }

    getPosition11(_time: number): number {
        return this._position11;
    }

    private _addListeners() {
        //...
    }

    private _removeListeners() {
        //...
    }
}