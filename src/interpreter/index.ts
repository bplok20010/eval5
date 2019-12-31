import * as ESTree from "estree";
import { parse } from "acorn";

const hasOwnProperty = Object.prototype.hasOwnProperty;
const Break = Symbol("Break");
const Continue = Symbol("Continue");

interface Node {
    [prop: string]: any;
}

class Return {
    value: any;
}

interface Code {
    node: Node;
    source?: string;
}

interface Options {
    context?: {};
}

class Scope {
    name: string;
    parent: Scope | null;
    data: {};
    constructor(context: {} = {}, parent: Scope | null = null, name?: string) {
        this.name = name;
        this.parent = parent;
        this.data = context;
    }
}

function noop() {}

export default class Interpreter {
    rootContext: {};
    ast: Node;
    source: string;
    // currentDeclarations: {};
    currentScope: Scope;
    rootScope: Scope;
    currentContext: {};
    options: Options;

    constructor(code: string | Code, options: Options = {}) {
        this.options = {
            context: options.context || {}
        };
        this.rootContext = options.context || {};

        if (typeof code === "string") {
            this.ast = parse(code, {
                ranges: true,
                locations: true
            });
            this.source = code;
        } else {
            this.ast = code.node;
            this.source = code.source;
        }

        this.run();
    }

    setCurrentContext($this) {
        this.currentContext = $this;
    }

    setCurrentScope(scope: Scope) {
        this.currentScope = scope;
    }

    run() {
        this.rootScope = new Scope(this.rootContext, null, "root");
        this.currentScope = this.rootScope;
        this.currentContext = this.rootContext;

        const resp = this.create(this.ast);
        resp();
        console.log(this.currentScope);
        // return resp;
    }

    create(node: Node) {
        switch (node.type) {
            case "BinaryExpression":
                return this.binaryExpressionHandler(node);
            case "LogicalExpression":
                return this.logicalExpressionHandler(node);
            case "UnaryExpression":
                return this.unaryExpressionHandler(node);
            case "UpdateExpression":
                return this.updateExpressionHandler(node);
            case "ObjectExpression":
                return this.objectExpressionHandler(node);
            case "ArrayExpression":
                return this.arrayExpressionHandler(node);
            case "CallExpression":
                return this.callExpressionHandler(node);
            case "NewExpression":
                return this.newExpressionHandler(node);
            case "MemberExpression":
                return this.memberExpressionHandler(node);
            case "ThisExpression":
                return this.thisExpressionHandler(node);
            case "SequenceExpression":
                return this.sequenceExpressionHandler(node);
            case "Literal":
                return this.literalHandler(node);
            case "Identifier":
                return this.identifierHandler(node);
            case "AssignmentExpression":
                return this.assignmentExpressionHandler(node);
            case "FunctionDeclaration":
                return this.functionDeclarationHandler(node);
            case "VariableDeclaration":
                return this.variableDeclarationHandler(node);
            case "BlockStatement":
            case "Program":
                return this.programHandler(node);
            case "ExpressionStatement":
                return this.expressionStatementHandler(node);
            case "EmptyStatement":
                return this.emptyStatementHandler(node);
            case "ReturnStatement":
                return this.returnStatementHandler(node);
            case "FunctionExpression":
                return this.functionExpressionHandler(node);
            case "IfStatement":
                return this.ifStatementHandler(node);
            case "ConditionalExpression":
                return this.conditionalExpressionHandler(node);
            case "ForStatement":
                return this.forStatementHandler(node);
            case "WhileStatement":
                return this.whileStatementHandler(node);
            case "DoWhileStatement":
                return this.doWhileStatementHandler(node);
            case "ForInStatement":
                return this.forInStatementHandler(node);
            case "WithStatement":
                return this.withStatementHandler(node);
            case "ThrowStatement":
                return this.throwStatementHandler(node);
            case "TryStatement":
                return this.tryStatementHandler(node);
            case "ContinueStatement":
                return this.continueStatementHandler(node);
            case "BreakStatement":
                return this.breakStatementHandler(node);
            case "SwitchStatement":
                return this.switchStatementHandler(node);
            case "LabeledStatement":
                return this.labeledStatementHandler(node);
            default:
                throw SyntaxError("Unknown node type: " + node.type);
        }
    }

