type numberable = number | undefined;

export interface Measurement {
    t: number;
    y: number;
}

export class Options {
    minAccAmplitude: number = 1.0; // Values less than this value are equal to zero.
    maxPeriod: number = 3000; // Values greater than this value are equal to INFINITE_PERIOD.
    periodSpeed: number = 1000; // Milliseconds per millisecond. The period cannot be changed faster.
}

export class AccCore {
    private static readonly TWO_PI = 2.0 * Math.PI;
    private static readonly INFINITE_PERIOD = 1000000;

    private readonly _options: Options;

    private _minAccY: number = 0;
    private _maxAccY: number = 0;
    private _accAmplitude: number = 0;

    private _debugAccY: numberable = undefined;

    private _amplitude: number = 0.0;
    private _period: numberable = undefined;
    private _phase: number = 0.0;
    private _periodStartTime: numberable = undefined;

    private _prevPeriod: numberable = undefined;
    private _lastPeriodMeasuredTime: numberable = undefined;

    private _prevY: numberable = undefined;
    private _prevYt: numberable = undefined;
    private _prevT0: numberable = undefined;

    private _paused: boolean = false;

    constructor(options?: Options) {
        this._options = options ?? new Options();
    }

    private _clear() {
        this._minAccY = 0;
        this._maxAccY = 0;
        this._debugAccY = undefined;
        this._amplitude = 0.0;
        this._period = undefined;
        this._phase = 0.0;
        this._periodStartTime = undefined;
        this._prevPeriod = undefined;
        this._prevY = undefined;
        this._prevYt = undefined;
        this._prevT0 = undefined;
        this._paused = false;
    }

    pause() {
        this._clear();
        this._paused = true;
    }

    resume() {
        if (this._paused) this._paused = false;
    }

    getDebugAccY(): number {
        return this._debugAccY ?? 0.0;
    }

    private _t0: number | undefined = undefined;

    private _getCurrentPeriod(t: number): number {
        if (this._period === undefined) return AccCore.INFINITE_PERIOD;
        if (this._prevPeriod === undefined) return this._period;
        const deltaT = t - (this._periodStartTime ?? 0);
        let result = this._prevPeriod;
        if (this._period > this._prevPeriod) {
            result += deltaT * this._options.periodSpeed;
            if (result > this._period)
                result = this._period;
        } else if (this._period < this._prevPeriod) {
            result -= deltaT * this._options.periodSpeed;
            if (result < this._period)
                result = this._period;
        }
        return result;
    }

    getPosition11(t: number): number {
        if (this._paused || this._period === undefined) return 0.0;
        if (this._t0 === undefined) this._t0 = new Date().getTime();

        if (this._prevPeriod === undefined) {
            this._phase = 0.0;
            this._prevPeriod = this._period;
            this._periodStartTime = t;
            //const result = 0.0;
            //console.log(`++++ START: ph=${this._phase.toFixed(2)}, P=${this._period.toFixed(2)}, PP=${this._prevPeriod.toFixed(2)}, PT=${this._periodStartTime.toFixed(2)}, t=${(t-this._t0)}, y=0.00`);
            return 0.0;
        }

        const period = this._getCurrentPeriod(t);
        if (period !== this._prevPeriod) {
            this._phase = Math.abs(this._prevPeriod) > 0.001
                ? (AccCore.TWO_PI * (t - this._periodStartTime!) / this._prevPeriod) % AccCore.TWO_PI
                : 0.0;
            //console.log(`==== ph=${this._phase.toFixed(2)}, P=${this._period.toFixed(2)}, PP=${this._prevPeriod.toFixed(2)}, PT=${(this._periodStartTime!-this._t0)}, t=${(t-this._t0)}`);
            this._prevPeriod = period;
            this._periodStartTime = t - this._phase * period / AccCore.TWO_PI;
        }
            
        const result = this._amplitude * Math.sin(AccCore.TWO_PI * (t - this._periodStartTime!) / period);
        //console.log(`t=${(t-this._t0)}, y=${result.toFixed(2)}`);
        return result;
    }

    getPeriod(): number {
        return this._period ?? 0;
    }

    getAmplitude(): number {
        return this._amplitude;
    }

    getPhase(): number {
        return this._phase;
    }

    update(acc: Measurement) {
        if (this._paused) return;
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
                        this._period = AccCore.INFINITE_PERIOD;
                    }
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
                this._period = AccCore.INFINITE_PERIOD;
            }
        }

        this._prevY = y;
        this._prevYt = t;
    }
}
