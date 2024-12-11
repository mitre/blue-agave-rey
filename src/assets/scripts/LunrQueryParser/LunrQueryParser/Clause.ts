import type { Token } from "./Token";
import { TokenInfo, TypeMask } from "./TokenInfo";

export class Clause {

    /**
     * The clause's text.
     */
    public text: string;

    /**
     * The clause's tokens.
     */
    public tokens: Token[];

    /**
     * Whether the clause exclusively includes whitespace.
     */
    public onlyWhitespace: boolean;

    /**
     * Whether the clause includes a presence.
     */
    public hasPresence: boolean;

    /**
     * Whether the clause includes a field.
     */
    public hasField: boolean;

    /**
     * Whether the clause includes a term.
     */
    public hasTerm: boolean;

    /**
     * Whether the clause has at least one edit distance.
     */
    public hasEditDistance: boolean;

    /**
     * Whether the clause has at least one boost.
     */
    public hasBoost: boolean;


    /**
     * Creates a new {@link Clause}.
     */
    constructor() {
        this.text = "";
        this.tokens = [];
        this.hasPresence = false;
        this.hasField = false;
        this.hasTerm = false;
        this.hasEditDistance = false;
        this.hasBoost = false;
        this.onlyWhitespace = true;
    }


    /**
     * Adds a {@link Token} to the clause.
     * @param token
     *  The token to add.
     */
    public addToken(token: Token) {
        // Update text
        this.text += token.text;
        // Update tokens
        this.tokens.push(token);
        // Update flags
        const type = token.info & TypeMask; 
        switch(type) {
            case TokenInfo.Presence:
                this.hasPresence = true;
                break;
            case TokenInfo.FieldName:
                this.hasField = true;
                break;
            case TokenInfo.Term:
                this.hasTerm = true;
                break;
            case TokenInfo.EditDistance:
                this.hasEditDistance = true;
                break;
            case TokenInfo.Boost:
                this.hasBoost = true;
                break;
        }
        // Update whitespace
        if(type !== TokenInfo.Space) {
            this.onlyWhitespace = false;
        }
    }

    /**
     * Returns the first token from the clause that matches `type`.
     * @param type
     *  The token's type.
     * @returns
     *  The first token that matches `type`, `undefined` otherwise.
     */
    public get(type: TokenInfo): Token | undefined {
        for(const token of this.tokens) {
            if((token.info & TypeMask) === type) {
                return token;
            }
        }
        return;
    }

}