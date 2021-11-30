import {Oscillator} from "./Oscillator";

type numberable = number | undefined;

export interface Measurement {
    t: number;
    y: number;
}

export class Options {
    minAccAmplitude: number = 1.0; // Values less than this value are equal to zero.
    maxPeriod: number = 3000; // Values greater than this value are equal to INFINITE_PERIOD.
    periodSpeed: number = 1000; // Milliseconds per millisecond. The period cannot be changed faster.
    autoStart: boolean = false;
}

export class AccCore {
    private readonly _options: Options;

    private _minAccY: number = 0;
    private _maxAccY: number = 0;
    private _accAmplitude: number = 0;
    private _debugAccY: numberable = undefined;

    private _period: numberable = undefined;
    private _prevPeriod: numberable = undefined;
    private _lastPeriodMeasuredTime: numberable = undefined;

    private _amplitude: number = 0.0;

    private _t0: number | undefined = undefined;
    private _prevY: numberable = undefined;
    private _prevYt: numberable = undefined;
    private _prevT0: numberable = undefined;

    private _stopped: boolean = false;

    private _oscillator: Oscillator = new Oscillator();

    constructor(options?: Options) {
        this._options = options ?? new Options();
        this._stopped = !this._options.autoStart;
    }

    private _clear() {
        this._minAccY = 0;
        this._maxAccY = 0;
        this._debugAccY = undefined;
        this._amplitude = 0.0;
        this._period = undefined;
        this._prevPeriod = undefined;
        this._prevY = undefined;
        this._prevYt = undefined;
        this._prevT0 = undefined;
        this._stopped = false;
        this._oscillator.stop();
    }

    stop() {
        this._clear();
        this._stopped = true;
        this._oscillator.stop();
    }

    start() {
        if (this._stopped) this._stopped = false;
        this._oscillator.start();
    }

    get stopped(): boolean {
        return this._stopped;
    }

    get started(): boolean {
        return !this._stopped;
    }

    getDebugAccY(): number {
        return this._debugAccY ?? 0.0;
    }

    getPosition11(t: number): number {
        if (!this._stopped && this._period !== undefined) {
            if (this._t0 === undefined) this._t0 = t;
            this._oscillator.update(t);
        }
        return this._oscillator.position11;
    }

    getPeriod(): number {
        return this._oscillator.period;
    }

    getAmplitude(): number {
        return this._oscillator.amplitude;
    }

    getPhase(): number {
        return this._oscillator.phase;
    }

    update(acc: Measurement) {
        if (this._stopped) return;
        const y = acc.y;
        const t = acc.t;
        if (this._prevY !== undefined) {
            if (this._prevY * y < 0) { // (sign changed)
                const t0: number = this._prevY * (t - this._prevYt!) / (this._prevY - y) + this._prevYt!;
                if (this._prevT0 !== undefined) {

                    //TODO DZZ: Calculate the new _amplitude based on _minAccY and _maxAccY.
                    this._amplitude = 1.0;

                    if (y > 0) {
                        this._accAmplitude = -this._minAccY;
                        this._maxAccY = y;
                        this._minAccY = 0;
                    } else {
                        this._accAmplitude = this._maxAccY;
                        this._minAccY = y;
                        this._maxAccY = 0;
                    }

                    this._debugAccY = this._accAmplitude;

                    if (this._accAmplitude > this._options.minAccAmplitude) {
                        this._period = (t0 - this._prevT0) * 2;
                        this._lastPeriodMeasuredTime = t;
                    } else {
                        //console.log(`++++++++++ 1 => _accAmplitude: ${this._accAmplitude}, minAccAmplitude: ${this._options.minAccAmplitude}`);
                        this._period = Oscillator.INFINITE_PERIOD;
                    }

                    this._oscillator.set({period: this._period, amplitude: this._amplitude});
                }

                this._prevT0 = t0;
            }

            if (y > 0 && y > this._maxAccY) {
                this._maxAccY = y;
            } else if (y < 0 && y < this._minAccY) {
                this._minAccY = y;
            }

            // The last period measurement was more than 1.5 periods ago:
            if (this._lastPeriodMeasuredTime && (t - this._lastPeriodMeasuredTime > this._period! * 1.5)) {
                // console.log("++++++++++ 2");
                this._period = Oscillator.INFINITE_PERIOD;
                this._oscillator.set({period: this._period, amplitude: this._amplitude});
            }
        }

        this._prevY = y;
        this._prevYt = t;
    }
}
