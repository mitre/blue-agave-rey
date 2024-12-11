import type { LunrQueryLexer } from "./LunrQueryLexer";

export type LexerStateFunction = ((lexer: LunrQueryLexer) => LexerStateFunction) | undefined;