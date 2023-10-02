import { EventEmitter } from "../Visualizations/EventEmitter";

class DeviceManager extends EventEmitter<{
    "dppx-change" : (dpr: number) => void;
}> {

    /**
     * Creates a new {@link Device}.
     */
    constructor() {
        super();
        this.listenForPixelRatioChange();
    }


    /**
     * Listens for changes in the device's current pixel ratio.
     */
    private listenForPixelRatioChange() {
        window.matchMedia(`(resolution: ${ window.devicePixelRatio }dppx)`)
            .addEventListener("change", () => {
                this.emit("dppx-change", window.devicePixelRatio);
                this.listenForPixelRatioChange();
            }, { once: true });
    }

}

// Export Device
export const Device = new DeviceManager();
