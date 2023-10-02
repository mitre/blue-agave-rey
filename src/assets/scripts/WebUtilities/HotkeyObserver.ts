import { HotkeyAction, HotkeyItem } from "@/store/StoreTypes";

export class HotkeyObserver {

    private _keyState: string;
    private _callback: (id: string, data?: any) => void;
    private _callLoop: number | undefined;
    private _container: HTMLElement | null;
    private _fileInput: HTMLInputElement;
    private _hotkeyIdMap: Map<string, HotkeyItem>;
    private _selectedFileId: string | null;
    private _recognitionDelay: number;
    private _boundAdvanceKeyState: (e: KeyboardEvent) => void;
    private _boundReverseKeyState: (e: KeyboardEvent) => void;

    /**
     * Creates a new HotkeyObserver.
     * @param callback
     *  The function to call once a hotkey sequence is triggered.
     * @param recognitionDelay
     *  The time to wait (in milliseconds) before firing the hotkey callback.
     */
    constructor(callback: (id: string) => void, recognitionDelay: number) {
        
        // Configure state
        this._keyState = ".";
        this._callback = callback;
        this._callLoop = undefined;
        this._container = null;
        this._hotkeyIdMap = new Map();
        this._selectedFileId = null;
        this._recognitionDelay = recognitionDelay;
        this._boundAdvanceKeyState = this.advanceKeyState.bind(this);
        this._boundReverseKeyState = this.reverseKeyState.bind(this);

        // Configure file input element
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.addEventListener("change", this.readFile.bind(this));
        
    }

    /**
     * Binds the HotkeyObserver to an HTML element.
     * @param container
     *  The HTML element to bind to.
     */
    public observe(container: HTMLElement) {
        this._container = container;
        this._container.addEventListener("keydown", this._boundAdvanceKeyState);
        this._container.addEventListener("keyup", this._boundReverseKeyState);
    }

    /**
     * Unbinds the HotkeyObserver from the HTML element.
     */
    public disconnect() {
        this._container?.removeEventListener("keydown", this._boundAdvanceKeyState);
        this._container?.removeEventListener("keyup", this._boundReverseKeyState);
    }

    /**
     * Configures the hotkeys to listen for.
     * @param keymap
     *  An array of hotkeys.
     * @throws { OverlappingHotkeysError }
     *  If any hotkey sequences overlap with each other.
     */
    public setHotkeys(keymap: HotkeyItem[]) {
        this._hotkeyIdMap = new Map<string, HotkeyItem>();
        for (let item of keymap) {
            if (item.shortcut === "") continue;
            // Derive hotkey id
            let hotkeyId = this.keySequenceToHotKeyId(item.shortcut);
            // Ensure hotkey id doesn't overlap with others 
            for (let id of this._hotkeyIdMap.keys()) {
                if (id.startsWith(hotkeyId) || hotkeyId.startsWith(id)) {
                    throw new OverlappingHotkeysError(
                        `Overlapping key sequences ('${
                            id
                        }' and '${
                            hotkeyId
                        }') are not allowed.`
                    );
                }
            }
            // Add hotkey
            this._hotkeyIdMap.set(hotkeyId, item);
        }
    }

    /**
     * Sets the recognition delay for triggered hotkeys.
     * @param recognitionDelay
     *  The delay in milliseconds.
     */
    public setRecognitionDelay(recognitionDelay: number) {
        this._recognitionDelay = recognitionDelay;
    }

    /**
     * Returns true if the provided hotkey sequence is active, false otherwise.
     * @param sequence
     *  The hotkey sequence to check.
     * @param strict
     *  [true]
     *   The active keys must match the provided hotkey sequence exactly.
     *  [false]
     *   The active keys only need to contain the provided hotkey sequence.
     *  (Default: true)
     * @returns
     *  True if the provided hotkey sequence is active, false otherwise.
     */
    public isHotkeyActive(sequence: string, strict: boolean = true): boolean {
        let id = this.keySequenceToHotKeyId(sequence);
        return strict ? this._keyState === id : this._keyState.includes(id);
    }

    /**
     * Adds a key event to the current key state.
     * @param e
     *  The keydown event.
     */
    private advanceKeyState(e: KeyboardEvent) {
        let key = e.key.toLocaleLowerCase();
        // Only acknowledge a key once
        if (this._keyState.endsWith(`.${ key }.`))
            return;
        // Advanced current key state
        clearTimeout(this._callLoop);
        this._keyState += `${ key }.`
        // If inside input field, ignore hotkeys
        if((e.target as any).tagName === "INPUT")
            return;
        // Check key state
        if (this._hotkeyIdMap.has(this._keyState)) {
            let hotkey = this._hotkeyIdMap.get(this._keyState)!;
            // Disable browser default behavior if not requested
            if (!hotkey.allowBrowserBehavior)
                e.preventDefault();
            // Execute shortcut
            this.triggerHotkey(hotkey);
        } else {
            // If no key matched, block browser behavior by default
            e.preventDefault();
        }
    }

    /**
     * Removes a key event from the current key state. 
     * @param e
     *  The keyup event.
     */
    private reverseKeyState(e: KeyboardEvent) {
        clearTimeout(this._callLoop);
        let key = e.key.toLocaleLowerCase();
        this._keyState = this._keyState.replace(`.${ key }.`, ".");
    }

    /**
     * Triggers the provided hotkey.
     * @param hotkey
     *  The hotkey item to trigger.
     */
    private triggerHotkey(hotkey: HotkeyItem) {
        if (hotkey.disabled)
            return;
        this._callLoop = setTimeout(() => {
            switch (hotkey.type) {
                case "action":
                    this._callback(hotkey.id);
                    if (hotkey.repeat)
                        this.runRepeat(hotkey);
                    break;
                case "toggle":
                    this._callback(hotkey.id, { value: hotkey.value });
                    break;
                case "link":
                    window.open(hotkey.link, "_blank");
                    this._keyState = ".";
                    this._callback(hotkey.id);
                    break;
                case "file":
                    this._fileInput.click();
                    this._selectedFileId = hotkey.id;
                    this._callback(`__preload_${hotkey.id}`);
                    break;
            }
        }, this._recognitionDelay);
    }

    /**
     * Fires the provided hotkey at its configured interval.
     * @param info
     *  The hotkey item.
     */
    private runRepeat(info: HotkeyAction) {
        let repeat = function (this: any) {
            // Call hotkey callback
            this._callback(info.id);
            // Schedule next call
            this._callLoop = setTimeout(repeat, info.repeat!.interval);
        }.bind(this);
        // Kick off call loop
        this._callLoop = setTimeout(repeat, info.repeat!.delay);
    }

    /**
     * Completes a file hotkey trigger. 
     * @param event
     *  The file read event.
     */
    private readFile(event: Event) {
        let file = (event.target as any).files[0];
        let reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            this._callback(this._selectedFileId!, {
                filename: file.name,
                file: e.target?.result
            })
            this._selectedFileId = null;
        }
        reader.readAsText(file);
    }

    /**
     * Converts a key sequence to its hotkey id.
     * @param sequence
     *  The sequence to evaluate.
     * @returns
     *  The sequence's hotkey id.
     */
    private keySequenceToHotKeyId(sequence: string): string {
        let hotkeyId = sequence
            .toLocaleLowerCase()
            .replace(/\s+/g, '')
            .split("+")
            .join(".");
        return `.${hotkeyId}.`
    }

}

export class OverlappingHotkeysError extends Error {

    /**
     * Creates a new OverlappingHotkeysError.
     * @param message
     *  The error message.
     */
    constructor(message: string) {
        super(message);
    }

}
