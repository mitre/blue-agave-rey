import type { LexemeType } from "./LexemeType";

export interface Lexeme {
    
    /**
     * The lexeme's type.
     */
    type: LexemeType;

    /**
     * The lexeme's value.
     */
    text: string;

    /**
     * The lexeme's starting index.
     */
    beg: number;

    /**
     * The lexeme's ending index.
     */
    end: number;

}
