import { Node, parse } from "acorn";
interface Code {
    ast: Node;
    source?: string;
}

interface Options {}

export default class Interpreter {
    global: {};
    ast: Node;
    source: string;

    constructor(code: string | Code, options: Options = {}) {
        if (typeof code === "string") {
            this.ast = parse(code, {
                ranges: true,
                locations: true
            });
            this.source = code;
        } else {
            this.ast = code.ast;
            this.source = code.source;
        }
    }
    next() {}
    run() {}
}
