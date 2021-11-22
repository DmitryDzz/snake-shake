import {SmoothieChart, TimeSeries} from "smoothie";
import {Box} from "./box";
import {AccCore} from "./acc_core";
import NoSleep from "nosleep.js";
import 'regenerator-runtime/runtime';

let showChart: boolean = false;

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
        if (chartCanvas && showChart)
            chartCanvas.hidden = false;
        if (showChart)
            chart?.start();
        await noSleep.enable();
    } else if (state === State.Started) {
        state = State.Stopped;
        if (startButton)
            startButton.innerText = "Start";
        accCore?.stop();
        accSensor?.stop();
        if (chartCanvas)
            chartCanvas.hidden = true;
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
    showChart = urlParams.get("chart")?.toLowerCase() === "true" ?? false;

    chartCanvas = document.getElementById("chart_canvas") as HTMLCanvasElement;
    textPeriod = document.getElementById("text_period") as HTMLDivElement;

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
    const accSeries = new TimeSeries();
    const debugAccSeries = new TimeSeries();
// const ticksSeries = new TimeSeries();
    const periodSeries = new TimeSeries();
    if (showChart) {
        chart.addTimeSeries(accSeries, {lineWidth: 2, strokeStyle: "#00ffff"});
        chart.addTimeSeries(debugAccSeries, {lineWidth: 2, strokeStyle: "#00dd00"});
//    chart.addTimeSeries(ticksSeries, {lineWidth: 2, strokeStyle: "#ffff0080"})
        chart.addTimeSeries(periodSeries, {lineWidth: 2, strokeStyle: "#ffffff"});
        chart.streamTo(chartCanvas!, 500);
    }

    accCore = new AccCore();
    box = new Box(
        document.getElementById("animation_div")! as HTMLDivElement,
        document.getElementById("snake_div")! as HTMLDivElement,
        document.getElementById("snake_img")! as HTMLImageElement,
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

            if (showChart) {
                accSeries.append(t, y);
                debugAccSeries.append(t, accCore.getDebugAccY());
                //ticksSeries.append(t-1, 0);
                //ticksSeries.append(t, 1);
                //ticksSeries.append(t+1, 0);
                periodSeries.append(t, accCore.getPeriod() / 100);
            }
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

        if (textPeriod !== undefined) {
            const periodInSeconds = accCore.getPeriod() / 1000;
            const periodLabelValue = periodInSeconds > 999 ? "INF" : periodInSeconds.toFixed(3);
            textPeriod.innerText = `period: ${periodLabelValue} (s)`;
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