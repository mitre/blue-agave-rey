<template>
  <div class="search-field-control">
    <div class="search-field" @click="onClick">
      <div class="search-window" ref="searchElement" @keydown.stop="onKeyDown"></div>
      <slot></slot>
    </div>
    <div class="search-palette" v-show="showPalette">
      <div class="search-query" v-if="query.string !== ''">
        <span class="preface">Search for:</span>
        <span class="query-string">{{ query.string }}</span>
      </div>
      <div class="suggestions-selection" ref="scrollBoxElement">
        <div ref="scrollBoxContent">
          <div class="suggestions-section" v-for="[sect, vals] of insertSuggestions.options">
            <span class="suggestions-title">{{ sect }}</span>
            <ul class="suggestions-options">
              <li 
                v-for="[i, v] of vals" 
                :class="['suggestion', { active: isSuggestionActive(i) }]"
                :suggestion-id="i"
                @mousemove="suggestion.active = i"
                @click="insertValueAtCursor(v)"
                ref="suggestionElements"
              >
                <span :class="['value', v.classes]">
                  <span class="prefix" v-if="v.prefix">{{ v.prefix }}</span>
                  <span>{{ v.text }}</span>
                  <span class="suffix" v-if="v.suffix">{{ v.suffix }}</span>
                </span>
                <span class="description">{{ v.description }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Dependencies
import { unsignedMod } from '@/assets/scripts/Math';
import { RawScrollBox } from '@/assets/scripts/WebUtilities';
import { TokenTextField, type FieldState } from '@/assets/scripts/WebUtilities';
import { defineComponent, markRaw, ref, type PropType } from 'vue';
import { LunrQueryParser, TokenInfo, TypeMask, type Clause, type Token } from '@/assets/scripts/LunrQueryParser';

export default defineComponent({
  name: 'SearchField',
  setup() {
    return {
      searchElement: ref(null),
      scrollBoxElement: ref(null),
      scrollBoxContent: ref(null),
      suggestionElements: ref(null)
    }
  },
  props: {
    fields: {
      type: Set as PropType<Set<string>>,
      default: new Set([])
    },
    strict: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: "Search"
    }
  },
  data: () => ({
    TokenInfo,
    query: {
      string: "",
      clauses: [] as Clause[],
    },
    suggestion: {
      active: -1,
      token: null as Token | null,
      clause: null as Clause | null,
      filterKeyword: "",
    },
    scrollBox: markRaw(new RawScrollBox(false, false)),
    searchField: markRaw(new TokenTextField()),
    showPalette: false,
    showWarnings: false
  }),
  computed: {

    /**
     * Returns the filtered list of insert suggestions.
     * @returns
     *  The filtered list of insert suggestions.
     */
    insertSuggestions(): InsertSuggestions {
      let i = 0;
      const options = new Map();
      if (this.suggestFields) {
        const opt = this.suggestedFields;
        if (opt.length) {
          options.set("Event Fields", new Map(opt.map(o => [i++, o])));
        }
      }
      if (this.suggestPresenceModifiers) {
        const opt = this.suggestedPresenceModifiers;
        options.set("Presence", new Map(opt.map(o => [i++, o])));
      }
      if (this.suggestFuzzyModifier) {
        const opt = this.suggestedFuzzyModifiers;
        options.set("Fuzzy Term", new Map(opt.map(o => [i++, o])));
      }
      if (this.suggestBoostModifier) {
        const opt = this.suggestedBoostModifiers;
        options.set("Boost Term", new Map(opt.map(o => [i++, o])));
      }
      return { options, length: i };
    },

    /**
     * Test if fields should be suggested.
     * @returns
     *  True if fields should be suggested, false otherwise.
     */
    suggestFields(): boolean {
      const token = this.suggestion.token;
      const clause = this.suggestion.clause;
      if (!clause || !token) {
        return true;
      }
      const type = token.info & TypeMask;
      const tokens = clause.tokens;
      const onlyTerm = tokens.length === 1 && clause.hasTerm;
      const isFieldName = type === TokenInfo.FieldName;
      const canShow =
        isFieldName ||
        onlyTerm ||
        clause.onlyWhitespace;
      return canShow;
    },

    /**
     * Tests if presence modifiers should be suggested.
     * @returns
     *  True if event modifiers should be suggested, false otherwise.
     */
    suggestPresenceModifiers(): boolean {
      const clause = this.suggestion.clause;
      const canShow =
        clause !== null &&
        clause.hasTerm &&
        !clause.onlyWhitespace &&
        !clause.hasPresence;
      return canShow;
    },

    /**
     * Tests if the fuzzy modifier should be suggested.
     * @returns
     *  True if the fuzzy modifier should be suggested, false otherwise.
     */
    suggestFuzzyModifier(): boolean {
      const clause = this.suggestion.clause;
      const canShow =
        clause !== null &&
        clause.hasTerm &&
        !clause.onlyWhitespace &&
        !clause.hasEditDistance;
      return canShow;
    },

    /**
     * Tests if the boost modifier should be suggested.
     * @returns
     *  True if the boost modifier should be suggested, false otherwise.
     */
    suggestBoostModifier(): boolean {
      const clause = this.suggestion.clause;
      const canShow =
        clause !== null &&
        clause.hasTerm &&
        !clause.onlyWhitespace &&
        !clause.hasBoost;
      return canShow;
    },

    /**
     * Returns the suggested fields.
     * @returns
     *  The suggested fields.
     */
    suggestedFields(): Suggestion[] {
      const fields = [];
      const { clause, token } = this.suggestion;
      const classes = clause?.hasField ? "field" : "beg field";
      for (const field of this.fields) {
        const matchesFilter = field.includes(this.suggestion.filterKeyword);
        const matchesExactly = token?.text === `${field}:`;
        if (matchesFilter && !matchesExactly) {
          fields.push({
            classes,
            text: `${field}:`,
            description: `Search in '${field}' field.`,
            swap: `${field}:`
          });
        }
      }
      return fields
    },

    /**
     * Returns the suggested presence modifiers.
     * @returns
     *  The suggested presence modifiers.
     */
    suggestedPresenceModifiers(): Suggestion[] {
      const clause = this.suggestion.clause;
      const classes = clause?.hasField ? "field" : "generic";
      return [
        {
          classes,
          text: clause?.text ?? "",
          description: `Result must include term.`,
          prefix: "+"
        },
        {
          classes,
          text: clause?.text ?? "",
          description: `Result must not include term.`,
          prefix: "-"
        }
      ]
    },

    /**
     * Returns the suggested fuzzy modifiers.
     * @returns
     *  The suggested presence modifiers.
     */
    suggestedFuzzyModifiers(): Suggestion[] {
      const clause = this.suggestion.clause;
      const classes = clause?.hasField ? "field" : "generic";
      return [
        {
          classes,
          text: clause?.text ?? "",
          description: `Result can be within 1 edit distance of term.`,
          suffix: "~1"
        }
      ]
    },

    /**
     * Returns the suggested boost modifiers.
     * @returns
     *  The suggested presence modifiers.
     */
    suggestedBoostModifiers(): Suggestion[] {
      const clause = this.suggestion.clause;
      const classes = clause?.hasField ? "field" : "generic";
      return [
        {
          classes,
          text: clause?.text ?? "",
          description: `Increase term weight by 5.`,
          suffix: "^5"
        }
      ]
    },

    /**
     * Tests if the current query is valid.
     * @returns
     *  True if the current query is valid, false otherwise.
     */
    validQuery(): boolean {
      for (const clause of this.query.clauses) {
        for (const token of clause.tokens) {
          if (token.info & (TokenInfo.Error | TokenInfo.Warning)) {
            return false;
          }
        }
      }
      return true;
    },

    /**
     * Returns the wildcard search query.
     * @remarks
     *  This search query augments the original to behave more like a classic
     *  search function.
     * @returns
     *  The wildcard search query.
     */
    wildcardSearchQuery() {
      let query = "";
      for (const clause of this.query.clauses) {
        const beStrict =
          clause.hasPresence ||
          clause.hasEditDistance;
        if (beStrict) {
          query += clause.text;
        } else {
          // TODO: Need to replicate clause with original search and one with * around it
          for (const token of clause.tokens) {
            const type = token.info & TypeMask;
            const isTerm = type === TokenInfo.Term;
            const hasWildcards = token.text.match(/(?<!\\)\*/);
            if (isTerm && !hasWildcards) {
              query += `*${token.text}*`
            } else {
              query += token.text;
            }
          }
        }
      }
      return query;
    }

  },
  emits: ["search"],
  methods: {


    ///////////////////////////////////////////////////////////////////////////
    //  1. User Input  ////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Search click behavior.
     */
    onClick() {
      // Update suggestion mode
      const index = this.searchField.getCursorPosition();
      if (index) {
        this.updateSuggestionMode(this.query.clauses, index);
      }
      // Show palette
      this.showPalette = true;
    },

    /**
     * Search input behavior.
     * @param event
     *  The input event.
     * @param el
     *  The event source.
     */
    onInput(content: string, index: number | null): FieldState {
      // Update search query
      this.query.string = content;
      // Parse search query
      this.query.clauses = new LunrQueryParser()
        .parse(this.query.string, this.fields);
      // Construct formatting tokens
      const tokens = [];
      for (const clause of this.query.clauses) {
        for (let i = 0; i < clause.tokens.length; i++) {
          const token = clause.tokens[i];
          const content = token.text;
          const classes = new Set<string>();
          // Apply field classes
          if (clause.hasField) {
            // Don't allow single token to start and end field
            if (i === 0) {
              classes.add("beg-field");
            } else if (i === clause.tokens.length - 1) {
              classes.add("end-field");
            }
            classes.add("field");
          }
          // Apply error classes
          const displayError =
            (token.info & TokenInfo.Error) ||
            (token.info & TokenInfo.Warning && this.showWarnings)
          if (displayError) {
            const [prev, next] = [
              clause.tokens[i - 1],
              clause.tokens[i + 1]
            ];
            if (!prev || !(prev.info & TokenInfo.Error)) {
              classes.add("beg-error");
            }
            if (!next || !(next.info & TokenInfo.Error)) {
              classes.add("end-error");
            }
            classes.add("error");
          }
          // Apply type classes
          switch (token.info & TypeMask) {
            case TokenInfo.FieldName:
              classes.add("field-name");
              break;
            case TokenInfo.Presence:
              classes.add("presence");
              break;
            case TokenInfo.Term:
              classes.add("term");
              break;
            case TokenInfo.EditDistance:
              classes.add("edit-distance");
              break;
            case TokenInfo.Boost:
              classes.add("boost");
              break;
          }
          tokens.push({ content, classes });
        }
      }
      // Update suggestion mode
      if (index !== null) {
        this.updateSuggestionMode(this.query.clauses, index);
      }
      return { tokens }
    },

    /**
     * Search keydown behavior.
     * @param event
     *  The keydown event.
     */
    onKeyDown(event: KeyboardEvent) {
      let activeOption;
      // Show palette
      this.showPalette = true;
      // Respond to key
      let idx = this.suggestion.active ?? -1;
      const length = this.insertSuggestions.length;
      const suggestion = this.suggestion;
      switch (event.key) {
        case "ArrowUp":
          if (!length) {
            return;
          }
          event.preventDefault();
          // Resolve index
          idx = (idx === -1 ? 0 : idx) - 1;
          // Update selection
          suggestion.active = unsignedMod(idx, length);
          this.bringSuggestionIntoFocus(suggestion.active);
          break;
        case "ArrowDown":
          if (!length) {
            return;
          }
          event.preventDefault();
          // Resolve index
          idx = idx + 1;
          // Update selection
          suggestion.active = unsignedMod(idx, length);
          this.bringSuggestionIntoFocus(suggestion.active);
          break;
        case "ArrowLeft":
          const al = this.searchField.getCursorPosition();
          if (al) {
            this.updateSuggestionMode(this.query.clauses, al - 1);
          }
          break;
        case "ArrowRight":
          const ar = this.searchField.getCursorPosition();
          if (ar) {
            this.updateSuggestionMode(this.query.clauses, ar + 1);
          }
          break;
        case "Tab":
          event.preventDefault();
          activeOption = this.getSuggestion(idx);
          if (activeOption) {
            this.insertValueAtCursor(activeOption);
          }
          break;
        case "Enter":
          event.preventDefault();
          activeOption = this.getSuggestion(idx);
          if (activeOption) {
            this.insertValueAtCursor(activeOption);
          } else if (this.validQuery) {
            const query = this.strict ?
              this.query.string : this.wildcardSearchQuery;
            this.$emit("search", query);
            this.showPalette = false;
            this.showWarnings = false;
          } else {
            this.showWarnings = true;
            this.searchField.setValue(this.query.string);
          }
          break;
        case "Escape":
          this.onFocusOut();
          break;
      }
    },

    /**
     * Field focus behavior.
     */
    onFocusIn() {
      this.showPalette = true;
    },

    /**
     * Field blur behavior.
     * @param event
     *  The blur event.
     */
    onFocusOut() {
      // Blur search field
      this.searchField.blur();
      // Hide palette
      this.showPalette = false;
    },

    /**
     * Field click out behavior.
     * @param event
     *  The click event.
     */
    onClickOut(event: MouseEvent) {
      const target: any = event.target;
      const isElement = this.$el === target;
      const isChildOfElement = this.$el.contains(target);
      const shareProvenance = target?.hasAttribute(this.$options.__scopeId);
      if (!isElement && !isChildOfElement && !shareProvenance) {
        this.onFocusOut()
      }
    },


    ///////////////////////////////////////////////////////////////////////////
    //  2. Suggestion Functions  //////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Tests if a suggestion is active.
     * @param id
     *  The suggestion's identifier.
     * @returns
     *  True if the suggestion is active, false otherwise.
     */
    isSuggestionActive(id: number) {
      const active = this.suggestion.active;
      if (active === -1) {
        return false;
      } else {
        return active === id;
      }
    },

    /**
     * Returns an insert suggestion.
     * @param id
     *  The suggestion's identifier.
     * @returns
     *  The suggestion.
     */
    getSuggestion(id: number): Suggestion | undefined {
      // If no id, bail
      if (id === -1) {
        return;
      }
      // Select suggestion
      let suggestion;
      const suggestions = this.insertSuggestions;
      for (const section of suggestions.options.values()) {
        if (suggestion = section.get(id)) {
          return suggestion;
        }
      }
    },

    /**
     * Updates the field's suggestion mode.
     * @param query
     *  The query's clauses.
     * @param index
     *  The cursor's index.
     */
    updateSuggestionMode(query: Clause[], index: number) {
      // Clear active suggestion
      this.suggestion.active = -1;
      // Resolve suggestion clause and token
      let suggestionToken = null;
      let suggestionClause = null;
      if (query.length) {
        main:
        for (const clause of query) {
          suggestionClause = clause;
          for (const token of clause.tokens) {
            suggestionToken = token;
            if (token.text.length < index) {
              index -= token.text.length;
            } else {
              break main;
            }
          }
        }
      }
      // Resolve suggestion filter keyword
      let filterKeyword;
      const info = suggestionToken?.info ?? TokenInfo.None;
      const text = suggestionToken?.text ?? "";
      const type = info & TypeMask;
      switch (type) {
        case TokenInfo.FieldName:
          filterKeyword = text.substring(0, text.length - 1);
          break;
        case TokenInfo.Space:
          filterKeyword = "";
          break;
        default:
          filterKeyword = text;
          break;
      }
      // Update state
      this.suggestion.token = suggestionToken;
      this.suggestion.clause = suggestionClause;
      this.suggestion.filterKeyword = filterKeyword;
    },

    /**
     * Brings a suggestion into focus.
     * @param id
     *  The suggestion's identifier.
     */
    bringSuggestionIntoFocus(id: number) {
      // -8px for the <ul>'s padding
      const offset = 8;
      const item = this.getSuggestionElement(id);
      const scrollbox = this.scrollBoxElement! as HTMLElement;
      // Update scroll position
      if (item) {
        const { top: itTop, bottom: itBottom } = item.getBoundingClientRect();
        const { top: elTop, bottom: elBottom } = scrollbox.getBoundingClientRect();
        if ((itTop - offset) < elTop) {
          this.scrollBox.moveScrollPosition(item.offsetTop - offset)
        } else if (elBottom < (itBottom + offset)) {
          const offsetHeight = (elBottom - elTop) - (itBottom - itTop) - offset;
          this.scrollBox.moveScrollPosition(item.offsetTop - offsetHeight);
        }
      }
    },

    /**
     * Get a suggestion's {@link HTMLElement}.
     * @param id
     *  The suggestion's identifier.
     * @returns
     *  The {@link HTMLElement}. `undefined` if the item doesn't exist.
     */
    getSuggestionElement(id: number): HTMLElement | undefined {
      let item: HTMLElement | undefined = undefined;
      if (!this.suggestionElements) {
        return item;
      }
      for (let el of this.suggestionElements as HTMLElement[]) {
        if (`${id}` === el.getAttribute("suggestion-id")) {
          item = el as HTMLElement;
          break;
        }
      }
      return item;
    },


    ///////////////////////////////////////////////////////////////////////////
    //  3. Field Manipulation  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Inserts a value at the cursor's location.
     * @param value
     *  The value to insert. 
     */
    insertValueAtCursor(value: Suggestion) {
      const query = this.query;
      // Get the cursor's position
      let index = this.searchField.getCursorPosition() ?? 0;
      // Compute new string
      let i = 0, string = "", cursor = 0, clause;
      // Select clause
      while (i < query.clauses.length) {
        clause = query.clauses[i++];
        if (clause.text.length < index) {
          index -= clause.text.length;
          string += clause.text;
          cursor += clause.text.length;
        } else {
          break;
        }
      }
      // Alter clause
      if (clause && value.prefix) {
        const newValue = value.prefix + clause.text;
        string += newValue;
        cursor += newValue.length;
      } else if (clause && value.suffix) {
        const newValue = clause.text + value.suffix;;
        string += newValue
        cursor += newValue.length;
      } else if (clause && value.swap) {
        // Select token
        let j = 0;
        while (j < clause.tokens.length) {
          const token = clause.tokens[j++];
          if (token.text.length < index) {
            index -= token.text.length;
            string += token.text;
            cursor += token.text.length;
          } else {
            // Alter token
            const lastToken =
              i === query.clauses.length &&
              j === clause.tokens.length;
            if (token.info === TokenInfo.Space) {
              string += token.text;
              cursor += token.text.length;
            }
            string += value.swap;
            cursor += value.swap.length;
            if (token.info === TokenInfo.Space && !lastToken) {
              string += " ";
            }
            break;
          }
        }
        for (; j < clause.tokens.length; j++) {
          string += clause.tokens[j].text;
        }
      }
      for (; i < query.clauses.length; i++) {
        string += query.clauses[i].text;
      }
      // Handle empty case
      if (string === "") {
        string = value.swap ?? value.prefix ?? value.suffix ?? "";
        cursor = string.length;
      }
      // Set value and cursor
      this.searchField.setValue(string, cursor);
    }

  },
  watch: {
    // On placeholder change
    placeholder() {
      this.searchField.setPlaceholder(this.placeholder);
    }
  },
  mounted() {
    // Mount search field
    this.searchField.mount(
      this.searchElement! as HTMLElement,
      this.$options.__scopeId,
      this.onInput,
      this.onFocusIn
    );
    // Mount scroll box
    this.scrollBox.mount(
      this.scrollBoxElement! as HTMLElement,
      this.scrollBoxContent! as HTMLElement,
      this.$options.__scopeId
    )
    // Set placeholder
    this.searchField.setPlaceholder(this.placeholder);
    // Configure focus out behavior
    document.addEventListener("pointerdown", this.onClickOut);
  },
  beforeUnmount() {
    // Destroy search and scroll constructs
    this.searchField.destroy();
    this.scrollBox.destroy();
    // Clear event listeners
    document.removeEventListener("pointerdown", this.onClickOut);
  }
});

