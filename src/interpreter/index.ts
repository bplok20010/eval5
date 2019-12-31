import { parse } from "acorn";
import { Node, ESTree } from "./nodes";

const hasOwnProperty = Object.prototype.hasOwnProperty;
const Break = Symbol("Break");
const Continue = Symbol("Continue");

class Return {
    value: any;
    constructor(value: any) {
        this.value = value;
    }
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
    constructor(
        context: Context = {},
        parent: Scope | null = null,
        name?: string
    ) {
        this.name = name;
        this.parent = parent;
        this.data = context;
    }
}

type Context = {};

function noop() {}

function empty() {}

export default class Interpreter {
    rootContext: Context;
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

    setCurrentContext(ctx) {
        this.currentContext = ctx;
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
        // console.log(this.currentScope);
        // return resp;
    }

    create(node: ESTree.Node) {
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

    // a==b a/b
    binaryExpressionHandler(node: ESTree.BinaryExpression) {
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

    // a && b
    logicalExpressionHandler(node: ESTree.LogicalExpression) {
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

    // typeof a !a()
    unaryExpressionHandler(node: ESTree.UnaryExpression) {
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

    // ++a --a
    updateExpressionHandler(node: ESTree.UpdateExpression) {
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

    // var o = {a: 1, b: 's'}
    objectExpressionHandler(node: ESTree.ObjectExpression) {
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

    // [1,2,3]
    arrayExpressionHandler(node: ESTree.ArrayExpression) {
        const items: Array<() => any> = node.elements.map(element =>
            this.create(element)
        );

        return () => {
            return items.map(item => item());
        };
    }
    createCallFunctionGetter(node: Node) {
        switch (node.type) {
            case "MemberExpression":
                const objectGetter = this.create(node.object);
                const keyGetter = this.createMemberKeyGetter(node);
                return () => {
                    const obj = objectGetter();
                    const key = keyGetter();
                    // bind for js function
                    return obj[key].bind(obj);
                };
            default:
                return this.create(node);
        }
    }

    // func()
    callExpressionHandler(node: ESTree.CallExpression) {
        const funcGetter = this.createCallFunctionGetter(node.callee);
        const argsGetter = node.arguments.map(arg => this.create(arg));
        // TODO:
        // MemberExpression
        return () => {
            const func = funcGetter();
            const args = argsGetter.map(arg => arg());
            return func.apply(this.rootContext, args);
        };
    }

    // var f = function() {...}
    functionExpressionHandler(node: ESTree.FunctionExpression) {
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
            function func(...args: any[]) {
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

            Object.defineProperty(func, "$length", {
                value: params.length,
                writable: false,
                configurable: false,
                enumerable: false
            });
            Object.defineProperty(func, "$name", {
                value: node.id ? node.id.name : "",
                writable: false,
                configurable: false,
                enumerable: false
            });
            Object.defineProperty(func, "$isFunction", {
                value: true,
                writable: false,
                configurable: false,
                enumerable: false
            });

            return func;
        };
    }

    // new Ctrl()
    newExpressionHandler(node: ESTree.NewExpression) {
        const expression = this.create(node.callee);
        const args = node.arguments.map(arg => this.create(arg));

        return () => {
            const construct = expression();
            return new construct(...args.map(arg => arg()));
        };
    }

    // a.b a['b']
    memberExpressionHandler(node: ESTree.MemberExpression) {
        var objectGetter = this.create(node.object);
        var keyGetter = this.createMemberKeyGetter(node);
        return () => {
            const obj = objectGetter();
            let key = keyGetter();
            // get function.length
            if (obj.$isFunction && key === "length") {
                key = "$length";
            }
            // get function.name
            if (obj.$isFunction && key === "name") {
                key = "$name";
            }
            return obj[key];
        };
    }

    //this
    thisExpressionHandler(node: ESTree.ThisExpression) {
        return () => this.getCurrentContext();
    }

    // var1,var2,...
    sequenceExpressionHandler(node: ESTree.SequenceExpression) {
        const expressions = node.expressions.map(item => this.create(item));

        return () => {
            let result;

            expressions.forEach(expression => {
                result = expression();
            });

            return result;
        };
    }

    // 1 'name'
    literalHandler(node: ESTree.Literal) {
        return () => {
            return node.value;
        };
    }

    // var1 ...
    identifierHandler(node: ESTree.Identifier) {
        const data = this.getScopeDataFromName(node.name);

        return () => {
            return data[node.name];
        };
    }

    // a=1 a+=2
    assignmentExpressionHandler(node: ESTree.AssignmentExpression) {
        const dataGetter = this.createObjectGetter(node.left);
        const nameGetter = this.createNameGetter(node.left);
        const rightValueGetter = this.create(node.right);

        return () => {
            const context = dataGetter();
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

    // function test(){}
    functionDeclarationHandler(node: ESTree.FunctionDeclaration) {
        this.funcDeclaration(
            node.id.name,
            this.functionExpressionHandler(node)()
        );
        return noop;
    }
    // var i;
    // var i=1;
    variableDeclarationHandler(node: ESTree.VariableDeclaration) {
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
    // {...}
    programHandler(node: ESTree.Program) {
        var stmtClosures = node.body.map(stmt => {
            return this.create(stmt);
        });

        return () => {
            var result;
            for (var i = 0; i < stmtClosures.length; i++) {
                const stmtClosure = stmtClosures[i];

                if (stmtClosure === empty) continue;

                result = stmtClosure();
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
    // 所有表达式: a+1 a&&b a() a.b ...
    expressionStatementHandler(node: ESTree.ExpressionStatement) {
        return this.create(node.expression);
    }
    emptyStatementHandler(node: Node) {
        return empty;
    }

    // return xx;
    returnStatementHandler(node: ESTree.ReturnStatement) {
        const resultGetter = this.create(node.argument);

        return () => {
            return new Return(resultGetter());
        };
    }

    // if else
    ifStatementHandler(node: ESTree.IfStatement) {}
    conditionalExpressionHandler(node: ESTree.ConditionalExpression) {}
    forStatementHandler(node: ESTree.ForStatement) {}
    whileStatementHandler(node: ESTree.WhileStatement) {}
    doWhileStatementHandler(node: ESTree.DoWhileStatement) {}
    forInStatementHandler(node: ESTree.ForInStatement) {}
    withStatementHandler(node: ESTree.WithStatement) {}
    throwStatementHandler(node: ESTree.ThrowStatement) {}
    tryStatementHandler(node: ESTree.TryStatement) {}
    continueStatementHandler(node: ESTree.ContinueStatement) {}
    breakStatementHandler(node: ESTree.BreakStatement) {}
    switchStatementHandler(node: ESTree.SwitchStatement) {}
    labeledStatementHandler(node: ESTree.LabeledStatement) {}

    createMemberKeyGetter(node: ESTree.MemberExpression) {
        // s['a'];  node.computed = true
        // s.foo;  node.computed = false
        return node.computed
            ? this.create(node.property)
            : () => node.property.name;
    }

    // for UnaryExpression UpdateExpression AssignmentExpression
    createObjectGetter(node: Node) {
        switch (node.type) {
            case "Identifier":
                return () => this.getScopeDataFromName(node.name);
            case "MemberExpression":
                return this.create(node.object);
            default:
                throw SyntaxError("Unknown assignment type: " + node.type);
        }
    }

    // for UnaryExpression UpdateExpression AssignmentExpression
    createNameGetter(node: Node) {
        switch (node.type) {
            case "Identifier":
                return () => node.name;
            case "MemberExpression":
                return this.createMemberKeyGetter(node);
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

    getScopeDataFromName(name: string) {
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
