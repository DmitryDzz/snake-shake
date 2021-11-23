import {SmoothieChart, TimeSeries} from "smoothie";
import {Box} from "./box";
import {AccCore} from "./acc_core";
import NoSleep from "nosleep.js";
import 'regenerator-runtime/runtime';

let chartLevel: number = 0;

let textPeriod: HTMLDivElement | undefined = undefined;
let accCore: AccCore | undefined = undefined;
let box: Box | undefined = undefined;

let accSensor: LinearAccelerationSensor | undefined = undefined;
let chart: SmoothieChart | undefined = undefined;

let chartCanvas: HTMLCanvasElement | undefined = undefined;
let startButton: HTMLButtonElement | undefined = undefined;
enum State { Stopped, Started}
let state: State = State.Stopped;

let noSleep = new NoSleep();

const onStartButtonClickHandler = async () => {
    if (state === State.Stopped) {
        state = State.Started;
        if (startButton)
            startButton.innerText = "Stop";
        accCore?.start();
        accSensor?.start();
        if (chartCanvas && chartLevel > 0)
            chartCanvas.style.visibility = "visible";
        if (chartLevel > 0)
            chart?.start();
        await noSleep.enable();
    } else if (state === State.Started) {
        state = State.Stopped;
        if (startButton)
            startButton.innerText = "Start";
        accCore?.stop();
        accSensor?.stop();
        if (chartCanvas)
            chartCanvas.style.visibility = "hidden";
        chart?.stop();
        await noSleep.disable();
    }
}

const onVisibilityChangeHandler = async () => {
    if (document.visibilityState === "visible") {
        if (state === State.Started)
            await noSleep.enable();
    } else if (document.visibilityState === "hidden") {
        if (state === State.Started)
            await noSleep.disable();
    }
};

const initialize = () => {
    const urlParams = new URLSearchParams(document.location.search);
    chartLevel = parseInt(urlParams.get("chart") ?? "0");

    chartCanvas = document.getElementById("chart_canvas") as HTMLCanvasElement;
    textPeriod = document.getElementById("periodLegend") as HTMLDivElement;

    startButton = document.getElementById("start_button") as HTMLButtonElement;
    startButton!.removeEventListener("click", onStartButtonClickHandler);
    startButton!.addEventListener("click", onStartButtonClickHandler);

    document.removeEventListener("visibilitychange", onVisibilityChangeHandler);
    document.addEventListener("visibilitychange", onVisibilityChangeHandler);
};

