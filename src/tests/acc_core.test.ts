import { AccCore, Options } from "../acc_core";

describe("Period measurement", () => {
    const options: Options = {
        minAccAmplitude: 0,
        maxPeriod: 3000,
        periodSpeed: 1000000,
    };

    it("Test 1", () => {
        const accCore = new AccCore(options);
        expect(accCore.getPeriod()).toBeCloseTo(0);
        accCore.update({ t: 0, y: 0 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        accCore.update({ t: 100, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        accCore.update({ t: 300, y: -1 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        accCore.update({ t: 500, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(400);

        accCore.update({ t: 600, y: -1 });
        expect(accCore.getPeriod()).toBeCloseTo(300);
        accCore.update({ t: 700, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(200);
    });

    it("Test 2", () => {
        const accCore = new AccCore(options);
        expect(accCore.getPeriod()).toBeCloseTo(0);
        expect(accCore.getPosition11(0)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 0, y: 0 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        expect(accCore.getPosition11(0)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 10, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        expect(accCore.getPosition11(10)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 30, y: -1 });
        expect(accCore.getPeriod()).toBeCloseTo(0);
        expect(accCore.getPosition11(30)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 50, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(40);
        expect(accCore.getPosition11(50)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 90, y: -1 });
        expect(accCore.getPeriod()).toBeCloseTo(60);
        expect(accCore.getPosition11(90)).toBeCloseTo(0);
        expect(accCore.getPhase()).toBeCloseTo(0);
        accCore.update({ t: 130, y: 1 });
        expect(accCore.getPeriod()).toBeCloseTo(80);
        expect(accCore.getPosition11(130)).toBeCloseTo(Math.sin(4.0 * Math.PI / 3.0));
        expect(accCore.getPhase()).toBeCloseTo(4.0 * Math.PI / 3.0);
    });
});
