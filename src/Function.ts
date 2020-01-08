import { compileFunction } from "./vm";

export default function(...args: string[]) {
	const code = args.pop();

	return compileFunction(code || "", args);
}
