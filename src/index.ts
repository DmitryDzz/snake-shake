import {SmoothieChart, TimeSeries} from "smoothie";
import {Box} from "./box";
import {AccCore} from "./acc_core";

console.log("Hello world!");

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
//const ticksSeries = new TimeSeries();
const periodSeries = new TimeSeries();
if (showChart) {
    chart.addTimeSeries(accSeries, {lineWidth: 2, strokeStyle: "#00ffff"});
    chart.addTimeSeries(debugAccSeries, {lineWidth: 2, strokeStyle: "#00dd00"});
//    chart.addTimeSeries(ticksSeries, {lineWidth: 2, strokeStyle: "#ffff0080"})
//    chart.addTimeSeries(periodSeries, {lineWidth: 2, strokeStyle: "#ffffff"});
    chart.streamTo(chartCanvas!, 500);
}

const textPeriod: HTMLDivElement = document.getElementById("text_period") as HTMLDivElement;

const accCore = new AccCore();
const box = new Box(document.getElementById("animation_canvas")! as HTMLCanvasElement, 1400, 40, 20);

let startTimestamp: number | undefined = undefined;
//let prevT = 0.0;

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
        //periodSeries.append(t, accCore.getPeriod() / 100);
    }
});
laSensor.start();

//setInterval(() => {
//    textPeriod.innerText = `period: ${(accCore.getPeriod() / 1000).toFixed(3)} (s)`;
//    box.setPosition11(accCore.getPosition11());
//}, 1000 / 30);

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