    binaryExpressionHandler(node: Node) {
        const leftExpression = this.create(node.left);
        const rightExpression = this.create(node.right);

        return () => {
            switch (node.operator) {
                case "==":
                    return leftExpression() == rightExpression();
                case "!=":
                    return leftExpression() != rightExpression();
                case "===":
                    return leftExpression() === rightExpression();
                case "!==":
                    return leftExpression() !== rightExpression();
                case "<":
                    return leftExpression() < rightExpression();
                case "<=":
                    return leftExpression() <= rightExpression();
                case ">":
                    return leftExpression() > rightExpression();
                case ">=":
                    return leftExpression() >= rightExpression();
                case "<<":
                    return leftExpression() << rightExpression();
                case ">>":
                    return leftExpression() >> rightExpression();
                case ">>>":
                    return leftExpression() >>> rightExpression();
                case "+":
                    return leftExpression() + rightExpression();
                case "-":
                    return leftExpression() - rightExpression();
                case "*":
                    return leftExpression() * rightExpression();
                case "/":
                    return leftExpression() / rightExpression();
                case "%":
                    return leftExpression() % rightExpression();
                case "|":
                    return leftExpression() | rightExpression();
                case "^":
                    return leftExpression() ^ rightExpression();
                case "&":
                    return leftExpression() & rightExpression();
                case "in":
                    return leftExpression() in rightExpression();
                case "instanceof":
                    return leftExpression() instanceof rightExpression();
                default:
                    throw SyntaxError(
                        "Unknown binary operator: " + node.operator
                    );
            }
        };
    }
    logicalExpressionHandler(node: Node) {
        const leftExpression = this.create(node.left);
        const rightExpression = this.create(node.right);

        return () => {
            switch (node.operator) {
                case "||":
                    return leftExpression() || rightExpression();
                case "&&":
                    return leftExpression() && rightExpression();
                default:
                    throw SyntaxError(
                        "Unknown logical operator: " + node.operator
                    );
            }
        };
    }
    unaryExpressionHandler(node: Node) {
        if (node.operator === "delete") {
            const objectGetter = this.createObjectGetter(node.argument);
            const nameGetter = this.createNameGetter(node.argument);

            return () => {
                let obj = objectGetter();
                const name = nameGetter();
                return delete obj[name];
            };
        } else {
            const expression = this.create(node.argument);
            return () => {
                switch (node.operator) {
                    case "-":
                        return -expression();
                    case "+":
                        return +expression();
                    case "!":
                        return !expression();
                    case "~":
                        return ~expression();
                    case "typeof":
                        return typeof expression();
                    case "void":
                        return void expression();
                    default:
                        throw SyntaxError(
                            "Unknown unary operator: " + node.operator
                        );
                }
            };
        }
    }
    updateExpressionHandler(node: Node) {
        const objectGetter = this.createObjectGetter(node.argument);
        const nameGetter = this.createNameGetter(node.argument);
        return () => {
            const obj = objectGetter();
            const name = nameGetter();

            switch (node.operator) {
                case "++":
                    return node.prefix ? ++obj[name] : obj[name]++;
                case "--":
                    return node.prefix ? --obj[name] : obj[name]--;
                default:
                    throw SyntaxError(
                        "Unknown update operator: " + node.operator
                    );
            }
        };
    }
    objectExpressionHandler(node: Node) {
        //todo: get/set
        const items: {
            key: string;
            valueGetter: () => any;
        }[] = [];
        node.properties.forEach(property => {
            const key = this.createObjectKeyGetter(property.key)();
            items.push({
                key: key,
                valueGetter: this.create(property.value)
            });
        });

        return () => {
            const result = {};
            items.forEach(function(item) {
                result[item.key] = item.valueGetter();
            });
            return result;
        };
    }
    arrayExpressionHandler(node: Node) {
        const items: Array<() => any> = node.elements.map(element =>
            this.create(element)
        );

        return () => {
            return items.map(item => item());
        };
    }
    callExpressionHandler(node: Node) {
        const funcGetter = this.create(node.callee);
        const argsGetter = node.arguments.map(arg => this.create(arg));
        // TODO:
        // MemberExpression
        return () => {
            const func = funcGetter();
            const args = argsGetter.map(arg => arg());
            return func.apply(this.rootContext, args);
        };
    }
    functionExpressionHandler(node: Node) {
        const self = this;
        const currentScope = this.getCurrentScope();
        const newScope = new Scope({}, currentScope);
        const params = node.params;
        // set scope
        this.setCurrentScope(newScope);
        const bodyGetter = this.create(node.body);
        // restore scope
        this.setCurrentScope(currentScope);
        return () => {
            function func(...args) {
                // init arguments var
                params.forEach((param, i) => {
                    newScope.data[param.name] = args[i];
                });
                // init this
                const prevContext = self.getCurrentContext();
                //for ThisExpression
                self.setCurrentContext(this);
                const result = bodyGetter();
                self.setCurrentContext(prevContext);

                if (result instanceof Return) {
                    return result.value;
                }
            }

            //TODO: function.length function.name
            return func;
        };
    }
    newExpressionHandler(node: Node) {
        const expression = this.create(node.callee);
        const args = node.arguments.map(arg => this.create(arg));

        return () => {
            const construct = expression();
            return new construct(...args.map(arg => arg()));
        };
    }
    memberExpressionHandler(node: Node) {
        var objectGetter = this.create(node.object);
        var keyGetter = this.createKeyGetter(node);
        return () => {
            const obj = objectGetter();
            let key = keyGetter();
            //TODO:
            // function.length
            // if (obj.$isFunction && key === "length") {
            //     key = "$length";
            // }
            // // function.name
            // if (obj.$isFunction && key === "name") {
            //     key = "$name";
            // }
            return obj[key];
        };
    }
    thisExpressionHandler(node: Node) {
        return () => this.getCurrentContext();
    }
    sequenceExpressionHandler(node: Node) {
        const expressions = node.expressions.map(item => this.create(item));

        return () => {
            let result;

            expressions.forEach(expression => {
                result = expression();
            });

            return result;
        };
    }
    literalHandler(node: Node) {
        return () => {
            return node.value;
        };
    }
    identifierHandler(node: Node) {
        const data = this.getContextFromName(node.name);

        return () => {
            return data[node.name];
        };
    }
    assignmentExpressionHandler(node: Node) {
        const contextGetter = this.createObjectGetter(node.left);
        const nameGetter = this.createNameGetter(node.left);
        const rightValueGetter = this.create(node.right);

        return () => {
            const context = contextGetter();
            const name = nameGetter();
            const rightValue = rightValueGetter();
            let value = context[name];

            switch (node.operator) {
                case "=":
                    value = rightValue;
                    break;
                case "+=":
                    value += rightValue;
                    break;
                case "-=":
                    value -= rightValue;
                    break;
                case "*=":
                    value *= rightValue;
                    break;
                case "/=":
                    value /= rightValue;
                    break;
                case "%=":
                    value %= rightValue;
                    break;
                case "<<=":
                    value <<= rightValue;
                    break;
                case ">>=":
                    value >>= rightValue;
                    break;
                case ">>>=":
                    value >>>= rightValue;
                    break;
                case "&=":
                    value &= rightValue;
                    break;
                case "^=":
                    value ^= rightValue;
                    break;
                case "|=":
                    value |= rightValue;
                    break;
                default:
                    throw SyntaxError(
                        "Unknown assignment expression: " + node.operator
                    );
            }

            context[name] = value;

            return value;
        };
    }
    variableDeclarationHandler(node: Node) {
        const assignments = [];
        for (var i = 0; i < node.declarations.length; i++) {
            var decl = node.declarations[i];
            this.varDeclaration(decl.id.name);
            if (decl.init) {
                assignments.push({
                    type: "AssignmentExpression",
                    operator: "=",
                    left: decl.id,
                    right: decl.init
                });
            }
        }
        return () => {
            this.create({
                type: "BlockStatement",
                body: assignments
            })();
        };
    }
    programHandler(node: Node) {
        var stmtClosures = node.body.map(stmt => {
            return this.create(stmt);
        });

        return () => {
            var result;
            for (var i = 0; i < stmtClosures.length; i++) {
                result = stmtClosures[i]();
                if (
                    result === Break ||
                    result === Continue ||
                    result instanceof Return
                ) {
                    break;
                }
            }
            return result;
        };
    }
    expressionStatementHandler(node: Node) {
        return this.create(node.expression);
    }
    emptyStatementHandler(node: Node) {}
    returnStatementHandler(node: Node) {}
    functionDeclarationHandler(node: Node) {
        this.funcDeclaration(
            node.id.name,
            this.functionExpressionHandler(node)
        );
        return noop;
    }

