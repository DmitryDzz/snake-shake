import 'regenerator-runtime/runtime';
import {Snake} from "./Snake";
import {ControlMode} from "./control-modes/ControlMode";
import {ManualControlMode} from "./control-modes/ManualControlMode";
import {JoystickControlMode} from "./control-modes/JoystickControlMode";
import {AutomaticControlMode} from "./control-modes/AutomaticControlMode";
import {ShakeControlMode} from "./control-modes/ShakeControlMode";

const manualControlMode: ControlMode = new ManualControlMode();
const joystickControlMode: ControlMode = new JoystickControlMode();
const automaticControlMode: ControlMode = new AutomaticControlMode();
const shakeControlMode: ControlMode = new ShakeControlMode();
let currentControlMode: ControlMode = manualControlMode;

let snake: Snake | undefined = undefined;

const onClickModeHandler = async (event: any) => {
    let newControlMode: ControlMode;
    switch (event.target.value) {
        case "joystick":
            newControlMode = joystickControlMode;
            break;
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
        await joystickControlMode.deactivate();
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

    snake = new Snake(
        // document.getElementById("animation_div")! as HTMLDivElement,
        document.getElementById("container_div")! as HTMLDivElement,
        document.getElementById("snake_div")! as HTMLDivElement,
        document.getElementById("snake_head_img")! as HTMLImageElement,
        document.getElementById("snake_body_img")! as HTMLImageElement,
        document.getElementById("snake_tongue_img")! as HTMLImageElement,
        256, 20);
};

const drawFrame = (time: DOMHighResTimeStamp): void => {
    const position11: number = currentControlMode.getPosition11(time);
    snake?.setPosition11(position11);
    snake?.update(time);
    requestAnimationFrame(drawFrame);
}

window.onload = () => {
    requestAnimationFrame(drawFrame);
};

const outputErrorHandler = (message: string) => {
    if (message !== "")
        console.error(message);
    const errorElement: HTMLDivElement = document.getElementById("error_message") as HTMLDivElement;
    if (message === "") {
        // errorElement.style.display = "none";
        errorElement.textContent = "";
    } else {
        // errorElement.style.display = "block";
        errorElement.textContent = `ERROR: ${message}`;
    }
};

(() => {
    console.log("Hello Snake!");

    const versionElement: HTMLDivElement = document.getElementById("version") as HTMLDivElement;
    versionElement.textContent = `v.${process.env.npm_package_version}`;

    initialize();
    (async () => {
        await manualControlMode.initialize(outputErrorHandler);
        await joystickControlMode.initialize(outputErrorHandler);
        await automaticControlMode.initialize(outputErrorHandler);
        await shakeControlMode.initialize(outputErrorHandler);

        currentControlMode = manualControlMode;
        await currentControlMode.activate();
    })();
})();