interface Suggestion {
  text: string;
  description: string;
  prefix?: string;
  suffix?: string;
  swap?: string;
  classes: string;
}

interface InsertSuggestions {
  options: Map<string, Map<number, Suggestion>>
  length: number
}
</script>

<style scoped>
/** === Main Control === */

.search-field-control {
  position: relative;
  display: flex;
  align-items: center;
}

/** === Search Field === */

.search-field {
  display: flex;
  align-items: center;
  width: 100%;
  color: #bfbfbf;
  font-size: 9.5pt;
  border: solid 1px #4d4d4d;
  border-radius: 3px;
  box-sizing: border-box;
  background: #303030;
}

.search-window {
  flex: 1;
  padding: 8px 10px;
}

.field {
  color: #eaeaea;
  padding: 2px 0px;
  background: #4d4d4d;
}

.error {
  color: #fff;
  padding: 2px 0px;
  background: #ff2929;
}

.field.beg-error {
  padding-left: 1px;
  border-radius: 0;
}

.field.end-error {
  padding-right: 1px;
  border-radius: 0;
}

.beg-field,
.beg-error,
.field.beg-field.beg-error {
  padding-left: 3px;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.end-field,
.end-error,
.field.end-field.end-error {
  padding-right: 3px;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}

.beg-field+.beg-error {
  padding-left: 1px;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
}

.field-name {
  font-weight: 700;
}

.boost,
.edit-distance {
  color: #fff;
  font-weight: 700;
}

.token-text-field_placeholder {
  color: #989898;
}

/** === Search Palette === */

.search-palette {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 100%;
  width: 100%;
  border: solid 1px #383838;
  border-radius: 3px;
  box-sizing: border-box;
  margin-top: 4px;
  background: #1f1f1f;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
  overflow: hidden;
}

.search-query {
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding: 10px 12px;
  background: #2b2b2b;
}

.search-query::after {
  content: "ENTER";
  color: #bfbfbf;
  font-size: 8.5pt;
  font-weight: 800;
  padding: 2px 8px;
  border: solid 1px #4d4d4d;
  border-bottom-width: 3px;
  border-radius: 3px;
  margin-left: 12px;
  background: #404040;
}

.search-query .preface {
  color: #b8b8b8;
  font-size: 10pt;
  margin-right: 5px;
}

.search-query .query-string {
  flex: 1;
  color: #d9d9d9;
  font-size: 10pt;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
}

.suggestions-selection {
  flex: 1;
  position: relative;
  max-height: 347px;
}

.suggestions-section {
  display: flex;
  flex-direction: column;
  padding: 8px 0px;
  border-bottom: solid 1px #383838;
  margin: 0px 8px;
}

.suggestions-section:last-child {
  border-bottom: none;
}

.suggestions-title {
  color: #a1a1a1;
  font-size: 9.5pt;
  font-weight: 600;
  padding: 5px 10px 5px;
}

.suggestion {
  display: flex;
  align-items: center;
  font-size: 10pt;
  white-space: nowrap;
  padding: 6px 10px;
  list-style: none;
  overflow: hidden;
}

.suggestion.active {
  color: #fff;
  background: #f95939;
}

.suggestion.active::after {
  content: url("@/assets/svgs/Plus.svg");
  display: block;
  padding-left: 8px;
}

.suggestion .value {
  font-weight: 500;
  margin-right: 10px;
}

.suggestion .value.generic {
  color: #cccccc;
}

.suggestion .value .prefix,
.suggestion .value .suffix {
  color: #fff;
  font-weight: 700;
}

.suggestion .value .prefix {
  padding-right: 1px;
}

.suggestion .value .suffix {
  padding-left: 1px;
}

.suggestion .value.field {
  color: #eaeaea;
  padding: 3px 5px;
  border-radius: 3px;
  background: #333333;
}

.suggestion .value.beg.field {
  padding-right: 4px;
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
}

.suggestion .description {
  flex: 1;
  color: #a1a1a1;
  text-overflow: ellipsis;
  overflow: hidden;
}

.suggestion.active .value,
.suggestion.active .description {
  color: #fff;
}

.suggestion.active .field {
  color: #f95939;
  background: #fdd6ce;
}

.suggestion.active .field .prefix,
.suggestion.active .field .suffix {
  color: #f95939;
}
</style>
