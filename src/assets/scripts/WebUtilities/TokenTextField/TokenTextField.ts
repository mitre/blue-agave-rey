import "./TokenTextField.css"

export class TokenTextField {

    /**
     * The total space between the scrollbar and the text (in px).
     */
    private static SCROLL_PADDING = 20;


    /**
     * The {@link HTMLElement} the field is mounted to.
     */
    private _el: HTMLElement | null;

    /**
     * The field's contents.
     */
    private _field: HTMLElement;

    /**
     * The field's inner scrolling window.
     */
    private _inner: HTMLElement;

    /**
     * The field's window.
     */
    private _window: HTMLElement;

    /**
     * The field's placeholder element.
     */
    private _placeholder: HTMLElement;

    /**
     * The scope id to apply to generated {@link HTMLElement}s. 
     */
    private _scopeId: string | null;

    /**
     * The internal click behavior.
     */
    private _onClick: () => void;

    /**
     * The internal input behavior.
     */
    private _onInput: (event: Event) => void;

    /**
     * The user-specified input behavior.
     */
    private _extOnInput: OnFieldInput;

    /**
     * The user-specified focus behavior.
     */
    private _extOnFocus: OnFieldFocus | null;

    /**
     * The user-specified blur behavior.
     */
    private _extOnBlur: OnFieldBlur | null;


