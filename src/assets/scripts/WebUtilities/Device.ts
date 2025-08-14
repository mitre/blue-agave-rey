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


    ///////////////////////////////////////////////////////////////////////////
    //  1. Screen Changes Detection  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


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


    ///////////////////////////////////////////////////////////////////////////
    //  2. Operating System Detection  ////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns the device's current operating system class.
     * @returns
     *  The device's current operating system class.
     */
    public getOperatingSystemClass(): OperatingSystem {
        if(navigator.userAgent.search("Win") !== -1) {
            return OperatingSystem.Windows
        } else if(navigator.userAgent.search("Mac") !== -1) {
            return OperatingSystem.MacOS;
        } else if(navigator.userAgent.search("X11") !== -1) {
            return OperatingSystem.UNIX;
        } else if(navigator.userAgent.search("Linux") !== -1) {
            return OperatingSystem.Linux;
        } else {
            return OperatingSystem.Other;
        }
    }

}

/**
 * Recognized operating systems.
 */
export enum OperatingSystem {
    Windows,
    MacOS,
    UNIX,
    Linux,
    Other
}

// Export Device
export const Device = new DeviceManager();
