import type { LunrQueryParser } from "./LunrQueryParser";

export type ParserStateFunction = ((parser: LunrQueryParser) => ParserStateFunction) | undefined;