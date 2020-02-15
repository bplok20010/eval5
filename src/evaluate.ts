import { VMContext, ScriptOptions } from "./types";
import { runInContext } from "./vm";

export default (code: string, ctx?: VMContext, options?: ScriptOptions) => {
	return runInContext(code, ctx, options);
};
