export type VMContext = {};

export interface CompileOptions {
	parsingContext?: VMContext;
	timeout?: number;
}

export interface ScriptOptions {
	timeout?: number;
}
