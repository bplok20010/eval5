import { parse } from "acorn";
import { Messages } from "./messages";
import { Node, ESTree } from "./nodes";

const hasOwnProperty = Object.prototype.hasOwnProperty;
const FunctionNameSymbol = Symbol("name");
const FunctionLengthSymbol = Symbol("length");
const isFunctionSymbol = Symbol("isFunction");
const Break = Symbol("Break");
const Continue = Symbol("Continue");
const DefaultCase = Symbol("DefaultCase");
const EmptyStatementReturn = Symbol("EmptyStatementReturn");

// interface Position {
// 	line: number;
// 	column: number;
// }

// interface SourcePosition {
// 	start?: number;
// 	end?: number;
// 	loc?: {
// 		start: Position;
// 		end: Position;
// 	};
// }

type Getter = () => any;
type BaseClosure = (pNode?: Node) => any;
type CaseItem = {
	testClosure: BaseClosure;
	bodyClosure: BaseClosure;
};
type SwitchCaseClosure = () => CaseItem;
type ReturnStringClosure = () => string;

function isFunction<T>(func: T): boolean {
	return typeof func === "function";
}

class Return {
	value: any;
	constructor(value: any) {
		this.value = value;
	}
}

class BreakLabel {
	value: string;
	constructor(value: string) {
		this.value = value;
	}
}

class ContinueLabel {
	value: string;
	constructor(value: string) {
		this.value = value;
	}
}

class Throw {
	uncaught: boolean = false;
	value: Error;
	constructor(value: Error) {
		this.value = value;
	}
}

class Interrupt {}

interface Options {
	timeout?: number;
}

interface CollectDeclarations {
	[key: string]: undefined | BaseClosure;
}

type ScopeData = {};
type Labels = {};

class Scope {
	name: string | undefined;
	parent: Scope | null;
	data: ScopeData;
	labelStack: string[];
	constructor(data: ScopeData, parent: Scope | null = null, name?: string) {
		this.name = name;
		this.parent = parent;
		this.data = data;
		this.labelStack = [];
	}
}

type Context = {};

function noop() {}

function createScope(parent: Scope | null = null, name?: string): Scope {
	return new Scope({} /* or Object.create(null)? */, parent, name);
}

export default class Interpreter {
	static interrupt() {
		return new Interrupt();
	}

	static throw(message: any) {
		return new Throw(message instanceof Error ? message : new Error(message));
	}

	context: Context;
	// last expression value
	value: any;
	rootContext: Context;
	ast: ESTree.Program;
	source: string;
	currentScope: Scope;
	rootScope: Scope;
	currentContext: Context;
	options: Options;
	callStack: string[];
	collectDeclarations: CollectDeclarations = {};
	protected error: Throw | Error | null = null;
	protected isVarDeclMode: boolean = false;

	protected execStartTime: number;
	protected execEndTime: number;

	constructor(context: Context, options: Options = {}) {
		this.options = {
			timeout: options.timeout || 0,
		};

		this.context = context;
		this.callStack = [];
	}

	setCurrentContext(ctx: Context) {
		this.currentContext = ctx;
	}

	setCurrentScope(scope: Scope) {
		this.currentScope = scope;
	}

	initEnvironment(ctx: Context) {
		//init global scope
		this.rootScope = new Scope(ctx, null, "root");
		this.currentScope = this.rootScope;
		//init global context == this
		this.rootContext = ctx;
		this.currentContext = ctx;
		// collect var/function declare
		this.collectDeclarations = {};

		this.execStartTime = Date.now();
		this.execEndTime = this.execStartTime;
		this.error = null;
	}

	evaluate(code: string = "", ctx: Context = this.context) {
		let node: unknown;
		try {
			node = parse(code, {
				ranges: true,
				locations: true,
			});
		} catch (e) {
			if (e instanceof Error) {
				this.error = e;
			} else {
				this.error = new SyntaxError(e);
			}

			return;
		}

		return this.evaluateNode(node as ESTree.Program, code, ctx);
	}

	evaluateNode(node: ESTree.Program, source: string = "", ctx: Context = this.context) {
		this.initEnvironment(ctx);

		this.source = source;
		this.ast = node;
		let result: any;

		// Interpreter Error
		try {
			const bodyClosure = this.create(node);

			// add declares to data
			this.addDeclarationsToScope(this.collectDeclarations, this.getCurrentScope());

			// reset
			this.collectDeclarations = {};
			// start run
			result = bodyClosure();
		} catch (e) {
			if (e instanceof Error) {
				this.error = e;
			} else {
				this.error = new Error(e);
			}
		}

		// Uncaught error
		if (result instanceof Throw) {
			//result.value
			result.uncaught = true;
			this.error = result;
		}

		this.execEndTime = Date.now();

		return this.getValue();
	}

	getExecutionTime(): number {
		return this.execEndTime - this.execStartTime;
	}

	createError(msg: [number, string], value: string | number, node?: Node): Error {
		const code = msg[0];
		let message = msg[1].replace("%0", String(value));

		message += " " + this.getNodePosition(node);

		if (code > 1000 && code <= 2000) {
			return new SyntaxError(message);
		} else if (code > 2000 && code <= 3000) {
			return new ReferenceError(message);
		} else {
			return new Error(message);
		}
	}

	throwError(msg: [number, string], value: string | number, node?: Node): never {
		throw this.createError(msg, value, node);
	}

