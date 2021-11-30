export interface OscillationData {
    period?: number,
    amplitude?: number,
}

export class Oscillator {
    static readonly INFINITE_PERIOD = 1000000;

    private static readonly TWO_PI = 2 * Math.PI;

    private _started: boolean = false;
    private _startTime: number | undefined = undefined;
    private _period: number = Oscillator.INFINITE_PERIOD;
    private _amplitude: number = 1;
    private _phase: number = 0;
    private _previousPhase: number = 0;
    private _position11: number = 0;

    update(time: number) {
        if (this._started) {
            if (this._startTime === undefined) {
                this._startTime = time;
                this._previousPhase = this._phase;
            }
            this._phase = (time - this._startTime) * Oscillator.TWO_PI / this._period + this._previousPhase;
            this._position11 = this._amplitude * Math.sin(this._phase);
        }
    }

    start() {
        this._started = true;
    }

    stop() {
        this._started = false;
        this._startTime = undefined;
    }

    get position11(): number {
        return this._position11;
    }

    get period(): number {
        return this._period;
    }

    get amplitude(): number {
        return this._amplitude;
    }

    get phase(): number {
        return this._phase;
    }

    set(params: OscillationData) {
        if (params.period !== undefined) {
            this._period = params.period < 0.001 ? Oscillator.INFINITE_PERIOD : params.period;
            this._startTime = undefined;
        }
        if (params.amplitude !== undefined) {
            this._amplitude = params.amplitude;
            this._startTime = undefined;
        }
    }
}