    /**
     * Creates a new {@link TokenTextField}.
     * @param placeholder
     *  The field's placeholder.
     * @param height
     *  The field's height.
     */
    constructor(placeholder: string = "Search", height: number = 20) {
        const pad = TokenTextField.SCROLL_PADDING;
        this._el = null;
        this._scopeId = null;
        this._onClick = this.__onClick.bind(this);
        this._onInput = this.__onInput.bind(this);
        this._extOnInput = (content) => ({ tokens: [{ content }]});
        this._extOnFocus = null;
        this._extOnBlur = null;
        // Configure field
        this._field = document.createElement("div");
        this._field.classList.add("token-text-field_field")
        this._field.style.height = `${ height }px`;
        this._field.contentEditable = "true";
        // Configure scrolling window
        this._inner = document.createElement("div");
        this._inner.classList.add("token-text-field_inner");
        this._inner.style.paddingBottom = `${ pad }px`;
        this._inner.append(this._field);
        // Configure window
        this._window = document.createElement("div");
        this._window.classList.add("token-text-field_window");
        this._window.append(this._inner);
        // Configure placeholder
        this._placeholder = document.createElement("div");
        this._placeholder.classList.add("token-text-field_placeholder");
        this.setPlaceholder(placeholder);
        // Set initial value
        this.setValue("");
    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Mount / Unmount  ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Mounts the field to an {@link HTMLElement}.
     * @param el
     *  The element to mount the field to.
     * @param scopeId
     *  The scope id to apply to generated {@link HTMLElement}s.
     * @param onInput
     *  The field's input behavior. This function will be provided the field's
     *  plaintext `content` and the cursor's current `index`. This function
     *  must return a {@link FieldState}.
     * @param onFocus
     *  The field's focus behavior.
     * @param onBlur
     *  The field's blur behavior.
     */
    public mount(
        el: HTMLElement,
        scopeId?: string,
        onInput?: OnFieldInput,
        onFocus?: OnFieldFocus,
        onBlur?: OnFieldBlur
    ) {
        const pad = TokenTextField.SCROLL_PADDING;
        
        // Ensure ready to mount
        this.destroy();
        
        // Configure element
        this._el = el;
        this._el.classList.add("token-text-field_container");
        this._el.append(this._placeholder);
        this._el.append(this._window);
        
        // Configure state
        this._scopeId = scopeId ?? this._scopeId;
        this._extOnInput = onInput ?? this._extOnInput;
        this._extOnFocus = onFocus ?? null;
        this._extOnBlur = onBlur ?? null;
        
        // Configure placeholder
        if(this._scopeId) {
            this._placeholder.setAttribute(this._scopeId, "");
        }
        
        // Configure window
        this._window.style.height = `${this._inner.clientHeight - pad}px`;
        
        // Configure event listeners
        this._el.addEventListener("click", this._onClick);
        this._field.addEventListener("input", this._onInput);
        if(this._extOnFocus) {
            this._field.addEventListener("focus", this._extOnFocus);
        }
        if(this._extOnBlur) {
            this._field.addEventListener("blur", this._extOnBlur);
        }
    }

    /**
     * Unmounts the field from its {@link HTMLElement}.
     */
    public destroy() {
        
        // Configure element
        this._el?.classList.remove("token-text-field_container");
        
        // Configure placeholder
        if(this._scopeId) {
            this._placeholder.removeAttribute(this._scopeId);
        }
        
        // Remove event listeners
        this._field.removeEventListener("click", this._onClick);
        this._field.removeEventListener("input", this._onInput);
        if(this._extOnFocus) {
            this._field.removeEventListener("focus", this._extOnFocus);
        }
        if(this._extOnBlur) {
            this._field.removeEventListener("blur", this._extOnBlur);
        }

        // Remove window
        this._placeholder.remove();
        this._window.remove();

    }

    /**
     * Sets the placeholder's text.
     * @param placeholder
     *  The placeholder's text.
     */
    public setPlaceholder(placeholder: string) {
        this._placeholder.innerText = placeholder;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Field Controls  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Sets the field's value.
     * @param value
     *  The field's new value.
     */
    public setValue(value: string): void;

    /**
     * Sets the field's value.
     * @param value
     *  The field's new value.
     * @param index
     *  The cursor's new position.
     *  (Default: The cursor's current position.)
     */
    public setValue(value: string, index?: number | null): void;
    public setValue(value: string, index: number | null = this.getCursorPosition()) {
        const el = this._field;
        // Get state
        const text = value.replace(/(?:\r\n|\r|\n|\u200B)/g, "");
        const state = this._extOnInput(text, index);
        // Filter empty tokens
        state.tokens = state.tokens.filter(o => o.content !== "");
        // Update contents
        el.innerHTML = "";
        // Wrapper is required to prevent innerHTML from generating newlines
        const wrapper = document.createElement("div");
        for(const token of state.tokens) {
            const t = document.createElement("span");
            // Assign content
            t.innerText = token.content;
            // Assign classes
            if(token.classes) {
                t.classList.add(...token.classes);
            }
            // Assign scope id
            if(this._scopeId !== null) {
                t.setAttribute(this._scopeId, "");
            }
            // Add token
            wrapper.appendChild(t);
        }
        el.appendChild(wrapper);
        // If field is empty, fill with zero-width space
        if(el.innerText === "") {
            const emptyClass = "token-text-field_empty";
            el.innerHTML = `<span class='${emptyClass}'>\u200B</span>`;
        }
        // Display placeholder
        if(el.innerText.startsWith("\u200B")) {
            this._placeholder.style.display = ""
        } else {
            this._placeholder.style.display = "none";
        }
        // Update cursor position
        if(index !== null) {
            this.setCursorPosition(state.index ?? index);
        }
    }

    /**
     * Focuses the field.
     */
    public focus() {
        this._field.focus();
    }

    /**
     * Blurs the field.
     */
    public blur() {
        this._field.blur();
    }


    ///////////////////////////////////////////////////////////////////////////
    //  3. Event Handlers  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    

    /**
     * Internal click behavior.
     */
    private __onClick() {
        this._field.focus()
    }

    /**
     * Internal input behavior.
     * @param event
     *  The input event. 
     */
    private __onInput(event: Event) {
        event.stopPropagation();
        this.setValue(this._field.innerText)
    }
    

    ///////////////////////////////////////////////////////////////////////////
    //  4. Cursor Functions  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Gets the cursor's position.
     * @returns
     *  The cursor's index if the cursor is positioned, `null` otherwise.
     */
    public getCursorPosition(): number | null {
        const el = this._field;
        // Get current selection
        const selection = window.getSelection();
        // If section doesn't belong to field, bail
        let parent = selection?.anchorNode ?? null;
        while(true) {
            if(parent === null) {
                return null;
            }
            if(parent === el) {
                break;
            }
            parent = parent.parentElement;
        }
        // Measure range
        if(selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const clone = range.cloneRange();
            clone.selectNodeContents(el);
            clone.setEnd(range.endContainer, range.endOffset);
            return clone.toString().length;
        }
        return null;
    }

    /**
     * Sets the cursor's position.
     * @param index
     *  The cursor's new index in the text.
     */
    private setCursorPosition(index: number) {
        // Get relative cursor position
        const n = this.getIndexRelativeToNode(index);
        // Set position
        if(n) {
            const range = new Range();
            range.setStart(n.node, n.index);
            // Get selection
            const selection = window.getSelection();
            if(selection) {
                // Clear ranges
                selection.removeAllRanges();
                // Add new range
                selection.addRange(range);
            }
        }
    }


    /**
     * Given an `index`, this function returns the {@link Node} at that
     * position along with the index relative to that node.
     * @param index
     *  The index.
     * @returns
     *  The node and index if the cursor is positioned, `null` otherwise.
     */
    private getIndexRelativeToNode(index: number): { node: Node, index: number } | null {
        const el = this._field;
        if(!el) {
            return null;
        }
        const type = NodeFilter.SHOW_TEXT;
        const walker = document.createTreeWalker(el, type, (el) => {
            const content = el.textContent ?? "";
            if(content.length < index) {
                index -= content.length;
                return NodeFilter.FILTER_REJECT;
            } else {
                return NodeFilter.FILTER_ACCEPT
            }
        });
        return { node: walker.nextNode() ?? el, index };
    }

}

/**
 * {@link TokenTextField} field state.
 */
export interface FieldState { 
    
    /**
     * The parsed tokens.
     */
    tokens: { 
        
        /**
         * The token's content
         */
        content: string
        
        /**
         * The token's class(es).
         */
        classes?: Set<string>,
    
    }[],
    
    /**
     * The cursor's new position.
     * (If unspecified, the original position is retained.)
     */
    index?: number

}

/**
 * {@link TokenTextField} input event handler.
 */
export type OnFieldInput = (content: string, index: number | null) => FieldState;

/**
 * {@link TokenTextField} focus event handler.
 */
export type OnFieldFocus = (event: FocusEvent) => void;

/**
 * {@link TokenTextField} blur event handler.
 */
export type OnFieldBlur = (event: FocusEvent) => void;
