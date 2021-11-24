import {ControlMode} from "./ControlMode";

export class ManualControlMode extends ControlMode {
    async initialize(onErrorCallback: (message: string) => void) {
        await super.initialize(onErrorCallback);
    }

    async start() {
    }

    async stop() {
    }

    getPosition11(): number {
        return 0;
    }
}