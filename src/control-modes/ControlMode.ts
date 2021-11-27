export type ErrorCallback = (message: string) => void;

export enum ControlModeState { Uninitialized, Stopped, Started}

export enum ControlModeType { Manual, Automatic, Shake}

export abstract class ControlMode {
    private _errorHandler: ErrorCallback | undefined = undefined;

    protected _state: ControlModeState = ControlModeState.Uninitialized;
    protected _mode: ControlModeType;

    protected constructor(mode: ControlModeType) {
        this._mode = mode;
    }

    async initialize(onErrorCallback: (message: string) => void) {
        this._errorHandler = onErrorCallback;
    }

    get mode(): ControlModeType {return this._mode};

    abstract activate(): Promise<void>;
    abstract deactivate(): Promise<void>;
    abstract getPosition11(time: number): number;

    protected _outputError = (message: string) => {
        if (this._errorHandler)
            this._errorHandler(message);
    }
}