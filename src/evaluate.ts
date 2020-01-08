import { VMContext } from "./types";
import { runInContext } from "./vm";

export default (code: string, ctx?: VMContext) => {
	return runInContext(code, ctx);
};
