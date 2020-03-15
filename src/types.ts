export type VMContext = {
	[x: string]: any;
	[x: number]: any;
};

export interface CompileOptions {
	parsingContext?: VMContext;
	timeout?: number;
	ecmaVersion?: 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020;
	rootContext?: VMContext | null;
	globalContextInFunction?: any;
}

export interface ScriptOptions {
	ecmaVersion?: 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020;
	timeout?: number;
	rootContext?: VMContext | null;
	globalContextInFunction?: any;
}
