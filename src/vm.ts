import { Interpreter } from "./interpreter/index";
import { VMContext, CompileOptions, ScriptOptions } from "./types";

// class Context {}

export function createContext(ctx: VMContext = Object.create(null)): VMContext {
	return ctx;
}

export function compileFunction(
	code: string,
	params: string[] = [],
	options: CompileOptions = {}
): (...args: any[]) => any {
	const ctx: any = options.parsingContext;
	const timeout = options.timeout === undefined ? 0 : options.timeout;

	const wrapCode = `
    (function anonymous(${params.join(",")}){
         ${code}
    });
    `;

	const interpreter = new Interpreter(ctx, {
		timeout,
	});

	interpreter.evaluate(wrapCode);

	return interpreter.getValue();
}

export function runInContext(code: string, ctx?: VMContext, options?: ScriptOptions): any {
	const interpreter = new Interpreter(ctx, options);

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
