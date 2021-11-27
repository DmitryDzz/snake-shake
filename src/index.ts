import 'regenerator-runtime/runtime';
import {Box} from "./box";
import {ManualControlMode} from "./control-modes/ManualControlMode";
import {AutomaticControlMode} from "./control-modes/AutomaticControlMode";
import {ShakeControlMode} from "./control-modes/ShakeControlMode";
import {ControlMode, ControlModeType} from "./control-modes/ControlMode";

const manualControlMode: ControlMode = new ManualControlMode();
const automaticControlMode: ControlMode = new AutomaticControlMode();
const shakeControlMode: ControlMode = new ShakeControlMode();
let currentControlMode: ControlMode = manualControlMode;

let box: Box | undefined = undefined;

const onClickModeHandler = async (event: any) => {
    let newControlMode: ControlMode;
    switch (event.target.value) {
        case "automatic":
            newControlMode = automaticControlMode;
            break;
        case "shake":
            newControlMode = shakeControlMode;
            break;
        default:
            newControlMode = manualControlMode;
            break;
    }

    if (newControlMode.mode !== currentControlMode.mode) {
        currentControlMode = newControlMode;
        await manualControlMode.deactivate();
        await automaticControlMode.deactivate();
        await shakeControlMode.deactivate();
        await currentControlMode.activate();
    }
}

const initialize = () => {
    document.querySelectorAll("input[name='mode_switch']").forEach((input: Element) => {
        input.removeEventListener("click", onClickModeHandler);
        input.addEventListener("click", onClickModeHandler);
    });

    box = new Box(
        document.getElementById("animation_div")! as HTMLDivElement,
        document.getElementById("snake_div")! as HTMLDivElement,
        document.getElementById("snake_head_img")! as HTMLImageElement,
        document.getElementById("snake_body_img")! as HTMLImageElement,
        document.getElementById("snake_tongue_img")! as HTMLImageElement,
        256, 20);
};

const drawFrame = (): void => {
    const position11: number = currentControlMode.getPosition11();
    box?.setPosition11(position11);
    box?.update();
    requestAnimationFrame(drawFrame);
}

window.onload = () => {
    requestAnimationFrame(drawFrame);
};

const outputErrorHandler = (message: string) => {
    console.error(message);
    const errorElement: HTMLDivElement = document.getElementById("error_message") as HTMLDivElement;
    errorElement.textContent = `ERROR: ${message}`;
};

(() => {
    console.log("Hello Snake!");

    const versionElement: HTMLDivElement = document.getElementById("version") as HTMLDivElement;
    versionElement.textContent = `version: ${process.env.npm_package_version}`;

    initialize();
    (async () => {
        await manualControlMode.initialize(outputErrorHandler);
        await automaticControlMode.initialize(outputErrorHandler);
        await shakeControlMode.initialize(outputErrorHandler);

        currentControlMode = manualControlMode;
        await currentControlMode.activate();
    })();
})();