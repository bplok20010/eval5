import { Interpreter } from "./interpreter/main";
import { VMContext, CompileOptions, ScriptOptions } from "./types";

// TODO:
// add tests

export function createContext(ctx: VMContext = Object.create(null)): VMContext {
	return ctx;
}

export function compileFunction(
	code: string,
	params: string[] = [],
	options: CompileOptions = {}
): (...args: string[]) => any {
	const ctx: any = options.parsingContext;
	const timeout = options.timeout === undefined ? 0 : options.timeout;

	const wrapCode = `
    (function anonymous(${params.join(",")}){
         ${code}
    });
    `;

	const interpreter = new Interpreter(ctx, {
		ecmaVersion: options.ecmaVersion,
		timeout,
		rootContext: options.rootContext,
		globalContextInFunction: options.globalContextInFunction,
	});

	return interpreter.evaluate(wrapCode);
}

export function runInContext(code: string, ctx?: VMContext, options?: ScriptOptions): any {
	const interpreter = new Interpreter(ctx, options);

	return interpreter.evaluate(code);
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
