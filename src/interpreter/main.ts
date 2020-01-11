import { parse } from "acorn";
import {
	Messages,
	MessageItem,
	InterruptThrowError,
	InterruptThrowReferenceError,
	InterruptThrowSyntaxError,
} from "./messages";
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

interface Options {
	timeout?: number;
}

interface CollectDeclarations {
	[key: string]: undefined | BaseClosure;
}

type ScopeData = {};

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

function getGlobal() {
	if (typeof self !== "undefined") {
		return self;
	}

	if (typeof window !== "undefined") {
		return window;
	}

	if (typeof global !== "undefined") {
		return global;
	}

	if (typeof this !== "undefined") {
		return this;
	}

	return {};
}
function createScope(parent: Scope | null = null, name?: string): Scope {
	return new Scope({} /* or Object.create(null)? */, parent, name);
}
export class Interpreter {
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
	protected error: Error | null = null;
	protected isVarDeclMode: boolean = false;

	protected lastExecNode: Node | null = null;

	protected execStartTime: number;
	protected execEndTime: number;

	static global = getGlobal();

	constructor(context: Context = Interpreter.global, options: Options = {}) {
		this.options = {
			timeout: options.timeout || 0,
		};

		this.context = context;
		this.callStack = [];
	}

	isInterruptThrow<T>(err: T): boolean {
		return (
			err instanceof InterruptThrowError ||
			err instanceof InterruptThrowReferenceError ||
			err instanceof InterruptThrowSyntaxError
		);
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

		node = parse(code, {
			ranges: true,
			locations: true,
		});

		return this.evaluateNode(node as ESTree.Program, code, ctx);
	}

	evaluateNode(node: ESTree.Program, source: string = "", ctx: Context = this.context) {
		this.initEnvironment(ctx);

		this.source = source;
		this.ast = node;

		const bodyClosure = this.createClosure(node);

		// add declares to data
		this.addDeclarationsToScope(this.collectDeclarations, this.getCurrentScope());

		// reset
		this.collectDeclarations = {};
		// start run
		try {
			bodyClosure();
		} catch (e) {
			throw e;
		} finally {
			this.execEndTime = Date.now();
		}

		return this.getValue();
	}

	getExecutionTime(): number {
		return this.execEndTime - this.execStartTime;
	}

	createErrorMessage(msg: MessageItem, value: string | number, node?: Node): string {
		let message = msg[1].replace("%0", String(value));

		message += this.getNodePosition(node || this.lastExecNode);

		return message;
	}

	createError<T>(message: string, error: { new (msg: string): T }): T {
		return new error(message);
	}

	createThrowError<T>(message: string, error: { new (msg: string): T }): T {
		return this.createError(message, error);
	}

	createInternalThrowError<T extends MessageItem>(msg: T, value: string | number, node?: Node) {
		return this.createError(this.createErrorMessage(msg, value, node), msg[2]);
	}

	protected checkTimeout() {
		const timeout = this.options.timeout || 0;

		const now = Date.now();
		if (now - this.execStartTime > timeout) {
			return true;
		}

		return false;
	}

	getNodePosition(node: (Node & { start?: number; end?: number }) | null) {
		if (node) {
			const errorCode = this.source.slice(node.start, node.end);
			return node.loc ? ` [${node.loc.start.line}:${node.loc.start.column}]${errorCode}` : "";
		}

		return "";
	}

	createClosure(node: Node): BaseClosure {
		const timeout = this.options.timeout;
		let closure;

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
				throw this.createInternalThrowError(Messages.NodeTypeSyntaxError, node.type, node);
		}

		if (timeout && timeout > 0) {
			return (...args: any[]) => {
				if (this.checkTimeout()) {
					throw this.createInternalThrowError(
						Messages.ExecutionTimeOutError,
						timeout,
						node
					);
				}

				this.lastExecNode = node;

				return closure(...args);
			};
		}