	createThrowError(msg: [number, string], value: string | number, node?: Node): Throw {
		return new Throw(this.createError(msg, value, node));
	}

	getError() {
		return this.error ? (this.error instanceof Throw ? this.error.value : this.error) : null;
	}

	getErrorMessage() {
		if (!this.error) return null;
		let error = this.error;

		let uncaught = false;

		if (error instanceof Throw) {
			uncaught = error.uncaught;
			error = error.value;
		}

		const prefix = uncaught ? "Uncaught " : "";

		return error ? prefix + error : null;
	}

	protected checkTimeout() {
		const timeout = this.options.timeout || 0;

		const now = Date.now();
		if (now - this.execStartTime > timeout) {
			return true;
		}

		return false;
	}

	getNodePosition(node?: Node) {
		if (node) {
			return node.loc ? `(${node.loc.start.line}, ${node.loc.start.column})` : "";
		}
		return "";
	}

	create(node: Node) {
		const timeout = this.options.timeout;
		let closure: BaseClosure;

		switch (node.type) {
			case "BinaryExpression":
				closure = this.binaryExpressionHandler(node);
				break;
			case "LogicalExpression":
				closure = this.logicalExpressionHandler(node);
				break;
			case "UnaryExpression":
				closure = this.unaryExpressionHandler(node);
				break;
			case "UpdateExpression":
				closure = this.updateExpressionHandler(node);
				break;
			case "ObjectExpression":
				closure = this.objectExpressionHandler(node);
				break;
			case "ArrayExpression":
				closure = this.arrayExpressionHandler(node);
				break;
			case "CallExpression":
				closure = this.callExpressionHandler(node);
				break;
			case "NewExpression":
				closure = this.newExpressionHandler(node);
				break;
			case "MemberExpression":
				closure = this.memberExpressionHandler(node);
				break;
			case "ThisExpression":
				closure = this.thisExpressionHandler(node);
				break;
			case "SequenceExpression":
				closure = this.sequenceExpressionHandler(node);
				break;
			case "Literal":
				closure = this.literalHandler(node);
				break;
			case "Identifier":
				closure = this.identifierHandler(node);
				break;
			case "AssignmentExpression":
				closure = this.assignmentExpressionHandler(node);
				break;
			case "FunctionDeclaration":
				closure = this.functionDeclarationHandler(node);
				break;
			case "VariableDeclaration":
				closure = this.variableDeclarationHandler(node);
				break;
			case "BlockStatement":
			case "Program":
				closure = this.programHandler(node);
				break;
			case "ExpressionStatement":
				closure = this.expressionStatementHandler(node);
				break;
			case "EmptyStatement":
				closure = this.emptyStatementHandler(node);
				break;
			case "ReturnStatement":
				closure = this.returnStatementHandler(node);
				break;
			case "FunctionExpression":
				closure = this.functionExpressionHandler(node);
				break;
			case "IfStatement":
				closure = this.ifStatementHandler(node);
				break;
			case "ConditionalExpression":
				closure = this.conditionalExpressionHandler(node);
				break;
			case "ForStatement":
				closure = this.forStatementHandler(node);
				break;
			case "WhileStatement":
				closure = this.whileStatementHandler(node);
				break;
			case "DoWhileStatement":
				closure = this.doWhileStatementHandler(node);
				break;
			case "ForInStatement":
				closure = this.forInStatementHandler(node);
				break;
			case "WithStatement":
				closure = this.withStatementHandler(node);
				break;
			case "ThrowStatement":
				closure = this.throwStatementHandler(node);
				break;
			case "TryStatement":
				closure = this.tryStatementHandler(node);
				break;
			case "ContinueStatement":
				closure = this.continueStatementHandler(node);
				break;
			case "BreakStatement":
				closure = this.breakStatementHandler(node);
				break;
			case "SwitchStatement":
				closure = this.switchStatementHandler(node);
				break;
			case "LabeledStatement":
				closure = this.labeledStatementHandler(node);
				break;
			default:
				this.throwError(Messages.NodeTypeSyntaxError, node.type, node);
		}

		if (timeout && timeout > 0) {
			return (...args: any) => {
				if (this.checkTimeout()) {
					this.throwError(Messages.ExecutionTimeOutError, timeout, node);
				}

				return closure(...args);
			};
		}

		return closure;
	}

	// a==b a/b
	binaryExpressionHandler(node: ESTree.BinaryExpression): BaseClosure {
		const leftExpression = this.create(node.left);
		const rightExpression = this.create(node.right);

		return () => {
			const leftValue = leftExpression();
			const rightValue = rightExpression();

			if (leftValue instanceof Throw) {
				return leftValue;
			}

			if (rightValue instanceof Throw) {
				return rightValue;
			}

			switch (node.operator) {
				case "==":
					return leftValue == rightValue;
				case "!=":
					return leftValue != rightValue;
				case "===":
					return leftValue === rightValue;
				case "!==":
					return leftValue !== rightValue;
				case "<":
					return leftValue < rightValue;
				case "<=":
					return leftValue <= rightValue;
				case ">":
					return leftValue > rightValue;
				case ">=":
					return leftValue >= rightValue;
				case "<<":
					return leftValue << rightValue;
				case ">>":
					return leftValue >> rightValue;
				case ">>>":
					return leftValue >>> rightValue;
				case "+":
					return leftValue + rightValue;
				case "-":
					return leftValue - rightValue;
				case "*":
					return leftValue * rightValue;
				case "/":
					return leftValue / rightValue;
				case "%":
					return leftValue % rightValue;
				case "|":
					return leftValue | rightValue;
				case "^":
					return leftValue ^ rightValue;
				case "&":
					return leftValue & rightValue;
				case "in":
					return leftValue in rightValue;
				case "instanceof":
					return leftValue instanceof rightValue;
				default:
					this.throwError(Messages.BinaryOperatorSyntaxError, node.operator, node);
			}
		};
	}

