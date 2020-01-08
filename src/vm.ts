import { Interpreter } from "./interpreter/index";
import { VMContext, CompileOptions } from "./types";

// class Context {}

export function createContext(ctx: VMContext = Object.create(null)): VMContext {
	return ctx;
}

export function compileFunction(
	code: string,
	params: string[] = [],
	options: CompileOptions = {}
): (...args: any[]) => any {
	var ctx: any =
		options.parsingContext === undefined ? Object.create(null) : options.parsingContext;

	var wrapCode = "function f(" + params.join(",") + ") {" + code + "} f";

	const interpreter = new Interpreter(ctx);

	interpreter.evaluate(wrapCode);

	return interpreter.getValue();
}

export function runInContext(code: string, ctx?: VMContext): any {
	const interpreter = new Interpreter(ctx);

	interpreter.evaluate(code);

	return interpreter.getValue();
}

export const runInNewContext = runInContext;

export class Script {
	_code: string;
	constructor(code: string) {
		this._code = code;
	}
	runInContext(ctx: VMContext): any {
		return runInContext(this._code, ctx);
	}
	runInNewContext(ctx?: VMContext): any {
		return runInContext(this._code, ctx);
	}
}
