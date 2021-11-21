import {SmoothieChart, TimeSeries} from "smoothie";
import {Box} from "./box";
import {AccCore} from "./acc_core";
import 'regenerator-runtime/runtime';

const onVisibilityChangeHandler = () => {
    if (document.visibilityState === "visible") {
        console.log("++++++ visible");
    } else {
        console.log("++++++ invisible");
    }
};

const makeNoSleep = () => {
    document.removeEventListener("visibilitychange", onVisibilityChangeHandler);
    document.addEventListener("visibilitychange", onVisibilityChangeHandler);
};

const startShaker = () => {
    const acc_sensor_frequency = 50;

    const urlParams = new URLSearchParams(document.location.search);
    const showChart: boolean = urlParams.get("chart")?.toLowerCase() === "true" ?? false;

    const chartCanvas: HTMLCanvasElement = document.getElementById("chart_canvas") as HTMLCanvasElement;
    const chart = new SmoothieChart({
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
            verticalSections: 40
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

    const textPeriod: HTMLDivElement = document.getElementById("text_period") as HTMLDivElement;

    const accCore = new AccCore();
    const box = new Box(document.getElementById("animation_canvas")! as HTMLCanvasElement, 1400, 40, 20);

    let startTimestamp: number | undefined = undefined;

    try {
        const laSensor = new LinearAccelerationSensor({frequency: acc_sensor_frequency});
        laSensor.addEventListener("reading", (ev: Event) => {
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
        laSensor.start();
    } catch(e: any) {
        if (e.name === 'SecurityError') {
            throw new Error("LinearAccelerationSensor construction was blocked by a feature policy.");
        } else if (e.name === 'ReferenceError') {
            throw new Error("LinearAccelerationSensor is not supported by the User Agent.");
        } else {
            throw e;
        }
    }

    const drawFrame = (): void => {
        const t = new Date().getTime();
        const periodInSeconds = accCore.getPeriod() / 1000;
        const periodLabelValue = periodInSeconds > 999 ? "INF" : periodInSeconds.toFixed(3);
        textPeriod.innerText = `period: ${periodLabelValue} (s)`;
        //console.log(t);
        box.setPosition11(accCore.getPosition11(t));
        requestAnimationFrame(drawFrame);
    }

    window.onload = () => {
        requestAnimationFrame(drawFrame);
    };
};

const outputError = (message: string) => {
    console.error(message);
    const errorElement: HTMLDivElement = document.getElementById("error_message") as HTMLDivElement;
    errorElement.textContent = `ERROR: ${message}`;
};

(() => {
    console.log("Hello world!");
    console.log(navigator.userAgent);

    const versionElement: HTMLDivElement = document.getElementById("version") as HTMLDivElement;
    versionElement.textContent = `version: ${process.env.npm_package_version}`;

    const permissionsObj = navigator.permissions;
    console.log("permissionsObj:", permissionsObj);

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
            makeNoSleep();
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