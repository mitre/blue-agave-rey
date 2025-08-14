import { LexemeType } from "./LexemeType";
import type { Lexeme } from "./Lexeme";
import type { LexerStateFunction } from "./LexerStateFunction";
import lunr from "lunr";

export class LunrQueryLexer {

    /**
     * The query string.
     */
    public readonly query: string;

    /**
     * The parsed lexemes.
     */
    public readonly lexemes: Lexeme[];

    /**
     * The lexer's start position.
     */
    private start: number;

    /**
     * The lexer's current position.
     */
    private index: number;


    /**
     * Creates a new {@link LunrQueryLexer}.
     * @param query
     *  The query string.
     */
    constructor(query: string) {
        this.query = query;
        this.lexemes = [];
        this.start = 0;
        this.index = 0;
    }


    /**
     * Runs the lexer.
     * @returns
     *  The parsed lexemes.
     */
    public run(): Lexeme[] {
        let state: LexerStateFunction = this.readText;
        while(state) {
            state = state(this);
        }
        return this.lexemes;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Lexer State Functions  /////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Reads text from the query string.
     * @param lexer
     *  The current {@link LunrQueryLexer}.
     * @returns
     *  The next lexer state.
     */
    private readText(lexer: LunrQueryLexer): LexerStateFunction {
        while(true) {
            const char = lexer.nextChar();

            // If end of query
            if(char === null) {
                if(lexer.width() > 0) {
                    lexer.tag(LexemeType.Term);
                }
                return;
            }

            // If space character
            if(char.match(lunr.tokenizer.separator)) {
                lexer.prevChar();
                if(lexer.width() > 0) {
                    lexer.tag(LexemeType.Term);
                }
                return lexer.readSpace;
            }
            
            // If escape character
            if(char === "\\") {
                lexer.nextChar();
                continue;
            }

            // If field
            if(char === ":") {
                lexer.tag(LexemeType.Field);
                return lexer.readText;
            }

            // If edit distance
            if(char === "~") {
                lexer.prevChar();
                if(0 < lexer.width()) {
                    lexer.tag(LexemeType.Term);
                }
                lexer.nextChar();
                lexer.nextInteger();
                lexer.tag(LexemeType.EditDistance);
                return lexer.readText;
            }
            
            // If boost
            if(char === "^") {
                lexer.prevChar();
                if(0 < lexer.width()) {
                    lexer.tag(LexemeType.Term);
                }
                lexer.nextChar();
                lexer.nextInteger();
                lexer.tag(LexemeType.Boost);
                return lexer.readText;
            }

            // If "+" presence
            // Ensure only leading "+" are considered
            if(char === "+" && lexer.width() === 1) {
                lexer.tag(LexemeType.Presence);
                return lexer.readText;
            }

            // If "-" presence
            // Ensure only leading "-" are considered
            if(char === "-" && lexer.width() === 1) {
                lexer.tag(LexemeType.Presence);
                return lexer.readText;
            }

        }
    }

    /**
     * Reads whitespace from the query string.
     * @param lexer
     *  The current {@link LunrQueryLexer}.
     * @returns
     *  The next lexer state.
     */
    private readSpace(lexer: LunrQueryLexer): LexerStateFunction {
        while(true) {
            const char = lexer.nextChar();
            
            // If end of query
            if(char === null) {
                if(lexer.width() > 0) {
                    lexer.tag(LexemeType.Space);
                }
                return;
            }

            // If non-space
            if(!char.match(lunr.tokenizer.separator)) {
                lexer.prevChar();
                if(lexer.width() > 0) {
                    lexer.tag(LexemeType.Space);
                }
                return lexer.readText;
            }

        }

    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Lexer Helper Functions  ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Tag the current lexeme and reset the start head.
     * @param type
     *  The lexeme's type.
     */
    private tag(type: LexemeType) {
        this.lexemes.push({
            type,
            text : this.query.slice(this.start, this.index),
            beg  : this.start,
            end  : this.index
        });
        this.start = this.index;
    }

    /**
     * Attempts to read the current character and advance the index.
     * @returns
     *  The current character. `null` if the end of the query was reached.
     */
    private nextChar(): string | null;

    /**
     * Attempts to read the current character and advance the index.
     * @param regex
     *  The acceptance regex.
     * 
     *  When provided, the current character will be matched with the regex. If
     *  matched, the character is returned and the index is advanced. If
     *  unmatched, `null` is returned and the index stays where it is.
     * @returns
     *  The current character. `null` if the character could not be matched.
     */
    private nextChar(regex?: RegExp): string | null;
    private nextChar(regex?: RegExp): string | null {
        if(this.query.length <= this.index) {
            return null;
        }
        if(regex && !this.query.charAt(this.index).match(regex)) {
            return null;
        }
        return this.query.charAt(this.index++);
    }

    /**
     * Attempts to read the current integer and advance the index.
     * @returns
     *  The current integer.
     */
    private nextInteger() {
        let int = "", char, charCode;
        do {
            char = this.nextChar(/\d/) ?? ""
            int += char;
        } while(char !== "");
        return int;
    }

    /**
     * Attempts to read the current character and rewind the index. 
     * @returns
     *  The current character. `null` if the start of the query was reached.
     */
    private prevChar(): string | null {
        if(this.index <= 0) {
            return null;
        }
        return this.query.charAt(this.index--);
    }

    /**
     * Gets the width of the current lexeme.
     * @returns
     *  The width of the current lexeme.
     */
    private width() {
        return this.index - this.start;
    }

}