		return (...args: any[]) => {
			this.lastExecNode = node;
			return closure(...args);
		};
	}

	// a==b a/b
	binaryExpressionHandler(node: ESTree.BinaryExpression): BaseClosure {
		const leftExpression = this.createClosure(node.left);
		const rightExpression = this.createClosure(node.right);

		return () => {
			const leftValue = leftExpression();
			const rightValue = rightExpression();

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
					throw this.createInternalThrowError(
						Messages.BinaryOperatorSyntaxError,
						node.operator,
						node
					);
			}
		};
	}

	// a && b
	logicalExpressionHandler(node: ESTree.LogicalExpression): BaseClosure {
		const leftExpression = this.createClosure(node.left);
		const rightExpression = this.createClosure(node.right);

		return () => {
			switch (node.operator) {
				case "||":
					return leftExpression() || rightExpression();
				case "&&":
					return leftExpression() && rightExpression();
				default:
					throw this.createInternalThrowError(
						Messages.LogicalOperatorSyntaxError,
						node.operator,
						node
					);
			}
		};
	}

	// typeof a !a()
	unaryExpressionHandler(node: ESTree.UnaryExpression): BaseClosure {
		switch (node.operator) {
			case "delete":
				const objectGetter = this.createObjectGetter(node.argument);
				const nameGetter = this.createNameGetter(node.argument);

				return () => {
					let obj = objectGetter();
					const name = nameGetter();

					return delete obj[name];
				};
			default:
				let expression: BaseClosure;
				// for typeof undefined var
				// typeof adf9ad
				if (node.operator === "typeof" && node.argument.type === "Identifier") {
					const objectGetter = this.createObjectGetter(node.argument);
					const nameGetter = this.createNameGetter(node.argument);

					expression = () => objectGetter()[nameGetter()];
				} else {
					expression = this.createClosure(node.argument);
				}

				return () => {
					const value = expression();

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
						case "typeof":
							return typeof value;
						default:
							throw this.createInternalThrowError(
								Messages.UnaryOperatorSyntaxError,
								node.operator,
								node
							);
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

			this.assertVariable(obj, name, node);

			switch (node.operator) {
				case "++":
					return node.prefix ? ++obj[name] : obj[name]++;
				case "--":
					return node.prefix ? --obj[name] : obj[name]--;
				default:
					throw this.createInternalThrowError(
						Messages.UpdateOperatorSyntaxError,
						node.operator,
						node
					);
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

			properties[key][kind] = this.createClosure(property.value);

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
		//fix: [,,,1,2]
		const items: Array<BaseClosure> = node.elements.map(element =>
			element ? this.createClosure(element) : element
		);

		return () => {
			const len = items.length;
			const result = Array(len);
			for (let i = 0; i < len; i++) {
				const item = items[i];
				if (item) {
					result[i] = item();
				}
			}

			return result;
		};
	}

	safeObjectGet(obj: any, key: any, node: Node) {
		return obj[key];
	}

	createCallFunctionGetter(node: Node & { start?: number; end?: number }) {
		switch (node.type) {
			case "MemberExpression":
				const objectGetter = this.createClosure(node.object);
				const keyGetter = this.createMemberKeyGetter(node);
				return () => {
					const obj = objectGetter();
					const key = keyGetter();
					const func = this.safeObjectGet(obj, key, node);

					if (!func || !isFunction(func)) {
						const name = this.source.slice(node.start, node.end);
						throw this.createInternalThrowError(
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
				const closure = this.createClosure(node);
				return () => {
					const name: string = (<ESTree.Identifier>node).name;
					const func = closure();

					if (!func || !isFunction(func)) {
						throw this.createInternalThrowError(
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
		const argsGetter = node.arguments.map(arg => this.createClosure(arg));
		return () => {
			return funcGetter()(...argsGetter.map(arg => arg()));
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
		const bodyClosure = this.createClosure(node.body);

		const declarations = this.collectDeclarations;

		this.collectDeclarations = oldDecls;

		return () => {
			// bind current scope
			const runtimeScope = self.getCurrentScope();

			function func(...args: any[]) {
				self.callStack.push(`${name}`);

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

				const result = bodyClosure();

				//reset
				self.setCurrentContext(prevContext);
				self.setCurrentScope(prevScope);

				self.callStack.pop();

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
				writable: true,
				configurable: true,
				enumerable: false,
			});
			Object.defineProperty(func, "valueOf", {
				value: () => {
					return this.source.slice(node.start, node.end);
				},
				writable: true,
				configurable: true,
				enumerable: false,
			});

			return func;
		};
	}

	// new Ctrl()
	newExpressionHandler(node: ESTree.NewExpression): BaseClosure {
		const expression = this.createClosure(node.callee);
		const args = node.arguments.map(arg => this.createClosure(arg));

		return () => {
			const construct = expression();

			if (!isFunction(construct)) {
				const callee = <ESTree.Expression & { start?: number; end?: number }>node.callee;
				const name = this.source.slice(callee.start, callee.end);

				throw this.createInternalThrowError(Messages.IsNotConstructor, name, node);
			}

			return new construct(...args.map(arg => arg()));
		};
	}

	// a.b a['b']
	memberExpressionHandler(node: ESTree.MemberExpression): BaseClosure {
		const objectGetter = this.createClosure(node.object);
		const keyGetter = this.createMemberKeyGetter(node);
		return () => {
			const obj = objectGetter();
			let key = keyGetter();

			// get function.length
			if (obj && obj[isFunctionSymbol] && key === "length") {
				key = FunctionLengthSymbol;
			}
			// get function.name
			if (obj && obj[isFunctionSymbol] && key === "name") {
				key = FunctionNameSymbol;
			}

			return obj[key];
		};
	}

	//this
	thisExpressionHandler(node: ESTree.ThisExpression): BaseClosure {
		return () => this.getCurrentContext();
	}

	// var1,var2,...
	sequenceExpressionHandler(node: ESTree.SequenceExpression): BaseClosure {
		const expressions = node.expressions.map(item => this.createClosure(item));

		return () => {
			let result: any;
			const len = expressions.length;

			for (let i = 0; i < len; i++) {
				const expression = expressions[i];
				result = expression();
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

			this.assertVariable(data, node.name, node);

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
		const rightValueGetter = this.createClosure(node.right);

		return () => {
			const data = dataGetter();
			const name = nameGetter();
			const rightValue = rightValueGetter();

			if (node.operator !== "=") {
				// asdsad(undefined) += 1
				this.assertVariable(data, name, node);
			}

			let value = data[name];

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
					throw this.createInternalThrowError(
						Messages.AssignmentExpressionSyntaxError,
						node.type,
						node
					);
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

	getVariableName(node: ESTree.Pattern): never | string {
		if (node.type === "Identifier") {
			return node.name;
		} else {
			throw this.createInternalThrowError(Messages.VariableTypeSyntaxError, node.type, node);
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
			assignmentsClosure = this.createClosure({
				type: "BlockStatement",
				body: (assignments as unknown) as ESTree.Statement[],
			});
		}

		return () => {
			if (assignmentsClosure) {
				this.isVarDeclMode = true;
				assignmentsClosure();
				this.isVarDeclMode = false;
			}

			return EmptyStatementReturn;
		};
	}

	assertVariable(data: ScopeData, name: string, node: Node): void | never {
		if (data === this.rootScope.data && !(name in data)) {
			throw this.createInternalThrowError(
				Messages.VariableUndefinedReferenceError,
				name,
				node
			);
		}
	}

	// {...}
	programHandler(node: ESTree.Program | ESTree.BlockStatement): BaseClosure {
		// const currentScope = this.getCurrentScope();
		const stmtClosures: Array<BaseClosure> = (node.body as Node[]).map((stmt: Node) => {
			// if (stmt.type === "EmptyStatement") return null;
			return this.createClosure(stmt);
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
		return this.createClosure(node.expression);
	}
	emptyStatementHandler(node: Node): BaseClosure {
		return () => EmptyStatementReturn;
	}

	// return xx;
	returnStatementHandler(node: ESTree.ReturnStatement): BaseClosure {
		const argumentClosure = node.argument ? this.createClosure(node.argument) : noop;

		return () => new Return(argumentClosure());
	}

	// if else
	ifStatementHandler(node: ESTree.IfStatement | ESTree.ConditionalExpression): BaseClosure {
		const testClosure = this.createClosure(node.test);
		const consequentClosure = this.createClosure(node.consequent);
		const alternateClosure = node.alternate
			? this.createClosure(node.alternate)
			: /*!important*/ () => EmptyStatementReturn;
		return () => {
			return testClosure() ? consequentClosure() : alternateClosure();
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
		let testClosure = node.test ? this.createClosure(node.test) : () => true;
		let updateClosure = noop;
		const bodyClosure = this.createClosure(node.body);

		if (node.type === "ForStatement") {
			initClosure = node.init ? this.createClosure(node.init) : initClosure;
			updateClosure = node.update ? this.createClosure(node.update) : initClosure;
		}

		return pNode => {
			let labelName: string | undefined;
			let result: any = EmptyStatementReturn;
			let shouldInitExec = node.type === "DoWhileStatement";

			if (pNode && pNode.type === "LabeledStatement") {
				labelName = pNode.label.name;
			}

			for (initClosure(); shouldInitExec || testClosure(); updateClosure()) {
				shouldInitExec = false;

				// save last value
				const ret = this.setValue(bodyClosure());

				// notice: never return Break or Continue!
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
					result instanceof ContinueLabel
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
		const rightClosure = this.createClosure(node.right);
		const bodyClosure = this.createClosure(node.body);
		// for(var k in obj) {...}
		if (node.left.type === "VariableDeclaration") {
			// init var k
			this.createClosure(node.left)();
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

			for (x in data) {
				// assign left to scope
				// k = x
				// o.k = x
				this.assignmentExpressionHandler({
					type: "AssignmentExpression",
					operator: "=",
					left: left as ESTree.Pattern,
					right: {
						type: "Literal",
						value: x,
					},
				})();

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
					result instanceof ContinueLabel
				) {
					break;
				}
			}

			return result;
		};
	}
	withStatementHandler(node: ESTree.WithStatement): BaseClosure {
		const objectClosure = this.createClosure(node.object);
		const bodyClosure = this.createClosure(node.body);

		return () => {
			const currentScope = this.getCurrentScope();
			const newScope = createScope(currentScope, "with");

			const data = objectClosure();

			// newScope.data = data;
			// copy all property
			for (let k in data) {
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
		const argumentClosure = this.createClosure(node.argument);

		return () => {
			throw argumentClosure();
		};
	}

	// try{...}catch(e){...}finally{}
	tryStatementHandler(node: ESTree.TryStatement): BaseClosure {
		const blockClosure = this.createClosure(node.block);
		const handlerClosure = node.handler ? this.catchClauseHandler(node.handler) : null;
		const finalizerClosure = node.finalizer ? this.createClosure(node.finalizer) : null;

		return () => {
			const currentScope = this.getCurrentScope();
			const labelStack = currentScope.labelStack.concat([]);
			const callStack: string[] = this.callStack.concat([]);
			let result: any = EmptyStatementReturn;
			let finalReturn: any;
			let throwError;

			/**
			 * try{...}catch(e){...}finally{...} execution sequence:
			 * try stmt
			 * try throw
			 * catch stmt (if)
			 * finally stmt
			 * finally throw or finally return
			 * catch throw or catch return
			 * try return
			 */

			try {
				result = this.setValue(blockClosure());
				if (result instanceof Return) {
					finalReturn = result;
				}
			} catch (err) {
				currentScope.labelStack = labelStack;
				this.callStack = callStack;

				if (this.isInterruptThrow(err)) {
					throw err;
				}

				if (handlerClosure) {
					try {
						result = this.setValue(handlerClosure(err));
						if (result instanceof Return) {
							finalReturn = result;
						}
					} catch (e) {
						// save catch throw error
						throwError = e;
					}
				}
			}
			// finally {
			if (finalizerClosure) {
				try {
					//do not save finally result
					result = finalizerClosure();
					if (result instanceof Return) {
						finalReturn = result;
					}
					// finalReturn = finalizerClosure();
				} catch (e) {
					// save finally throw error
					throwError = e;
				}

				// if (finalReturn instanceof Return) {
				// 	result = finalReturn;
				// }
			}
			// }

			if (throwError) throw throwError;

			if (finalReturn) {
				return finalReturn;
			}

			return result;
		};
	}
	// ... catch(e){...}
	catchClauseHandler(node: ESTree.CatchClause): (e: Error) => any {
		const paramNameGetter = this.createParamNameGetter(node.param);
		const bodyClosure = this.createClosure(node.body);

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
		const discriminantClosure = this.createClosure(node.discriminant);
		const caseClosures = node.cases.map(item => this.switchCaseHandler(item));
		return () => {
			const value = discriminantClosure();

			let match = false;
			let result: any;
			let ret: any, defaultCase: CaseItem | undefined;

			for (let i = 0; i < caseClosures.length; i++) {
				const item = caseClosures[i]();
				const test = item.testClosure();

				if (test === DefaultCase) {
					defaultCase = item;
					continue;
				}

				if (match || test === value) {
					match = true;
					ret = this.setValue(item.bodyClosure());

					// notice: never return Break or Continue!
					if (ret === EmptyStatementReturn) continue;
					if (ret === Break || ret === Continue) {
						break;
					}

					result = ret;

					if (
						result instanceof Return ||
						result instanceof BreakLabel ||
						result instanceof ContinueLabel
					) {
						break;
					}
				}
			}

			if (!match && defaultCase) {
				ret = this.setValue(defaultCase.bodyClosure());

				const isEBC = ret === EmptyStatementReturn || ret === Break || ret === Continue;
				// notice: never return Break or Continue!
				if (!isEBC) {
					result = ret;
				}
			}

			return result;
		};
	}

	switchCaseHandler(node: ESTree.SwitchCase): SwitchCaseClosure {
		const testClosure = node.test ? this.createClosure(node.test) : () => DefaultCase;
		const bodyClosure = this.createClosure({
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
		const bodyClosure = this.createClosure(node.body);

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
			throw this.createInternalThrowError(Messages.ParamTypeSyntaxError, node.type, node);
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
			getter = this.createClosure(node);
		}

		return function() {
			return getter();
		};
	}

	createMemberKeyGetter(node: ESTree.MemberExpression): Getter {
		// s['a'];  node.computed = true
		// s.foo;  node.computed = false
		return node.computed
			? this.createClosure(node.property)
			: this.createObjectKeyGetter(node.property);
	}

	// for UnaryExpression UpdateExpression AssignmentExpression
	createObjectGetter(node: ESTree.Expression | ESTree.Pattern): Getter {
		switch (node.type) {
			case "Identifier":
				return () => this.getScopeDataFromName(node.name, this.getCurrentScope());
			case "MemberExpression":
				return this.createClosure(node.object);
			default:
				throw this.createInternalThrowError(
					Messages.AssignmentTypeSyntaxError,
					node.type,
					node
				);
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
				throw this.createInternalThrowError(
					Messages.AssignmentTypeSyntaxError,
					node.type,
					node
				);
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
		for (let key in declarations) {
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
			value instanceof ContinueLabel
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
