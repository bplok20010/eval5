import { parse } from "acorn";
const hasOwnProperty = Object.prototype.hasOwnProperty;
const Break = {};
const Continue = {};

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

interface Scope {
    parent: Scope | null;
    context: {};
}

function createScope(context: {} = {}, parent: Scope | null = null): Scope {
    return {
        parent: parent,
        context: context
    };
}

function noop() {}

export default class Interpreter {
    context: {};
    ast: Node;
    source: string;
    // currentDeclarations: {};
    currentScope: Scope;
    rootScope: Scope;
    currentThis: {};
    options: Options;

    constructor(code: string | Code, options: Options = {}) {
        this.options = {
            context: options.context || {}
        };
        this.context = options.context || {};

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

    run() {
        this.rootScope = createScope(this.context, null);
        this.currentScope = this.rootScope;
        this.currentThis = this.context;

        const resp = this.create(this.ast);
        resp();
        console.log(this.currentScope);
        // return resp;
    }

    create(node: Node) {
        const typeHandlers = {
            BinaryExpression: this.binaryExpressionHandler,
            LogicalExpression: this.logicalExpressionHandler,
            UnaryExpression: this.unaryExpressionHandler,
            UpdateExpression: this.updateExpressionHandler,
            ObjectExpression: this.objectExpressionHandler,
            ArrayExpression: this.arrayExpressionHandler,
            CallExpression: this.callExpressionHandler,
            NewExpression: this.newExpressionHandler,
            MemberExpression: this.memberExpressionHandler,
            ThisExpression: this.thisExpressionHandler,
            SequenceExpression: this.sequenceExpressionHandler,
            Literal: this.literalHandler,
            Identifier: this.identifierHandler,
            AssignmentExpression: this.assignmentExpressionHandler,
            FunctionDeclaration: this.functionDeclarationHandler,
            VariableDeclaration: this.variableDeclarationHandler,
            BlockStatement: this.programHandler,
            Program: this.programHandler,
            ExpressionStatement: this.expressionStatementHandler,
            EmptyStatement: this.emptyStatementHandler,
            ReturnStatement: this.returnStatementHandler,
            FunctionExpression: this.functionExpressionHandler,
            IfStatement: this.ifStatementHandler,
            ConditionalExpression: this.conditionalExpressionHandler,
            ForStatement: this.forStatementHandler,
            WhileStatement: this.whileStatementHandler,
            DoWhileStatement: this.doWhileStatementHandler,
            ForInStatement: this.forInStatementHandler,
            WithStatement: this.withStatementHandler,
            ThrowStatement: this.throwStatementHandler,
            TryStatement: this.tryStatementHandler,
            ContinueStatement: this.continueStatementHandler,
            BreakStatement: this.breakStatementHandler,
            SwitchStatement: this.switchStatement
        };

        const closure = (typeHandlers[node.type] ||
            function() {
                console.warn("Not implemented yet: " + node.type);
            })(node);

        return closure;
    }

    binaryExpressionHandler = (node: Node) => {
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
    };
    logicalExpressionHandler = (node: Node) => {
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
    };
    unaryExpressionHandler = (node: Node) => {
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
    };
    updateExpressionHandler = (node: Node) => {
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
    };
    objectExpressionHandler = (node: Node) => {
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
    };
    arrayExpressionHandler = (node: Node) => {
        const items: Array<() => any> = node.elements.map(element =>
            this.create(element)
        );

        return () => {
            return items.map(item => item());
        };
    };
    callExpressionHandler = () => {};
    newExpressionHandler = (node: Node) => {
        const expression = this.create(node.callee);
        const args = node.arguments.map(arg => this.create(arg));

        return () => {
            const construct = expression();
            return new construct(...args.map(arg => arg()));
        };
    };
    memberExpressionHandler = (node: Node) => {
        var objectGetter = this.create(node.object);
        var keyGetter = this.createKeyGetter(node);
        return () => {
            const obj = objectGetter();
            let key = keyGetter();
            // function.length
            if (obj.$isFunction && key === "length") {
                key = "$length";
            }
            // function.name
            if (obj.$isFunction && key === "name") {
                key = "$name";
            }
            return obj[key];
        };
    };
    thisExpressionHandler = () => {
        return () => this.currentThis;
    };
    sequenceExpressionHandler = (node: Node) => {
        const expressions = node.expressions.map(item => this.create(item));

        return () => {
            let result;

            expressions.forEach(expression => {
                result = expression();
            });

            return result;
        };
    };
    literalHandler = (node: Node) => {
        return () => {
            return node.value;
        };
    };
    identifierHandler = (node: Node) => {
        return () => {
            return this.getScopeValue(node.name);
        };
    };
    assignmentExpressionHandler = (node: Node) => {
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
    };
    functionDeclarationHandler = () => {};
    variableDeclarationHandler = (node: Node) => {
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
    };
    programHandler = (node: Node) => {
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
    };
    expressionStatementHandler = (node: Node) => {
        return this.create(node.expression);
    };
    emptyStatementHandler = () => {};
    returnStatementHandler = () => {};
    functionExpressionHandler = () => {};
    ifStatementHandler = () => {};
    conditionalExpressionHandler = () => {};
    forStatementHandler = () => {};
    whileStatementHandler = () => {};
    doWhileStatementHandler = () => {};
    forInStatementHandler = () => {};
    withStatementHandler = () => {};
    throwStatementHandler = () => {};
    tryStatementHandler = () => {};
    continueStatementHandler = () => {};
    breakStatementHandler = () => {};
    switchStatement = () => {};

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

    getScopeValue(name: string): any {
        const scope = this.getScopeFromName(name);
        return scope.context[name];
    }

    getContextFromName(name: string) {
        return this.getScopeFromName(name).context;
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
        return this.currentScope.context;
    }

    next() {}
}