	// a && b
	logicalExpressionHandler(node: ESTree.LogicalExpression): BaseClosure {
		const leftExpression = this.create(node.left);
		const rightExpression = this.create(node.right);

		return () => {
			let leftValue;
			let rightValue;

			switch (node.operator) {
				case "||":
					leftValue = leftExpression();
					if (leftValue instanceof Throw) {
						return leftValue;
					}

					if (leftValue) {
						return leftValue;
					}

					rightValue = rightExpression();

					if (rightValue instanceof Throw) {
						return rightValue;
					}

					return rightValue;
				case "&&":
					leftValue = leftExpression();
					if (leftValue instanceof Throw) {
						return leftValue;
					}

					if (!leftValue) {
						return leftValue;
					}

					rightValue = rightExpression();

					if (rightValue instanceof Throw) {
						return rightValue;
					}

					return rightValue;
				default:
					this.throwError(Messages.LogicalOperatorSyntaxError, node.operator, node);
			}
		};
	}

	// typeof a !a()
	unaryExpressionHandler(node: ESTree.UnaryExpression): BaseClosure {
		switch (node.operator) {
			case "typeof":
				if (node.argument.type === "Identifier" || node.argument.type === "Literal") {
					const expression = this.create(node.argument);
					return () => {
						const ret = expression();
						// typeof adfffd => undefined
						if (ret instanceof Throw) {
							return "undefined";
						}
						return typeof ret;
					};
				}
			case "delete":
				const objectGetter = this.createObjectGetter(node.argument);
				const nameGetter = this.createNameGetter(node.argument);

				return () => {
					let obj = objectGetter();
					const name = nameGetter();

					if (obj instanceof Throw) {
						return obj;
					}

					if (name instanceof Throw) {
						return name;
					}

					// catch null.x undefined.xx ...
					const throwError = this.safeObjectGet(obj, name, node);
					if (throwError instanceof Throw) {
						return throwError;
					}

					// for typeof undefined var
					// typeof adf9ad
					if (node.operator === "typeof") {
						return typeof obj[name];
					} else {
						return delete obj[name];
					}
				};
			default:
				const expression = this.create(node.argument);

				return () => {
					const value = expression();
					if (value instanceof Throw) {
						return value;
					}

					switch (node.operator) {
						case "-":
							return -value;
						case "+":
							return +value;
						case "!":
							return !value;
						case "~":
							return ~value;
						case "void":
							return void value;
						default:
							this.throwError(Messages.UnaryOperatorSyntaxError, node.operator, node);
					}
				};
		}
	}

	// ++a --a
	updateExpressionHandler(node: ESTree.UpdateExpression): BaseClosure {
		const objectGetter = this.createObjectGetter(node.argument);
		const nameGetter = this.createNameGetter(node.argument);
		return () => {
			const obj = objectGetter();
			const name = nameGetter();

			if (obj instanceof Throw) {
				return obj;
			}

			if (name instanceof Throw) {
				return name;
			}

			const throwError = this.assertVariable(obj, name, node);
			if (throwError) {
				return throwError;
			}

			// assert null.ab undefiend.ac ... error
			const throwError2 = this.safeObjectGet(obj, name, node);
			if (throwError2 instanceof Throw) {
				return throwError2;
			}

			switch (node.operator) {
				case "++":
					return node.prefix ? ++obj[name] : obj[name]++;
				case "--":
					return node.prefix ? --obj[name] : obj[name]--;
				default:
					this.throwError(Messages.UpdateOperatorSyntaxError, node.operator, node);
			}
		};
	}

	// var o = {a: 1, b: 's', get name(){}, ...}
	objectExpressionHandler(node: ESTree.ObjectExpression) {
		const items: {
			key: string;
		}[] = [];

		function getKey(keyNode: ESTree.Expression): string {
			if (keyNode.type === "Identifier") {
				// var o = {a:1}
				return keyNode.name;
			} else if (keyNode.type === "Literal") {
				// var o = {"a":1}
				return keyNode.value as string;
			} else {
				return this.throwError(Messages.ObjectStructureSyntaxError, keyNode.type, keyNode);
			}
		}
		// collect value, getter, and/or setter.
		const properties: {
			[prop: string]: {
				init?: Getter;
				get?: Getter;
				set?: Getter;
			};
		} = Object.create(null);

		node.properties.forEach(property => {
			const kind = property.kind;
			const key = getKey(property.key);

			if (!properties[key] || kind === "init") {
				properties[key] = {};
			}

			properties[key][kind] = this.create(property.value);

			items.push({
				key,
			});
		});

		return () => {
			const result = {};
			const len = items.length;

			for (let i = 0; i < len; i++) {
				const item = items[i];
				const key = item.key;
				const kinds = properties[key];
				const value = kinds.init ? kinds.init() : undefined;
				const getter = kinds.get ? kinds.get() : function() {};
				const setter = kinds.set ? kinds.set() : function(a: any) {};

				if (value instanceof Throw) {
					return value;
				}

				if ("set" in kinds || "get" in kinds) {
					const descriptor = {
						configurable: true,
						enumerable: true,
						get: getter,
						set: setter,
					};
					Object.defineProperty(result, key, descriptor);
				} else {
					result[key] = value;
				}
			}

			return result;
		};
	}

