import type { TokenInfo } from "./TokenInfo";

export interface Token {

    /**
     * The token's text.
     */
    text: string;

    /**
     * The token's info.
     */
    info: TokenInfo;

}
