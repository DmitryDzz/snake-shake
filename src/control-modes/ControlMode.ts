export type ErrorCallback = (message: string) => void;

export enum ControlModeState { Uninitialized, Stopped, Started}

export abstract class ControlMode {
    private _errorHandler: ErrorCallback | undefined = undefined;

    protected _state: ControlModeState = ControlModeState.Uninitialized;

    async initialize(onErrorCallback: (message: string) => void) {
        this._errorHandler = onErrorCallback;
    }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract getPosition11(): number;

    protected _outputError = (message: string) => {
        if (this._errorHandler)
            this._errorHandler(message);
    }
}