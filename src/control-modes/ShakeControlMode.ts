import {ControlMode, ControlModeState} from "./ControlMode";
import NoSleep from "nosleep.js";
import {SmoothieChart, TimeSeries} from "smoothie";
import {AccCore} from "../acc_core";

export class ShakeControlMode extends ControlMode {
    private _noSleep: NoSleep | undefined = undefined;

    private _chartLevel: number = 0;
    private _chart: SmoothieChart | undefined = undefined;
    private _chartCanvasElement: HTMLCanvasElement | undefined = undefined;

    private _accSeries: TimeSeries | undefined = undefined;
    private _periodSeries: TimeSeries | undefined = undefined;
    private _debugAccSeries: TimeSeries | undefined = undefined;
    // private _ticksSeries: TimeSeries | undefined = undefined;

    private readonly _acc_sensor_frequency = 50;
    private _accCore: AccCore | undefined = undefined;
    private _accSensor: LinearAccelerationSensor | undefined = undefined;

    private _startButton: HTMLButtonElement | undefined = undefined;
    private _textPeriodElement: HTMLDivElement | undefined = undefined;

    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);

        const accelerometerPermissionStatus = await navigator.permissions.query({
            name: "accelerometer" as PermissionName
        });
        const gyroscopePermissionStatus = await navigator.permissions.query({
            name: "gyroscope" as PermissionName
        });
        const hasPermissions: boolean = accelerometerPermissionStatus.state === "granted" &&
            gyroscopePermissionStatus.state === "granted";

        if (hasPermissions) {
            try {
                this._initializeChart();
                this._initializeNoSleep();
                this._initializeAccSensor();
                this._initializeHtmlElements();

                this._state = ControlModeState.Stopped;
            } catch(e: any) {
                this._outputError(e);
            }
        } else {
            this._outputError("An accelerometer or gyroscope permission has not been granted");
        }
    }

    async activate() {
        if (this._startButton) {
            this._startButton.style.visibility = "visible";
        }
    }

    async deactivate() {
        if (this._startButton) {
            this._startButton.style.visibility = "hidden";
        }
        await this._stop();
    }

    private async _start() {
        this._state = ControlModeState.Started;
        if (this._startButton) {
            this._startButton.innerText = "Stop";
        }
        this._accCore?.start();
        this._accSensor?.start();
        if (this._chartCanvasElement && this._chartLevel > 0)
            this._chartCanvasElement.style.visibility = "visible";
        if (this._chartLevel > 0)
            this._chart?.start();
        await this._noSleep?.enable();
    }

    private async _stop() {
        this._state = ControlModeState.Stopped;
        if (this._startButton) {
            this._startButton.innerText = "Start";
        }
        this._accCore?.stop();
        this._accSensor?.stop();
        if (this._chartCanvasElement)
            this._chartCanvasElement.style.visibility = "hidden";
        this._chart?.stop();
        await this._noSleep?.disable();
    }

    getPosition11(): number {
        if (this._accCore !== undefined && this._accCore.started) {
            const t = new Date().getTime();
            if (this._textPeriodElement?.style.visibility === "visible") {
                const periodInSeconds = this._accCore.getPeriod() / 1000;
                const periodLabelValue = periodInSeconds > 999 ? "INF" : periodInSeconds.toFixed(3);
                const frequencyLabelValue = periodInSeconds <= 0 || periodInSeconds > 999 ? "0" : (1 / periodInSeconds).toFixed(3);
                this._textPeriodElement.innerText = `period: ${periodLabelValue} (s) ⇨ freq=${frequencyLabelValue} Hz`;
            }
            return this._accCore.getPosition11(t);
        }
        return 0;
    }

    private readonly _onPageVisibilityChangeHandler = async () => {
        if (document.visibilityState === "visible") {
            if (this._state === ControlModeState.Started)
                await this._noSleep?.enable();
        } else if (document.visibilityState === "hidden") {
            if (this._state === ControlModeState.Started)
                await this._noSleep?.disable();
        }
    };

    private _initializeNoSleep() {
        this._noSleep?.disable();
        this._noSleep = new NoSleep();
        document.removeEventListener("visibilitychange", this._onPageVisibilityChangeHandler);
        document.addEventListener("visibilitychange", this._onPageVisibilityChangeHandler);
    }

    private _initializeChart() {
        const urlParams = new URLSearchParams(document.location.search);
        this._chartLevel = parseInt(urlParams.get("chart") ?? "0");

        if (this._chartLevel > 0) {
            this._chart = new SmoothieChart({
                interpolation: "linear",
                millisPerPixel: 5,
                minValue: -20,
                maxValue: 20,
                minValueScale: 1.1,
                maxValueScale: 1.1,
                //limitFPS: 1,
                labels: {
                    fontSize: 32
                },
                grid: {
                    fillStyle: "#788ea1",
                    //millisPerLine: 100, <-- doesn't work
                    verticalSections: 40,
                    //lineWidth: 0.1,
                    sharpLines: true,
                    //strokeStyle: "black",
                }
            });
        }

        let currentChartLevel = 0;
        if (this._chartLevel > currentChartLevel++) {
            document.getElementById("accLegend")!.style.display = "block";
            this._accSeries = new TimeSeries();
            this._chart?.addTimeSeries(this._accSeries, {lineWidth: 2, strokeStyle: "#00ffff"});
        }
        if (this._chartLevel > currentChartLevel++) {
            document.getElementById("periodLegend")!.style.display = "block";
            this._periodSeries = new TimeSeries();
            this._chart?.addTimeSeries(this._periodSeries, {lineWidth: 2, strokeStyle: "#ffffff"});
        }
        if (this._chartLevel > currentChartLevel++) {
            document.getElementById("debugAccLegend")!.style.display = "block";
            this._debugAccSeries = new TimeSeries();
            this._chart?.addTimeSeries(this._debugAccSeries, {lineWidth: 2, strokeStyle: "#00dd00"});
        }
        // if (this._chartLevel > currentChartLevel++) {
        //     document.getElementById("ticksLegend")!.style.display = "block";
        //     ticksSeries = new TimeSeries();
        //     chart.addTimeSeries(ticksSeries, {lineWidth: 2, strokeStyle: "#ffff0080"})
        // }

        this._chartCanvasElement = document.getElementById("chart_canvas") as HTMLCanvasElement;
        if (this._chartLevel > 0 && this._chartCanvasElement) {
            this._chart?.streamTo(this._chartCanvasElement, 500);
        }
    }

    private _initializeAccSensor() {
        this._accCore = new AccCore();

        let startTimestamp: number | undefined = undefined;

        try {
            this._accSensor = new LinearAccelerationSensor({frequency: this._acc_sensor_frequency});
            this._accSensor.addEventListener("reading", (ev: Event) => {
                if (this._accCore === undefined) return;

                const sensorData: LinearAccelerationSensor = (ev.target as any) as LinearAccelerationSensor;
                const ts = sensorData.timestamp as number;
                const y = sensorData.y as number;

                if (startTimestamp === undefined) {
                    startTimestamp = new Date().getTime() - ts;
                }
                const t = startTimestamp + ts;
                //console.log("d:", new Date().getTime(), "ev:", ev.timeStamp, "s:", ts, "r:", startTimestamp + ts);
                this._accCore.update({t: ts, y: y});

                this._accSeries?.append(t, y);
                // this._ticksSeries?.append(t-1, 0);
                // this._ticksSeries?.append(t, 1);
                // this._ticksSeries?.append(t+1, 0);
                this._periodSeries?.append(t, this._accCore.getPeriod() / 100);
                this._debugAccSeries?.append(t, this._accCore.getDebugAccY());
            });

            // this._accSensor.start();
            this._accSensor.stop();
            this._chart?.stop();

        } catch(e: any) {
            if (e.name === 'SecurityError') {
                throw new Error("LinearAccelerationSensor construction was blocked by a feature policy.");
            } else if (e.name === 'ReferenceError') {
                throw new Error("LinearAccelerationSensor is not supported by the User Agent.");
            } else {
                throw e;
            }
        }
    }

    private _initializeHtmlElements() {
        this._startButton = document.getElementById("start_button") as HTMLButtonElement;
        this._startButton.removeEventListener("click", this._onStartButtonClickHandler);
        this._startButton.addEventListener("click", this._onStartButtonClickHandler);
        this._startButton.style.visibility = "hidden";

        this._textPeriodElement = document.getElementById("periodLegend") as HTMLDivElement;
    }

    private readonly _onStartButtonClickHandler = async () => {
        if (this._state === ControlModeState.Stopped) {
            await this._start();
        } else if (this._state === ControlModeState.Started) {
            await this._stop();
        }
    }
}