	// [1,2,3]
	arrayExpressionHandler(node: ESTree.ArrayExpression) {
		const items: Array<BaseClosure> = node.elements.map(element => this.create(element));

		return () => {
			const result: any[] = [];
			const len = items.length;

			for (let i = 0; i < len; i++) {
				const item = items[i];
				const ret = item();

				if (ret instanceof Throw) {
					return ret;
				}

				result.push(ret);
			}

			return result;
		};
	}

	safeObjectGet(obj: any, key: any, node: Node) {
		try {
			return obj[key];
		} catch (e) {
			return new Throw(new TypeError(e.message));
		}
	}

	createCallFunctionGetter(node: Node & { start?: number; end?: number }) {
		switch (node.type) {
			case "MemberExpression":
				const objectGetter = this.create(node.object);
				const keyGetter = this.createMemberKeyGetter(node);
				return () => {
					const obj = objectGetter();
					const key = keyGetter();
					const func = this.safeObjectGet(obj, key, node);

					if (obj instanceof Throw) {
						return obj;
					}

					if (key instanceof Throw) {
						return key;
					}

					if (func instanceof Throw) {
						return func;
					}

					if (!func || !isFunction(func)) {
						const name = this.source.slice(node.start, node.end);
						return this.createThrowError(
							Messages.FunctionUndefinedReferenceError,
							name,
							node
						);
					}

					// method call
					// tips:
					// test.call(ctx, ...) === test.call.bind(test)(ctx, ...)
					// test.apply(ctx, ...) === test.apply.bind(test)(ctx, ...)
					// test.f(...) === test.f.bind(test)(...)
					// ...others
					return func.bind(obj);
				};
			default:
				const closure = this.create(node);
				return () => {
					const name: string = (<ESTree.Identifier>node).name;
					const func = closure();

					if (func instanceof Throw) {
						return func;
					}

					if (!func || !isFunction(func)) {
						return this.createThrowError(
							Messages.FunctionUndefinedReferenceError,
							name,
							node
						);
					}

					// function call
					// this = rootContext
					// tips:
					// test(...) === test.call(this.rootContext, ...)
					return func.bind(this.rootContext);
				};
		}
	}

	// func()
	callExpressionHandler(node: ESTree.CallExpression): BaseClosure {
		const funcGetter = this.createCallFunctionGetter(node.callee);
		const argsGetter = node.arguments.map(arg => this.create(arg));
		return () => {
			const func = funcGetter();

			if (func instanceof Throw) {
				return func;
			}

			const len = argsGetter.length;
			const args: any[] = [];
			for (let i = 0; i < len; i++) {
				const arg = argsGetter[i];
				const result = arg();

				if (result instanceof Throw) {
					return result;
				}

				args.push(result);
			}

			return func(...args);
		};
	}