    ifStatementHandler(node: Node) {}
    conditionalExpressionHandler(node: Node) {}
    forStatementHandler(node: Node) {}
    whileStatementHandler(node: Node) {}
    doWhileStatementHandler(node: Node) {}
    forInStatementHandler(node: Node) {}
    withStatementHandler(node: Node) {}
    throwStatementHandler(node: Node) {}
    tryStatementHandler(node: Node) {}
    continueStatementHandler(node: Node) {}
    breakStatementHandler(node: Node) {}
    switchStatementHandler(node: Node) {}
    labeledStatementHandler(node: Node) {}

    createObjectGetter(node: Node) {
        switch (node.type) {
            case "Identifier":
                return () => this.getContextFromName(node.name);
            case "MemberExpression":
                return this.create(node.object);
            default:
                throw SyntaxError("Unknown assignment type: " + node.type);
        }
    }

    createKeyGetter(node: Node) {
        // s['a'];  node.computed = true
        // s.foo;  node.computed = false
        return node.computed
            ? this.create(node.property)
            : () => node.property.name;
    }

    createNameGetter(node: Node) {
        switch (node.type) {
            case "Identifier":
                return () => node.name;
            case "MemberExpression":
                return this.createKeyGetter(node);
            default:
                throw SyntaxError("Unknown assignment type: " + node.type);
        }
    }

    createObjectKeyGetter(node: Node) {
        let key: string;
        if (node.type === "Identifier") {
            key = node.name;
        } else {
            key = this.create(node)();
        }

        return function() {
            return key;
        };
    }

    varDeclaration(name: string): void {
        const context = this.getCurrentContext();
        if (!hasOwnProperty.call(context, name)) {
            context[name] = undefined;
        }
    }

    funcDeclaration(name: string, func: () => any): void {
        const context = this.getCurrentContext();
        if (
            !hasOwnProperty.call(context, name) ||
            context[name] === undefined
        ) {
            context[name] = func;
        }
    }

    getScopeValue(name: string): any {
        const scope = this.getScopeFromName(name);
        return scope.data[name];
    }

    getContextFromName(name: string) {
        return this.getScopeFromName(name).data;
    }

    getScopeFromName(name: string) {
        let scope = this.getCurrentScope();

        do {
            if (hasOwnProperty.call(scope, name)) {
                return scope;
            }
        } while ((scope = scope.parent));

        return this.rootScope;
    }

    getCurrentScope() {
        return this.currentScope;
    }

    getCurrentContext() {
        return this.currentContext;
    }

    next() {}
}
