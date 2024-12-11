import { TokenInfo } from "./TokenInfo";
import { LexemeType, LunrQueryLexer, type Lexeme } from "../LunrQueryLexer";
import type { Token } from "./Token";
import { Clause } from "./Clause";
import type { ParserStateFunction } from "./ParserStateFunction";

export class LunrQueryParser {

    /**
     * The index of the current lexeme.
     */
    private index: number;

    /**
     * The valid search fields.
     */
    private fields: Set<string>;

    /**
     * The parser's clauses.
     */
    private clauses: Clause[];

    /**
     * The parser's lexeme's
     */
    private lexemes: Lexeme[];


    /**
     * Creates a new {@link LunrQueryParser}.
     */
    constructor() {
        this.index = 0;
        this.fields = new Set();
        this.clauses = []
        this.lexemes = [];
    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Parser State Functions  ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Parses a Lunr search query.
     * @param str
     *  The search query to parse.
     * @param fields
     *  The valid search fields.
     * @returns
     *  The parsed tokens.
     */
    public parse(str: string, fields: Set<string>): Clause[] {
        // Configure state
        this.index = 0;
        this.fields = fields;
        this.clauses = [];
        this.lexemes = new LunrQueryLexer(str).run();
        // Run parser
        let state: ParserStateFunction = this.parseClause;
        while(state) {
            state = state(this);
        }
        // Return tokens
        return this.clauses;
    }

    /**
     * Parses a search clause.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseClause(parser: LunrQueryParser): ParserStateFunction {
        // Parse whitespace
        const ws = parser.consumeWhitespace();
        // Validate next lexeme
        const lexeme = parser.peekLexeme();
        if(!lexeme) {
            parser.newClause(ws, TokenInfo.Space);
            return;
        }
        // Parse token
        switch(lexeme.type) {
            case LexemeType.Presence:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parsePresence;
            case LexemeType.Field:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseField;
            case LexemeType.Term:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError;
        }
    }

    /**
     * Parses a search presence.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parsePresence(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Create token
        const token = parser.newToken(lexeme, TokenInfo.Presence);
        // Parse whitespace
        const ws = parser.consumeWhitespace();
        // Validate next lexeme
        const next = parser.peekLexeme();
        if(!next) {
            token.info |= TokenInfo.Warning;
            parser.newClause(ws, TokenInfo.Space);
            return;
        }
        // Parse next lexeme
        switch(next.type) {
            case LexemeType.Field:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseField;
            case LexemeType.Term:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError; 
        }
    }

    /**
     * Parses a search field.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseField(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Create token
        const token = parser.newToken(lexeme, TokenInfo.FieldName);
        // Parse whitespace
        const ws = parser.consumeWhitespace();
        // Validate field
        const field = lexeme.text.substring(0, lexeme.text.length - 1);
        if(!parser.fields.has(field)) {
            token.info |= TokenInfo.Error;
        }
        // Validate next lexeme        
        const next = parser.peekLexeme();
        if(!next) {
            token.info |= TokenInfo.Warning;
            parser.newTokens(ws, TokenInfo.Space);
            return;
        }
        // Parse next lexeme
        switch(next.type) {
            case LexemeType.Term:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError;
        }
    }

    /**
     * Parses a search term.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseTerm(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Create token
        parser.newToken(lexeme, TokenInfo.Term);
        // Validate next lexeme
        const ws = parser.consumeWhitespace();
        const next = parser.peekLexeme();
        if(!next) {
            parser.newClause(ws, TokenInfo.Space);
            return;
        }
        // Parse next lexeme
        switch(next.type) {
            case LexemeType.Boost:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseBoost;
            case LexemeType.EditDistance:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseEditDistance;
            case LexemeType.Presence:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parsePresence;
            case LexemeType.Field:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseField;
            case LexemeType.Term:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError;
        }
    }


    /**
     * Parses a search edit distance modifier.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseEditDistance(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Create token
        const token = parser.newToken(lexeme, TokenInfo.EditDistance);
        // Validate token
        if(token.text === "~") {
            token.info |= TokenInfo.Error;
        }
        // Validate next lexeme
        const ws = parser.consumeWhitespace();
        const next = parser.peekLexeme();
        if(!next) {
            if(token.info & TokenInfo.Error) {
                token.info = token.info & ~TokenInfo.Error;
                token.info = token.info | TokenInfo.Warning;
            }
            parser.newClause(ws, TokenInfo.Space);
            return
        }
        // Parse next lexeme
        switch(next.type) {
            case LexemeType.Boost:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseBoost;
            case LexemeType.EditDistance:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseEditDistance;
            case LexemeType.Presence:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parsePresence;
            case LexemeType.Field:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseField;
            case LexemeType.Term:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError;
        }
    }

    /**
     * Parses a search boost modifier.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseBoost(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Create token
        const token = parser.newToken(lexeme, TokenInfo.Boost);
        // Validate token
        if(token.text === "^") {
            token.info |= TokenInfo.Error;
        }
        // Validate next lexeme
        const ws = parser.consumeWhitespace();
        const next = parser.peekLexeme();
        if(!next) {
            if(token.info & TokenInfo.Error) {
                token.info = token.info & ~TokenInfo.Error;
                token.info = token.info | TokenInfo.Warning;
            }
            parser.newClause(ws, TokenInfo.Space);
            return
        }
        // Parse next lexeme
        switch(next.type) {
            case LexemeType.Boost:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseBoost;
            case LexemeType.EditDistance:
                parser.newTokens(ws, TokenInfo.Space);
                return parser.parseEditDistance;
            case LexemeType.Presence:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parsePresence;
            case LexemeType.Field:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseField;
            case LexemeType.Term:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseTerm;
            default:
                parser.newClause(ws, TokenInfo.Space);
                parser.newClause();
                return parser.parseError;
        }
    }

    /**
     * Parses a search error.
     * @param parser
     *  The current {@link LunrQueryParser}.
     * @returns
     *  The next parser state.
     */
    private parseError(parser: LunrQueryParser): ParserStateFunction {
        const lexeme = parser.consumeLexeme();
        if(!lexeme) {
            return;
        }
        // Configure token
        parser.newToken(lexeme, TokenInfo.Unknown | TokenInfo.Error);
        // Validate next token
        return parser.parseClause;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Clause / Token Functions  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns the current clause.
     */
    private currentClause(): Clause {
        if(!this.clauses.length) {
            this.newClause();
        }
        return this.clauses[this.clauses.length - 1];
    }

    /**
     * Creates a new clause.
     */
    private newClause(): void;

    /**
     * Creates a new clause containing the provided lexemes. If `lexemes` is
     * empty, no clause is created.
     * @param lexeme
     *  The lexemes to add to the new clause.
     * @param info
     *  The lexeme info.
     */
    private newClause(lexemes: Lexeme[], info: TokenInfo): void;
    private newClause(lexemes?: Lexeme[], info?: TokenInfo) {
        if(!lexemes || lexemes.length) {
            this.clauses.push(new Clause());
        }
        if(lexemes) {
            this.newTokens(lexemes, info ?? TokenInfo.None);
        }
    }

    /**
     * Creates new parse tokens and adds them to the current clause.
     * @param lexemes
     *  Each token's lexemes. 
     * @param info
     *  The tokens' info.
     * @returns
     *  The new parse tokens.
     */
    private newTokens(lexemes: Lexeme[], info: TokenInfo) {
        const tokens = [];
        for(let lexeme of lexemes) {
            tokens.push(this.newToken(lexeme, info));
        }
        return tokens;
    }

    /**
     * Creates a new parse token and adds it to the current clause.
     * @param lexeme
     *  The token's lexeme.
     * @param type
     *  The token's type.
     * @returns
     *  The new parse token.
     */
    private newToken(lexeme: Lexeme, info: TokenInfo): Token
    private newToken(lexeme: Lexeme, info: TokenInfo): Token {
        const clause = this.currentClause();
        // Add token
        clause.addToken({
            text: lexeme.text,
            info: info
        });
        // Return token
        return clause.tokens[clause.tokens.length - 1];
    }


    ///////////////////////////////////////////////////////////////////////////
    //  3. Lexeme Functions  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns the current lexeme without advancing the index.
     * @returns
     *  The current lexeme.
     */
    private peekLexeme(): Lexeme | undefined {
        return this.lexemes[this.index];
    }

    /**
     * Returns the current lexeme and advances the index.
     * @returns
     *  The current lexeme.
     */
    private consumeLexeme(): Lexeme | undefined {
        return this.lexemes[this.index++];
    }

    /**
     * Returns the current whitespace lexemes and advances the index.
     * @returns
     *  The generated whitespace search tokens.
     */
    private consumeWhitespace(): Lexeme[] {
        const whitespace = [];
        let nextLexeme = this.peekLexeme();
        while(nextLexeme && nextLexeme.type === LexemeType.Space) {
            whitespace.push(this.consumeLexeme()!);
            nextLexeme = this.peekLexeme();
        }
        return whitespace;
    }

}