const startShaker = () => {
    const acc_sensor_frequency = 50;

    chart = new SmoothieChart({
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

    let accSeries: TimeSeries | undefined = undefined;
    let periodSeries: TimeSeries | undefined = undefined;
    let debugAccSeries: TimeSeries | undefined = undefined;
    let ticksSeries: TimeSeries | undefined = undefined;

    let currentChartLevel = 0;
    if (chartLevel > currentChartLevel++) {
        document.getElementById("accLegend")!.style.visibility = "visible";
        accSeries = new TimeSeries();
        chart.addTimeSeries(accSeries, {lineWidth: 2, strokeStyle: "#00ffff"});
    }
    if (chartLevel > currentChartLevel++) {
        document.getElementById("periodLegend")!.style.visibility = "visible";
        periodSeries = new TimeSeries();
        chart.addTimeSeries(periodSeries, {lineWidth: 2, strokeStyle: "#ffffff"});
    }
    if (chartLevel > currentChartLevel++) {
        document.getElementById("debugAccLegend")!.style.visibility = "visible";
        debugAccSeries = new TimeSeries();
        chart.addTimeSeries(debugAccSeries, {lineWidth: 2, strokeStyle: "#00dd00"});
    }
    // if (chartLevel > currentChartLevel++) {
    //     document.getElementById("ticksLegend")!.style.visibility = "visible";
    //     ticksSeries = new TimeSeries();
    //     chart.addTimeSeries(ticksSeries, {lineWidth: 2, strokeStyle: "#ffff0080"})
    // }
    if (chartLevel > 0) {
        chart.streamTo(chartCanvas!, 500);
    }

    accCore = new AccCore();
    box = new Box(
        document.getElementById("animation_div")! as HTMLDivElement,
        document.getElementById("snake_div")! as HTMLDivElement,
        document.getElementById("snake_head_img")! as HTMLImageElement,
        document.getElementById("snake_body_img")! as HTMLImageElement,
        document.getElementById("snake_tongue_img")! as HTMLImageElement,
        256, 20, accCore);

    let startTimestamp: number | undefined = undefined;

    try {
        accSensor = new LinearAccelerationSensor({frequency: acc_sensor_frequency});
        accSensor.addEventListener("reading", (ev: Event) => {
            if (accCore === undefined) return;

            const sensorData: LinearAccelerationSensor = (ev.target as any) as LinearAccelerationSensor;
            const ts = sensorData.timestamp as number;
            const y = sensorData.y as number;

            if (startTimestamp === undefined) {
                startTimestamp = new Date().getTime() - ts;
            }
            const t = startTimestamp + ts;
            //console.log("d:", new Date().getTime(), "ev:", ev.timeStamp, "s:", ts, "r:", startTimestamp + ts);
            accCore.update({t: ts, y: y});

            accSeries?.append(t, y);
            // ticksSeries?.append(t-1, 0);
            // ticksSeries?.append(t, 1);
            // ticksSeries?.append(t+1, 0);
            periodSeries?.append(t, accCore.getPeriod() / 100);
            debugAccSeries?.append(t, accCore.getDebugAccY());
        });

        // accSensor.start();
        accSensor.stop();
        chart.stop();

    } catch(e: any) {
        if (e.name === 'SecurityError') {
            throw new Error("LinearAccelerationSensor construction was blocked by a feature policy.");
        } else if (e.name === 'ReferenceError') {
            throw new Error("LinearAccelerationSensor is not supported by the User Agent.");
        } else {
            throw e;
        }
    }
};

const drawFrame = (): void => {
    if (accCore !== undefined && box !== undefined && accCore.started) {
        const t = new Date().getTime();

        if (textPeriod?.style.visibility === "visible") {
            const periodInSeconds = accCore.getPeriod() / 1000;
            const periodLabelValue = periodInSeconds > 999 ? "INF" : periodInSeconds.toFixed(3);
            const frequencyLabelValue = periodInSeconds <= 0 || periodInSeconds > 999 ? "0" : (1 / periodInSeconds).toFixed(3);
            textPeriod.innerText = `period: ${periodLabelValue} (s) ⇨ freq=${frequencyLabelValue} Hz`;
        }

        //console.log(t);
        box.setPosition11(accCore.getPosition11(t));
    }
    requestAnimationFrame(drawFrame);
}

window.onload = () => {
    requestAnimationFrame(drawFrame);
};

const outputError = (message: string) => {
    console.error(message);
    const errorElement: HTMLDivElement = document.getElementById("error_message") as HTMLDivElement;
    errorElement.textContent = `ERROR: ${message}`;
};

(() => {
    console.log("Hello world!");

    const versionElement: HTMLDivElement = document.getElementById("version") as HTMLDivElement;
    versionElement.textContent = `version: ${process.env.npm_package_version}`;

    (async () => {
        const accelerometerPermissionStatus = await navigator.permissions.query({
            name: "accelerometer" as PermissionName
        });
        const gyroscopePermissionStatus = await navigator.permissions.query({
            name: "gyroscope" as PermissionName
        });
        const hasPermissions: boolean = accelerometerPermissionStatus.state === "granted" &&
            gyroscopePermissionStatus.state === "granted";

        if (hasPermissions) {
            initialize();
            try {
                startShaker();
            } catch(e: any) {
                outputError(e);
            }
        } else {
            outputError("An accelerometer or gyroscope permission has not been granted");
        }
    })();
})();