	// var f = function() {...}
	functionExpressionHandler(
		node:
			| (ESTree.FunctionExpression & { start?: number; end?: number })
			| (ESTree.FunctionDeclaration & { start?: number; end?: number })
	) {
		const self = this;
		const oldDecls = this.collectDeclarations;
		this.collectDeclarations = {};
		const name = node.id ? node.id.name : "";
		const paramLength = node.params.length;

		const paramsGetter = node.params.map(param => this.createParamNameGetter(param));
		// set scope
		const bodyGetter = this.create(node.body);

		const declarations = this.collectDeclarations;

		this.collectDeclarations = oldDecls;

		return () => {
			// bind current scope
			const runtimeScope = self.getCurrentScope();

			function func(...args: any[]) {
				self.callStack.push(`${name}${self.getNodePosition(node)}`);

				const prevScope = self.getCurrentScope();
				const currentScope = createScope(runtimeScope, name);
				self.setCurrentScope(currentScope);

				self.addDeclarationsToScope(declarations, currentScope);
				// init arguments var
				currentScope.data["arguments"] = arguments;
				paramsGetter.forEach((getter, i) => {
					currentScope.data[getter()] = args[i];
				});

				// init this
				const prevContext = self.getCurrentContext();
				//for ThisExpression
				self.setCurrentContext(this);

				const result = bodyGetter();

				//reset
				self.setCurrentContext(prevContext);
				self.setCurrentScope(prevScope);

				self.callStack.pop();

				if (result instanceof Throw) {
					return result;
				}

				if (result instanceof Return) {
					return result.value;
				}
			}

			Object.defineProperty(func, FunctionLengthSymbol, {
				value: paramLength,
				writable: false,
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, FunctionNameSymbol, {
				value: name,
				writable: false,
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, isFunctionSymbol, {
				value: true,
				writable: false,
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, "toString", {
				value: () => {
					return this.source.slice(node.start, node.end);
				},
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, "valueOf", {
				value: () => {
					return this.source.slice(node.start, node.end);
				},
				configurable: false,
				enumerable: false,
			});

			return func;
		};
	}

	// new Ctrl()
	newExpressionHandler(node: ESTree.NewExpression): BaseClosure {
		const expression = this.create(node.callee);
		const args = node.arguments.map(arg => this.create(arg));

		return () => {
			const construct = expression();

			if (construct instanceof Throw) {
				return construct;
			}

			if (!isFunction(construct)) {
				const callee = <ESTree.Expression & { start?: number; end?: number }>node.callee;
				const name = this.source.slice(callee.start, callee.end);
				return new Throw(new TypeError(name + " is not a constructor"));
			}

			const len = args.length;
			const params: any[] = [];
			for (let i = 0; i < len; i++) {
				const arg = args[i];
				const result = arg();

				if (result instanceof Throw) {
					return result;
				}

				params.push(result);
			}

			try {
				return new construct(...params);
			} catch (e) {
				return new Throw(e);
			}
		};
	}

	// a.b a['b']
	memberExpressionHandler(node: ESTree.MemberExpression): BaseClosure {
		var objectGetter = this.create(node.object);
		var keyGetter = this.createMemberKeyGetter(node);
		return () => {
			const obj = objectGetter();
			let key = keyGetter();

			if (obj instanceof Throw) {
				return obj;
			}

			if (key instanceof Throw) {
				return key;
			}

			// get function.length
			if (obj && obj[isFunctionSymbol] && key === "length") {
				key = FunctionLengthSymbol;
			}
			// get function.name
			if (obj && obj[isFunctionSymbol] && key === "name") {
				key = FunctionNameSymbol;
			}
			// return obj[key];

			return this.safeObjectGet(obj, key, node);
		};
	}

	//this
	thisExpressionHandler(node: ESTree.ThisExpression): BaseClosure {
		return () => this.getCurrentContext();
	}

	// var1,var2,...
	sequenceExpressionHandler(node: ESTree.SequenceExpression): BaseClosure {
		const expressions = node.expressions.map(item => this.create(item));

		return () => {
			let result: any;
			const len = expressions.length;

			for (let i = 0; i < len; i++) {
				const expression = expressions[i];
				result = expression();
				if (result instanceof Throw) {
					return result;
				}
			}

			return result;
		};
	}

	// 1 'name'
	literalHandler(
		node: ESTree.Literal & { regex?: { pattern: string; flags: string } }
	): BaseClosure {
		return () => {
			if (node.regex) {
				return new RegExp(node.regex.pattern, node.regex.flags);
			}

			return node.value;
		};
	}

	// var1 ...
	identifierHandler(node: ESTree.Identifier): BaseClosure {
		return () => {
			const currentScope = this.getCurrentScope();
			const data = this.getScopeDataFromName(node.name, currentScope);

			const throwError = this.assertVariable(data, node.name, node);
			if (throwError) {
				return throwError;
			}

			return data[node.name];
		};
	}

	// a=1 a+=2
	assignmentExpressionHandler(node: ESTree.AssignmentExpression): BaseClosure {
		// var s = function(){}
		// s.name === s
		if (
			node.left.type === "Identifier" &&
			node.right.type === "FunctionExpression" &&
			!node.right.id
		) {
			node.right.id = {
				type: "Identifier",
				name: node.left.name,
			};
		}

		const dataGetter = this.createObjectGetter(node.left);
		const nameGetter = this.createNameGetter(node.left);
		const rightValueGetter = this.create(node.right);

		return () => {
			const data = dataGetter();
			const name = nameGetter();
			const rightValue = rightValueGetter();

			if (data instanceof Throw) {
				return data;
			}

			if (name instanceof Throw) {
				return name;
			}

			// catch null.xx
			let value = this.safeObjectGet(data, name, node); // data[name];
			if (value instanceof Throw) {
				return value;
			}

			if (rightValue instanceof Throw) {
				return rightValue;
			}

			if (node.operator !== "=") {
				// asdsad(undefined) += 1
				const throwError = this.assertVariable(data, name, node);
				if (throwError) {
					return throwError;
				}
			} else {
				// name = asdfdff(undefined);
				// if (rightValue instanceof Throw) {
				// 	return rightValue;
				// }
			}

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
					this.throwError(Messages.AssignmentExpressionSyntaxError, node.type, node);
			}

			data[name] = value;

			return value;
		};
	}

	// function test(){}
	functionDeclarationHandler(node: ESTree.FunctionDeclaration): BaseClosure {
		if (node.id) {
			this.funcDeclaration(node.id.name, this.functionExpressionHandler(node));
		}
		return () => {
			return EmptyStatementReturn;
		};
	}

	getVariableName(node: ESTree.Pattern) {
		if (node.type === "Identifier") {
			return node.name;
		} else {
			this.throwError(Messages.VariableTypeSyntaxError, node.type, node);
		}
	}

	// var i;
	// var i=1;
	variableDeclarationHandler(node: ESTree.VariableDeclaration): BaseClosure {
		let assignmentsClosure: BaseClosure;
		const assignments: Array<ESTree.AssignmentExpression> = [];
		for (let i = 0; i < node.declarations.length; i++) {
			const decl = node.declarations[i];
			this.varDeclaration(this.getVariableName(decl.id));
			if (decl.init) {
				assignments.push({
					type: "AssignmentExpression",
					operator: "=",
					left: decl.id,
					right: decl.init,
				});
			}
		}

		if (assignments.length) {
			assignmentsClosure = this.create({
				type: "BlockStatement",
				body: (assignments as unknown) as ESTree.Statement[],
			});
		}

		return () => {
			if (assignmentsClosure) {
				this.isVarDeclMode = true;
				const ret = assignmentsClosure();
				this.isVarDeclMode = false;

				if (ret instanceof Throw) {
					return ret;
				}
			}

			return EmptyStatementReturn;
		};
	}

	assertVariable(data: ScopeData, name: string, node: Node): Throw | null {
		if (data === this.rootScope.data && !(name in data)) {
			return this.createThrowError(Messages.VariableUndefinedReferenceError, name, node);
		}

		return null;
	}

	// {...}
	programHandler(node: ESTree.Program | ESTree.BlockStatement): BaseClosure {
		// const currentScope = this.getCurrentScope();
		const stmtClosures: Array<BaseClosure> = (node.body as Node[]).map((stmt: Node) => {
			// if (stmt.type === "EmptyStatement") return null;
			return this.create(stmt);
		});

		return () => {
			let result: any = EmptyStatementReturn;
			for (let i = 0; i < stmtClosures.length; i++) {
				const stmtClosure = stmtClosures[i];

				// save last value
				const ret = this.setValue(stmtClosure());

				// if (!stmtClosure) continue;
				// EmptyStatement
				if (ret === EmptyStatementReturn) continue;

				result = ret;

				// BlockStatement: break label;  continue label; for(){ break ... }
				// ReturnStatement: return xx;
				if (
					result instanceof Return ||
					result instanceof BreakLabel ||
					result instanceof ContinueLabel ||
					result instanceof Throw ||
					result instanceof Interrupt ||
					result === Break ||
					result === Continue
				) {
					break;
				}
			}

			// save last value
			return result;
		};
	}
	// all expression: a+1 a&&b a() a.b ...
	expressionStatementHandler(node: ESTree.ExpressionStatement): BaseClosure {
		return this.create(node.expression);
	}
	emptyStatementHandler(node: Node): BaseClosure {
		return () => EmptyStatementReturn;
	}

	// return xx;
	returnStatementHandler(node: ESTree.ReturnStatement): BaseClosure {
		const argumentClosure = node.argument ? this.create(node.argument) : noop;

		return () => {
			return new Return(argumentClosure());
		};
	}

	// if else
	ifStatementHandler(node: ESTree.IfStatement | ESTree.ConditionalExpression): BaseClosure {
		const testClosure = this.create(node.test);
		const consequentClosure = this.create(node.consequent);
		const alternateClosure = node.alternate
			? this.create(node.alternate)
			: /*!important*/ () => EmptyStatementReturn;
		return () => {
			const tr = testClosure();

			if (tr instanceof Throw) {
				return tr;
			}

			return tr ? consequentClosure() : alternateClosure();
		};
	}
	// test() ? true : false
	conditionalExpressionHandler(node: ESTree.ConditionalExpression): BaseClosure {
		return this.ifStatementHandler(node);
	}
	// for(var i = 0; i < 10; i++) {...}
	forStatementHandler(
		node: ESTree.ForStatement | ESTree.WhileStatement | ESTree.DoWhileStatement
	): BaseClosure {
		let initClosure = noop;
		let testClosure = node.test ? this.create(node.test) : () => true;
		let updateClosure = noop;
		const bodyClosure = this.create(node.body);

		if (node.type === "ForStatement") {
			initClosure = node.init ? this.create(node.init) : initClosure;
			updateClosure = node.update ? this.create(node.update) : initClosure;
		}

		return pNode => {
			let labelName: string | undefined;
			let result: any = EmptyStatementReturn;
			let shouldInitExec = node.type === "DoWhileStatement";

			if (pNode && pNode.type === "LabeledStatement") {
				labelName = pNode.label.name;
			}

			let ur: any;
			let tr: any;
			const initResult: any = initClosure();
			if (initResult instanceof Throw) {
				return initResult;
			}

			for (; shouldInitExec || (tr = testClosure()); ur = updateClosure()) {
				shouldInitExec = false;

				if (ur && ur instanceof Throw) {
					return ur;
				}

				if (tr && tr instanceof Throw) {
					return tr;
				}

				// save last value
				const ret = this.setValue(bodyClosure());

				// Important: never return Break or Continue!
				if (ret === EmptyStatementReturn || ret === Continue) continue;
				if (ret === Break) {
					break;
				}

				result = ret;

				// stop continue label
				if (result instanceof ContinueLabel && result.value === labelName) {
					result = EmptyStatementReturn;
					continue;
				}

				if (
					result instanceof Return ||
					result instanceof BreakLabel ||
					result instanceof ContinueLabel ||
					result instanceof Throw ||
					result instanceof Interrupt
				) {
					break;
				}
			}

			return result;
		};
	}

	// while(1) {...}
	whileStatementHandler(node: ESTree.WhileStatement): BaseClosure {
		return this.forStatementHandler(node);
	}
	doWhileStatementHandler(node: ESTree.DoWhileStatement): BaseClosure {
		return this.forStatementHandler(node);
	}
	forInStatementHandler(node: ESTree.ForInStatement): BaseClosure {
		// for( k in obj) or for(o.k in obj) ...
		let left = node.left;
		const rightClosure = this.create(node.right);
		const bodyClosure = this.create(node.body);
		// for(var k in obj) {...}
		if (node.left.type === "VariableDeclaration") {
			// init var k
			this.create(node.left)();
			// reset left
			// for( k in obj)
			left = node.left.declarations[0].id;
		}

		return pNode => {
			let labelName: string | undefined;
			let result: any = EmptyStatementReturn;
			let x: string;

			if (pNode && pNode.type === "LabeledStatement") {
				labelName = pNode.label.name;
			}

			const data = rightClosure();

			if (data instanceof Throw) {
				return data;
			}

			for (x in data) {
				// assign left to scope
				// k = x
				// o.k = x
				const ar = this.assignmentExpressionHandler({
					type: "AssignmentExpression",
					operator: "=",
					left: left as ESTree.Pattern,
					right: {
						type: "Literal",
						value: x,
					},
				})();

				if (ar instanceof Throw) {
					return ar;
				}

				// save last value
				const ret = this.setValue(bodyClosure());

				// Important: never return Break or Continue!
				if (ret === EmptyStatementReturn || ret === Continue) continue;
				if (ret === Break) {
					break;
				}

				result = ret;

				// stop continue label
				if (result instanceof ContinueLabel && result.value === labelName) {
					result = EmptyStatementReturn;
					continue;
				}

				if (
					result instanceof Return ||
					result instanceof BreakLabel ||
					result instanceof ContinueLabel ||
					result instanceof Throw ||
					result instanceof Interrupt
				) {
					break;
				}
			}

			return result;
		};
	}
	withStatementHandler(node: ESTree.WithStatement): BaseClosure {
		const objectClosure = this.create(node.object);
		const bodyClosure = this.create(node.body);

		return () => {
			const currentScope = this.getCurrentScope();
			const newScope = createScope(currentScope, "with");

			const data = objectClosure();

			if (data instanceof Throw) {
				return data;
			}
			// newScope.data = data;
			// copy all property
			for (var k in data) {
				newScope.data[k] = data[k];
			}

			this.setCurrentScope(newScope);

			// save last value
			const result = this.setValue(bodyClosure());

			this.setCurrentScope(currentScope);

			return result;
		};
	}

	throwStatementHandler(node: ESTree.ThrowStatement): BaseClosure {
		const argumentClosure = this.create(node.argument);

		return () => {
			const error = argumentClosure();

			if (error instanceof Throw) {
				return error;
			}

			return new Throw(error);
		};
	}

	// try{...}catch(e){...}finally{}
	tryStatementHandler(node: ESTree.TryStatement): BaseClosure {
		// const callStack = [].concat(this.callStack);
		const blockClosure = this.create(node.block);
		const handlerClosure = node.handler ? this.catchClauseHandler(node.handler) : null;
		const finalizerClosure = node.finalizer ? this.create(node.finalizer) : null;

		return () => {
			let result: any = EmptyStatementReturn;
			let ret: any;

			/**
			 * try{...}catch(e){...}finally{...} execution sequence:
			 * try stmt
			 * try throw
			 * catch stmt
			 * finally stmt
			 * finally throw or finally return
			 * catch throw or catch return or try return
			 */

			// try{
			result = this.setValue(blockClosure());

			if (result instanceof Interrupt) {
				return result;
			}

			if (result instanceof Return) {
				ret = result;
			}
			// }
			// catch (e) {
			if (handlerClosure) {
				if (result instanceof Throw) {
					result = this.setValue(handlerClosure(result.value));

					if (result instanceof Interrupt) {
						return result;
					}

					if (result instanceof Return || result instanceof Throw) {
						ret = result;
					}
				}
			}
			// } finally {
			if (finalizerClosure) {
				result = this.setValue(finalizerClosure());

				if (result instanceof Interrupt) {
					return result;
				}

				if (result instanceof Return) {
					return result;
				}

				if (result instanceof Throw) {
					return result;
				}
			}
			// }

			if (ret) {
				return ret;
			}

			this.setValue(result);

			return result;
		};
	}
	// ... catch(e){...}
	catchClauseHandler(node: ESTree.CatchClause): (e: Error) => any {
		const paramNameGetter = this.createParamNameGetter(node.param);
		const bodyClosure = this.create(node.body);

		return (e: Error) => {
			let result: any;
			const currentScope = this.getCurrentScope();
			const scopeData = currentScope.data;
			// get param name "e"
			const paramName = paramNameGetter();
			const isInScope: boolean = hasOwnProperty.call(scopeData, paramName); //paramName in scopeData;
			// save "e"
			const oldValue = scopeData[paramName];
			// add "e" to scope
			scopeData[paramName] = e;
			// run
			result = bodyClosure();

			// reset "e"
			if (isInScope) {
				scopeData[paramName] = oldValue;
			} else {
				//unset
				delete scopeData[paramName];
			}

			return result;
		};
	}
	continueStatementHandler(node: ESTree.ContinueStatement): BaseClosure {
		return () => (node.label ? new ContinueLabel(node.label.name) : Continue);
	}
	breakStatementHandler(node: ESTree.BreakStatement): BaseClosure {
		return () => (node.label ? new BreakLabel(node.label.name) : Break);
	}
	switchStatementHandler(node: ESTree.SwitchStatement): BaseClosure {
		const discriminantClosure = this.create(node.discriminant);
		const caseClosures = node.cases.map(item => this.switchCaseHandler(item));
		return () => {
			const value = discriminantClosure();

			if (value instanceof Throw) {
				return value;
			}

			let match = false;
			let result: any;
			let ret: any, defaultCase: CaseItem | undefined;

			for (let i = 0; i < caseClosures.length; i++) {
				const item = caseClosures[i]();
				const test = item.testClosure();

				if (test instanceof Throw) {
					return test;
				}

				if (test === DefaultCase) {
					defaultCase = item;
					continue;
				}

				if (match || test === value) {
					match = true;
					ret = this.setValue(item.bodyClosure());

					// Important: never return Break or Continue!
					if (ret === EmptyStatementReturn) continue;
					if (ret === Break || ret === Continue) {
						break;
					}

					result = ret;

					if (
						result instanceof Return ||
						result instanceof BreakLabel ||
						result instanceof ContinueLabel ||
						result instanceof Throw ||
						value instanceof Interrupt
					) {
						break;
					}
				}
			}

			if (!match && defaultCase) {
				ret = this.setValue(defaultCase.bodyClosure());

				// Important: never return Break or Continue!
				if (ret === EmptyStatementReturn || ret === Break || ret === Continue) {
					//...
				} else {
					result = ret;
				}
			}

			return result;
		};
	}

	switchCaseHandler(node: ESTree.SwitchCase): SwitchCaseClosure {
		const testClosure = node.test ? this.create(node.test) : () => DefaultCase;
		const bodyClosure = this.create({
			type: "BlockStatement",
			body: node.consequent,
		});

		return () => ({
			testClosure,
			bodyClosure,
		});
	}

	// label: xxx
	labeledStatementHandler(node: ESTree.LabeledStatement): BaseClosure {
		const labelName = node.label.name;
		const bodyClosure = this.create(node.body);

		return () => {
			let result: any;
			const currentScope = this.getCurrentScope();
			currentScope.labelStack.push(labelName);

			result = bodyClosure(node);

			// stop break label
			if (result instanceof BreakLabel && result.value === labelName) {
				result = EmptyStatementReturn;
			}

			currentScope.labelStack.pop();

			return result;
		};
	}

	// get es3/5 param name
	createParamNameGetter(node: ESTree.Pattern): ReturnStringClosure {
		if (node.type === "Identifier") {
			return () => node.name;
		} else {
			this.throwError(Messages.ParamTypeSyntaxError, node.type, node);
		}
	}

	createObjectKeyGetter(node: ESTree.Expression): Getter {
		let getter: Getter;
		// var obj = { title: "" }
		if (node.type === "Identifier") {
			getter = () => node.name;
		} else {
			// Literal or ...
			// var obj = { "title": "" } or others...
			getter = this.create(node);
		}

		return function() {
			return getter();
		};
	}

	createMemberKeyGetter(node: ESTree.MemberExpression): Getter {
		// s['a'];  node.computed = true
		// s.foo;  node.computed = false
		return node.computed
			? this.create(node.property)
			: this.createObjectKeyGetter(node.property);
	}

	// for UnaryExpression UpdateExpression AssignmentExpression
	createObjectGetter(node: ESTree.Expression | ESTree.Pattern): Getter {
		switch (node.type) {
			case "Identifier":
				return () => this.getScopeDataFromName(node.name, this.getCurrentScope());
			case "MemberExpression":
				return this.create(node.object);
			default:
				this.throwError(Messages.AssignmentTypeSyntaxError, node.type, node);
		}
	}

	// for UnaryExpression UpdateExpression AssignmentExpression
	createNameGetter(node: ESTree.Expression | ESTree.Pattern): Getter {
		switch (node.type) {
			case "Identifier":
				return () => node.name;
			case "MemberExpression":
				return this.createMemberKeyGetter(node);
			default:
				this.throwError(Messages.AssignmentTypeSyntaxError, node.type, node);
		}
	}

	varDeclaration(name: string): void {
		const context = this.collectDeclarations;
		if (!hasOwnProperty.call(context, name)) {
			context[name] = undefined;
		}
	}

	funcDeclaration(name: string, func: () => any): void {
		const context = this.collectDeclarations;
		if (!hasOwnProperty.call(context, name) || context[name] === undefined) {
			context[name] = func;
		}
	}

	addDeclarationsToScope(declarations: CollectDeclarations, scope: Scope) {
		const scopeData = scope.data;
		const isRootScope = this.rootScope === scope;
		for (var key in declarations) {
			if (
				hasOwnProperty.call(declarations, key) &&
				(isRootScope ? !(key in scopeData) : !hasOwnProperty.call(scopeData, key))
			) {
				const value = declarations[key];
				scopeData[key] = value ? value() : value;
			}
		}
	}

	getScopeValue(name: string, startScope: Scope): any {
		const scope = this.getScopeFromName(name, startScope);
		return scope.data[name];
	}

	getScopeDataFromName(name: string, startScope: Scope) {
		return this.getScopeFromName(name, startScope).data;
	}

	getScopeFromName(name: string, startScope: Scope) {
		let scope: Scope | null = startScope;

		do {
			if (hasOwnProperty.call(scope.data, name)) {
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

	setValue(value: any) {
		const isFunctionCall = this.callStack.length;

		if (
			this.isVarDeclMode ||
			isFunctionCall ||
			value === EmptyStatementReturn ||
			value === Break ||
			value === Continue ||
			value instanceof BreakLabel ||
			value instanceof ContinueLabel ||
			value instanceof Throw ||
			value instanceof Interrupt
		) {
			return value;
		}

		this.value = value instanceof Return ? value.value : value;

		return value;
	}

	getValue() {
		return this.value;
	}
}
