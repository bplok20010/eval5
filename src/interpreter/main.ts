import { parse } from "acorn";
import {
	Messages,
	MessageItem,
	InterruptThrowError,
	InterruptThrowReferenceError,
	InterruptThrowSyntaxError,
} from "./messages";
import { Node, ESTree } from "./nodes";

const version = "%VERSION%";

/////////types/////////
type Getter = () => any;
interface BaseClosure {
	(pNode?: Node): any;
	isFunctionDeclareClosure?: boolean;
}
type CaseItem = {
	testClosure: BaseClosure;
	bodyClosure: BaseClosure;
};
type SwitchCaseClosure = () => CaseItem;
type ReturnStringClosure = () => string;
type ECMA_VERSION = 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020;
interface Options {
	ecmaVersion?: ECMA_VERSION;
	timeout?: number;
	rootContext?: Context | null;
	globalContextInFunction?: any;
	_initEnv?: (this: Interpreter) => void;
}
interface CollectDeclarations {
	[key: string]: undefined | BaseClosure;
}
type ScopeData = {
	[prop: string]: any;
	[prop: number]: any;
};
type Context = {
	[prop: string]: any;
	[prop: number]: any;
};

function defineFunctionName<T>(func: T, name: string) {
	Object.defineProperty(func, "name", {
		value: name,
		writable: false,
		enumerable: false,
		configurable: true,
	});
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
const Break = Symbol("Break");
const Continue = Symbol("Continue");
const DefaultCase = Symbol("DefaultCase");
const EmptyStatementReturn = Symbol("EmptyStatementReturn");
const WithScope = Symbol("WithScope");

function isFunction<T>(func: T): boolean {
	return typeof func === "function";
}

interface GeneratorReflection {
	getOptions(): Readonly<Options>;
	getCurrentScope(): Scope;
	getGlobalScope(): Scope;
	getCurrentContext(): Context;
	getExecStartTime(): number;
}

class InternalInterpreterReflection {
	protected interpreter: Interpreter;
	constructor(interpreter: Interpreter) {
		this.interpreter = interpreter;
	}

	generator(): GeneratorReflection {
		const interpreter = this.interpreter;

		function getCurrentScope(this: Interpreter) {
			return this.getCurrentScope();
		}

		function getGlobalScope(this: Interpreter) {
			return this.getGlobalScope();
		}

		function getCurrentContext(this: Interpreter) {
			return this.getCurrentContext();
		}

		return {
			getOptions: interpreter.getOptions.bind(interpreter),
			getCurrentScope: getCurrentScope.bind(interpreter),
			getGlobalScope: getGlobalScope.bind(interpreter),
			getCurrentContext: getCurrentContext.bind(interpreter),
			getExecStartTime: interpreter.getExecStartTime.bind(interpreter),
		};
	}
}

function internalEval(
	reflection: InternalInterpreterReflection,
	code?: string,
	useGlobalScope: boolean = true
): any {
	if (!(reflection instanceof InternalInterpreterReflection)) {
		throw new Error("Illegal call");
	}

	if (typeof code !== "string") return code;
	if (!code) return void 0;

	const instance = reflection.generator();

	const opts = instance.getOptions();

	const options: Options = {
		timeout: opts.timeout,
		_initEnv: function (this: Interpreter) {
			// set caller context
			if (!useGlobalScope) {
				this.setCurrentContext(instance.getCurrentContext());
			}
			// share timeout
			this.execStartTime = instance.getExecStartTime();
			this.execEndTime = this.execStartTime;
		},
	};

	const currentScope = useGlobalScope ? instance.getGlobalScope() : instance.getCurrentScope();
	const interpreter = new Interpreter(currentScope, options);

	return interpreter.evaluate(code);
}
Object.defineProperty(internalEval, "__IS_EVAL_FUNC", {
	value: true,
	writable: false,
	enumerable: false,
	configurable: false,
});

function internalFunction(
	reflection: InternalInterpreterReflection,
	...params: string[]
): (...args: any[]) => any {
	if (!(reflection instanceof InternalInterpreterReflection)) {
		throw new Error("Illegal call");
	}

	const instance = reflection.generator();

	const code = params.pop();

	const interpreter = new Interpreter(instance.getGlobalScope(), instance.getOptions());

	const wrapCode = `
		    (function anonymous(${params.join(",")}){
		        ${code}
		    });
		    `;

	return interpreter.evaluate(wrapCode);
}
Object.defineProperty(internalFunction, "__IS_FUNCTION_FUNC", {
	value: true,
	writable: false,
	enumerable: false,
	configurable: false,
});

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
/**
 * scope chain
 *
 * superScope
 *     ↓
 * rootScope
 *     ↓
 * globalScope
 *     ↓
 * functionScope
 *
 */
class Scope {
	readonly name: string | undefined | Symbol;
	readonly parent: Scope | null;
	readonly data: ScopeData;
	labelStack: string[];
	constructor(data: ScopeData, parent: Scope | null = null, name?: string | Symbol) {
		this.name = name;
		this.parent = parent;
		this.data = data;
		this.labelStack = [];
	}
}

function noop() {}

function createScope(parent: Scope | null = null, name?: string): Scope {
	return new Scope(Object.create(null), parent, name);
}

function createRootContext(data: Context): Context {
	return Object.create(data);
}

const BuildInObjects: ScopeData = {
	NaN,
	Infinity,
	undefined,
	// null,
	Object,
	Array,
	String,
	Boolean,
	Number,
	Date,
	RegExp,
	Error,
	URIError,
	TypeError,
	RangeError,
	SyntaxError,
	ReferenceError,
	Math,
	parseInt,
	parseFloat,
	isNaN,
	isFinite,
	decodeURI,
	decodeURIComponent,
	encodeURI,
	encodeURIComponent,
	escape,
	unescape,
	eval: internalEval,
	Function: internalFunction,
};
// ES5 Object
if (typeof JSON !== "undefined") {
	BuildInObjects.JSON = JSON;
}

//ES6 Object
if (typeof Promise !== "undefined") {
	BuildInObjects.Promise = Promise;
}

if (typeof Set !== "undefined") {
	BuildInObjects.Set = Set;
}

if (typeof Map !== "undefined") {
	BuildInObjects.Map = Map;
}

if (typeof Symbol !== "undefined") {
	BuildInObjects.Symbol = Symbol;
}

if (typeof Proxy !== "undefined") {
	BuildInObjects.Proxy = Proxy;
}

if (typeof WeakMap !== "undefined") {
	BuildInObjects.WeakMap = WeakMap;
}

if (typeof WeakSet !== "undefined") {
	BuildInObjects.WeakSet = WeakSet;
}

if (typeof Reflect !== "undefined") {
	BuildInObjects.Reflect = Reflect;
}

export class Interpreter {
	static readonly version: string = version;
	static readonly eval = internalEval;
	static readonly Function = internalFunction;
	static ecmaVersion: ECMA_VERSION = 5;
	// alert.call(globalContextInFunction, 1);
	// fix: alert.call({}, 1); // Illegal invocation
	// function func(){
	//     this;// Interpreter.globalContextInFunction
	// }
	// func()
	static globalContextInFunction: any = void 0;
	static global: Context = Object.create(null);

	// last expression value
	protected value: any;
	protected context: Context | Scope;
	protected globalContext: Context;
	protected source: string;
	protected sourceList: string[] = [];
	protected currentScope: Scope;
	protected globalScope: Scope;
	protected currentContext: Context;
	protected options: Options;
	protected callStack: string[];
	protected collectDeclVars: CollectDeclarations = Object.create(null);
	protected collectDeclFuncs: CollectDeclarations = Object.create(null);
	protected isVarDeclMode: boolean = false;

	protected lastExecNode: Node | null = null;

	protected isRunning: boolean = false;
	protected execStartTime: number;
	protected execEndTime: number;

	constructor(context: Context | Scope = Interpreter.global, options: Options = {}) {
		this.options = {
			ecmaVersion: options.ecmaVersion || Interpreter.ecmaVersion,
			timeout: options.timeout || 0,
			rootContext: options.rootContext,
			globalContextInFunction:
				options.globalContextInFunction === undefined
					? Interpreter.globalContextInFunction
					: options.globalContextInFunction,
			_initEnv: options._initEnv,
		};

		this.context = context || Object.create(null);
		this.callStack = [];

		this.initEnvironment(this.context);
	}

	protected initEnvironment(ctx: Context | Scope) {
		let scope: Scope;
		//init global scope
		if (ctx instanceof Scope) {
			scope = ctx;
		} else {
			let rootScope: Scope | null = null;
			const superScope = this.createSuperScope(ctx);

			if (this.options.rootContext) {
				rootScope = new Scope(
					createRootContext(this.options.rootContext),
					superScope,
					"rootScope"
				);
			}

			scope = new Scope(ctx, rootScope || superScope, "globalScope");
		}

		this.globalScope = scope;
		this.currentScope = this.globalScope;
		//init global context to this
		this.globalContext = scope.data;
		this.currentContext = scope.data;
		// collect var/function declare
		this.collectDeclVars = Object.create(null);
		this.collectDeclFuncs = Object.create(null);

		this.execStartTime = Date.now();
		this.execEndTime = this.execStartTime;

		const _initEnv = this.options._initEnv;
		if (_initEnv) {
			_initEnv.call(this);
		}
	}

	getExecStartTime() {
		return this.execStartTime;
	}

	getExecutionTime(): number {
		return this.execEndTime - this.execStartTime;
	}

	setExecTimeout(timeout: number = 0) {
		this.options.timeout = timeout;
	}

	getOptions(): Readonly<Options> {
		return this.options;
	}

	protected getGlobalScope() {
		return this.globalScope;
	}

	protected getCurrentScope() {
		return this.currentScope;
	}

	protected getCurrentContext() {
		return this.currentContext;
	}

	protected isInterruptThrow<T>(err: T): boolean {
		return (
			err instanceof InterruptThrowError ||
			err instanceof InterruptThrowReferenceError ||
			err instanceof InterruptThrowSyntaxError
		);
	}

	protected createSuperScope(ctx: Context): Scope {
		let data: ScopeData = {
			...BuildInObjects,
		};

		const buildInObjectKeys = Object.keys(data);

		buildInObjectKeys.forEach(key => {
			if (key in ctx) {
				delete data[key];
			}
		});

		return new Scope(data, null, "superScope");
	}

	protected setCurrentContext(ctx: Context) {
		this.currentContext = ctx;
	}

	protected setCurrentScope(scope: Scope) {
		this.currentScope = scope;
	}

	evaluate(code: string = "") {
		let node: unknown;

		if (!code) return;

		node = parse(code, {
			ranges: true,
			locations: true,
			ecmaVersion: this.options.ecmaVersion || Interpreter.ecmaVersion,
		});

		return this.evaluateNode(node as ESTree.Program, code);
	}

	appendCode(code: string) {
		return this.evaluate(code);
	}

	protected evaluateNode(node: ESTree.Program, source: string = "") {
		this.value = undefined;
		this.source = source;
		this.sourceList.push(source);

		this.isRunning = true;

		//reset timeout
		this.execStartTime = Date.now();
		this.execEndTime = this.execStartTime;

		// reset
		this.collectDeclVars = Object.create(null);
		this.collectDeclFuncs = Object.create(null);

		const currentScope = this.getCurrentScope();
		const currentContext = this.getCurrentContext();
		const labelStack = currentScope.labelStack.concat([]);
		const callStack: string[] = this.callStack.concat([]);
		const reset = () => {
			this.setCurrentScope(currentScope); //reset scope
			this.setCurrentContext(currentContext); //reset context
			currentScope.labelStack = labelStack; //reset label stack
			this.callStack = callStack; //reset call stack
		};

		// start run
		try {
			const bodyClosure = this.createClosure(node);

			// add declares to data
			this.addDeclarationsToScope(
				this.collectDeclVars,
				this.collectDeclFuncs,
				this.getCurrentScope()
			);

			bodyClosure();
		} catch (e) {
			throw e;
		} finally {
			reset();
			this.execEndTime = Date.now();
		}

		this.isRunning = false;

		return this.getValue();
	}

	protected createErrorMessage(
		msg: MessageItem,
		value: string | number,
		node?: Node | null
	): string {
		let message = msg[1].replace("%0", String(value));

		if (node !== null) {
			message += this.getNodePosition(node || this.lastExecNode);
		}

		return message;
	}

	protected createError<T>(message: string, error: { new (msg: string): T }): T {
		return new error(message);
	}

	protected createThrowError<T>(message: string, error: { new (msg: string): T }): T {
		return this.createError(message, error);
	}

	protected createInternalThrowError<T extends MessageItem>(
		msg: T,
		value: string | number,
		node?: Node | null
	) {
		return this.createError(this.createErrorMessage(msg, value, node), msg[2]);
	}

	protected checkTimeout() {
		if (!this.isRunning) return false;

		const timeout = this.options.timeout || 0;

		const now = Date.now();
		if (now - this.execStartTime > timeout) {
			return true;
		}

		return false;
	}

	protected getNodePosition(node: (Node & { start?: number; end?: number }) | null) {
		if (node) {
			const errorCode = ""; //this.source.slice(node.start, node.end);
			return node.loc ? ` [${node.loc.start.line}:${node.loc.start.column}]${errorCode}` : "";
		}

		return "";
	}

	protected createClosure(node: Node): BaseClosure {
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
			case "DebuggerStatement":
				closure = this.debuggerStatementHandler(node);
				break;
			default:
				throw this.createInternalThrowError(Messages.NodeTypeSyntaxError, node.type, node);
		}

		return (...args: any[]) => {
			const timeout = this.options.timeout;

			if (timeout && timeout > 0 && this.checkTimeout()) {
				throw this.createInternalThrowError(Messages.ExecutionTimeOutError, timeout, null);
			}

			this.lastExecNode = node;

			return closure(...args);
		};
	}

	// a==b a/b
	protected binaryExpressionHandler(node: ESTree.BinaryExpression): BaseClosure {
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
				case "**":
					return Math.pow(leftValue, rightValue);
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
	protected logicalExpressionHandler(node: ESTree.LogicalExpression): BaseClosure {
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

	// protected isRootScope(node: ESTree.Expression | ESTree.Pattern): boolean {
	// 	if (node.type === "Identifier") {
	// 		const scope = this.getScopeFromName(node.name, this.getCurrentScope());
	// 		return scope.name === "rootScope";
	// 	}

	// 	return false;
	// }

	// typeof a !a()
	protected unaryExpressionHandler(node: ESTree.UnaryExpression): BaseClosure {
		switch (node.operator) {
			case "delete":
				const objectGetter = this.createObjectGetter(node.argument);
				const nameGetter = this.createNameGetter(node.argument);

				return () => {
					// not allowed to delete root scope property
					// rootContext has move to prototype chai, so no judgment required
					// if (this.isRootScope(node.argument)) {
					// 	return false;
					// }

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
	protected updateExpressionHandler(node: ESTree.UpdateExpression): BaseClosure {
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

	// var o = {a: 1, b: 's', get name(){}, set name(){}  ...}
	protected objectExpressionHandler(node: ESTree.ObjectExpression) {
		const items: {
			key: string;
			property: ESTree.Property;
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
				init?: BaseClosure;
				get?: BaseClosure;
				set?: BaseClosure;
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
				property,
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
				const getter = kinds.get ? kinds.get() : function () {};
				const setter = kinds.set ? kinds.set() : function (a: any) {};

				if ("set" in kinds || "get" in kinds) {
					const descriptor = {
						configurable: true,
						enumerable: true,
						get: getter,
						set: setter,
					};
					Object.defineProperty(result, key, descriptor);
				} else {
					const property = item.property;
					const kind = property.kind;
					// set function.name
					// var d = { test(){} }
					// var d = { test: function(){} }
					if (
						property.key.type === "Identifier" &&
						property.value.type === "FunctionExpression" &&
						kind === "init" &&
						!property.value.id
					) {
						defineFunctionName(value, property.key.name);
					}

					result[key] = value;
				}
			}

			return result;
		};
	}

	// [1,2,3]
	protected arrayExpressionHandler(node: ESTree.ArrayExpression) {
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

	protected safeObjectGet(obj: any, key: any, node: Node) {
		return obj[key];
	}

	protected createCallFunctionGetter(node: Node & { start?: number; end?: number }) {
		switch (node.type) {
			case "MemberExpression":
				const objectGetter = this.createClosure(node.object);
				const keyGetter = this.createMemberKeyGetter(node);
				const source = this.source;

				return () => {
					const obj = objectGetter();
					const key = keyGetter();
					const func = this.safeObjectGet(obj, key, node);

					if (!func || !isFunction(func)) {
						const name = source.slice(node.start, node.end);
						throw this.createInternalThrowError(
							Messages.FunctionUndefinedReferenceError,
							name,
							node
						);
					}

					// obj.eval = eval
					// obj.eval(...)
					if (func.__IS_EVAL_FUNC) {
						return (code?: string) => {
							return (func as typeof internalEval)(
								new InternalInterpreterReflection(this),
								code,
								true
							);
						};
					}

					// obj.func = Function
					// obj.func(...)
					if (func.__IS_FUNCTION_FUNC) {
						return (...args: string[]) => {
							return (func as typeof internalFunction)(
								new InternalInterpreterReflection(this),
								...args
							);
						};
					}

					// method call
					// eg：obj.say(...)
					// eg: obj.say.call(...)
					// eg: obj.say.apply(...)
					// ======================
					// obj.func(...)
					// func = func.bind(obj)
					// tips:
					// func(...) -> func.bind(obj)(...)
					// func.call(...) -> obj.func.call.bind(obj.func)(...)
					// func.apply(...) -> obj.func.apply.bind(obj.func)(...)
					// ...others
					return func.bind(obj);
				};
			default:
				// test() or (0,test)() or a[1]() ...
				const closure = this.createClosure(node);
				return () => {
					let name: string = "";
					if (node.type === "Identifier") {
						name = node.name;
					}
					// const name: string = (<ESTree.Identifier>node).name;
					const func = closure();

					if (!func || !isFunction(func)) {
						throw this.createInternalThrowError(
							Messages.FunctionUndefinedReferenceError,
							name,
							node
						);
					}

					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
					// var eval = eval;
					// function test(){
					//    eval(...); //note: use local scope in eval5，but in Browser is use global scope
					// }
					if (node.type === "Identifier" && func.__IS_EVAL_FUNC && name === "eval") {
						return (code?: string) => {
							const scope = this.getScopeFromName(name, this.getCurrentScope());
							const useGlobalScope =
								!scope.parent ||
								this.globalScope === scope ||
								scope.name === "rootScope";
							// use local scope if calling eval in super scope
							return (func as typeof internalEval)(
								new InternalInterpreterReflection(this),
								code,
								!useGlobalScope
							);
						};
					}
					// use global scope
					// var g_eval = eval;
					// g_eval("a+1");
					//(0,eval)(...) ...eval alias
					if (func.__IS_EVAL_FUNC) {
						return (code?: string) => {
							return (func as typeof internalEval)(
								new InternalInterpreterReflection(this),
								code,
								true
							);
						};
					}

					// Function('a', 'b', 'return a+b')
					if (func.__IS_FUNCTION_FUNC) {
						return (...args: string[]) => {
							return (func as typeof internalFunction)(
								new InternalInterpreterReflection(this),
								...args
							);
						};
					}

					let ctx = this.options.globalContextInFunction;
					// with(obj) {
					//     test() // test.call(obj, ...)
					// }
					if (node.type === "Identifier") {
						const scope = this.getIdentifierScope(node);
						if (scope.name === WithScope) {
							ctx = scope.data;
						}
					}

					// function call
					// this = undefined
					// tips:
					// test(...) === test.call(undefined, ...)
					// fix: alert.call({}, ...) Illegal invocation
					return func.bind(ctx);
				};
		}
	}

	// func()
	protected callExpressionHandler(node: ESTree.CallExpression): BaseClosure {
		const funcGetter = this.createCallFunctionGetter(node.callee);
		const argsGetter = node.arguments.map(arg => this.createClosure(arg));
		return () => {
			return funcGetter()(...argsGetter.map(arg => arg()));
		};
	}

	// var f = function() {...}
	protected functionExpressionHandler(
		node:
			| (ESTree.FunctionExpression & { start?: number; end?: number })
			| (ESTree.FunctionDeclaration & { start?: number; end?: number })
	): BaseClosure {
		const self = this;
		const source = this.source;
		const oldDeclVars = this.collectDeclVars;
		const oldDeclFuncs = this.collectDeclFuncs;
		this.collectDeclVars = Object.create(null);
		this.collectDeclFuncs = Object.create(null);
		const name = node.id ? node.id.name : ""; /**anonymous*/
		const paramLength = node.params.length;

		const paramsGetter = node.params.map(param => this.createParamNameGetter(param));
		// set scope
		const bodyClosure = this.createClosure(node.body);

		const declVars = this.collectDeclVars;
		const declFuncs = this.collectDeclFuncs;

		this.collectDeclVars = oldDeclVars;
		this.collectDeclFuncs = oldDeclFuncs;

		return () => {
			// bind current scope
			const runtimeScope = self.getCurrentScope();

			const func = function (...args: any[]) {
				self.callStack.push(`${name}`);

				const prevScope = self.getCurrentScope();
				const currentScope = createScope(runtimeScope, name);
				self.setCurrentScope(currentScope);

				self.addDeclarationsToScope(declVars, declFuncs, currentScope);

				// var t = function(){ typeof t } // function
				// t = function(){ typeof t } // function
				// z = function tx(){ typeof tx } // function
				// but
				// d = { say: function(){ typeof say } } // undefined
				if (name) {
					currentScope.data[name] = func;
				}

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
			};

			defineFunctionName(func, name);

			Object.defineProperty(func, "length", {
				value: paramLength,
				writable: false,
				enumerable: false,
				configurable: true,
			});

			Object.defineProperty(func, "toString", {
				value: () => {
					return source.slice(node.start, node.end);
				},
				writable: true,
				configurable: true,
				enumerable: false,
			});
			Object.defineProperty(func, "valueOf", {
				value: () => {
					return source.slice(node.start, node.end);
				},
				writable: true,
				configurable: true,
				enumerable: false,
			});

			return func;
		};
	}

	// new Ctrl()
	protected newExpressionHandler(node: ESTree.NewExpression): BaseClosure {
		const source = this.source;
		const expression = this.createClosure(node.callee);
		const args = node.arguments.map(arg => this.createClosure(arg));

		return () => {
			const construct = expression();

			if (!isFunction(construct) || construct.__IS_EVAL_FUNC) {
				const callee = <ESTree.Expression & { start?: number; end?: number }>node.callee;
				const name = source.slice(callee.start, callee.end);

				throw this.createInternalThrowError(Messages.IsNotConstructor, name, node);
			}

			// new Function(...)
			if (construct.__IS_FUNCTION_FUNC) {
				return (construct as typeof internalFunction)(
					new InternalInterpreterReflection(this),
					...args.map(arg => arg())
				);
			}

			return new construct(...args.map(arg => arg()));
		};
	}

	// a.b a['b']
	protected memberExpressionHandler(node: ESTree.MemberExpression): BaseClosure {
		const objectGetter = this.createClosure(node.object);
		const keyGetter = this.createMemberKeyGetter(node);
		return () => {
			const obj = objectGetter();
			let key = keyGetter();

			return obj[key];
		};
	}

	//this
	protected thisExpressionHandler(node: ESTree.ThisExpression): BaseClosure {
		return () => this.getCurrentContext();
	}

	// var1,var2,...
	protected sequenceExpressionHandler(node: ESTree.SequenceExpression): BaseClosure {
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
	protected literalHandler(
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
	protected identifierHandler(node: ESTree.Identifier): BaseClosure {
		return () => {
			const currentScope = this.getCurrentScope();
			const data = this.getScopeDataFromName(node.name, currentScope);

			this.assertVariable(data, node.name, node);

			return data[node.name];
		};
	}

	protected getIdentifierScope(node: ESTree.Identifier) {
		const currentScope = this.getCurrentScope();

		const scope = this.getScopeFromName(node.name, currentScope);

		return scope;
	}

	// a=1 a+=2
	protected assignmentExpressionHandler(node: ESTree.AssignmentExpression): BaseClosure {
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
				// if a is undefined
				// a += 1
				this.assertVariable(data, name, node);
			}

			switch (node.operator) {
				case "=":
					return (data[name] = rightValue);
				case "+=":
					return (data[name] += rightValue);
				case "-=":
					return (data[name] -= rightValue);
				case "*=":
					return (data[name] *= rightValue);
				// case "**=":
				// data[name]: Getter may be triggered
				// 	return (data[name] = Math.pow(data[name], rightValue));
				case "/=":
					return (data[name] /= rightValue);
				case "%=":
					return (data[name] %= rightValue);
				case "<<=":
					return (data[name] <<= rightValue);
				case ">>=":
					return (data[name] >>= rightValue);
				case ">>>=":
					return (data[name] >>>= rightValue);
				case "&=":
					return (data[name] &= rightValue);
				case "^=":
					return (data[name] ^= rightValue);
				case "|=":
					return (data[name] |= rightValue);
				default:
					throw this.createInternalThrowError(
						Messages.AssignmentExpressionSyntaxError,
						node.type,
						node
					);
			}
		};
	}

	// function test(){}
	protected functionDeclarationHandler(node: ESTree.FunctionDeclaration): BaseClosure {
		if (node.id) {
			const functionClosure = this.functionExpressionHandler(node);
			Object.defineProperty(functionClosure, "isFunctionDeclareClosure", {
				value: true,
				writable: false,
				configurable: false,
				enumerable: false,
			});
			this.funcDeclaration(node.id.name, functionClosure);
		}
		return () => {
			return EmptyStatementReturn;
		};
	}

	protected getVariableName(node: ESTree.Pattern): never | string {
		if (node.type === "Identifier") {
			return node.name;
		} else {
			throw this.createInternalThrowError(Messages.VariableTypeSyntaxError, node.type, node);
		}
	}

	// var i;
	// var i=1;
	protected variableDeclarationHandler(node: ESTree.VariableDeclaration): BaseClosure {
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
				const oldValue = this.isVarDeclMode;
				this.isVarDeclMode = true;
				assignmentsClosure();
				this.isVarDeclMode = oldValue;
			}

			return EmptyStatementReturn;
		};
	}

	protected assertVariable(data: ScopeData, name: string, node: Node): void | never {
		if (data === this.globalScope.data && !(name in data)) {
			throw this.createInternalThrowError(
				Messages.VariableUndefinedReferenceError,
				name,
				node
			);
		}
	}

	// {...}
	protected programHandler(node: ESTree.Program | ESTree.BlockStatement): BaseClosure {
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
	protected expressionStatementHandler(node: ESTree.ExpressionStatement): BaseClosure {
		return this.createClosure(node.expression);
	}
	protected emptyStatementHandler(node: Node): BaseClosure {
		return () => EmptyStatementReturn;
	}

	// return xx;
	protected returnStatementHandler(node: ESTree.ReturnStatement): BaseClosure {
		const argumentClosure = node.argument ? this.createClosure(node.argument) : noop;

		return () => new Return(argumentClosure());
	}

	// if else
	protected ifStatementHandler(
		node: ESTree.IfStatement | ESTree.ConditionalExpression
	): BaseClosure {
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
	protected conditionalExpressionHandler(node: ESTree.ConditionalExpression): BaseClosure {
		return this.ifStatementHandler(node);
	}
	// for(var i = 0; i < 10; i++) {...}
	protected forStatementHandler(
		node: ESTree.ForStatement | ESTree.WhileStatement | ESTree.DoWhileStatement
	): BaseClosure {
		let initClosure = noop;
		let testClosure = node.test ? this.createClosure(node.test) : () => true;
		let updateClosure = noop;
		const bodyClosure = this.createClosure(node.body);

		if (node.type === "ForStatement") {
			initClosure = node.init ? this.createClosure(node.init) : initClosure;
			updateClosure = node.update ? this.createClosure(node.update) : noop;
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
	protected whileStatementHandler(node: ESTree.WhileStatement): BaseClosure {
		return this.forStatementHandler(node);
	}
	protected doWhileStatementHandler(node: ESTree.DoWhileStatement): BaseClosure {
		return this.forStatementHandler(node);
	}
	protected forInStatementHandler(node: ESTree.ForInStatement): BaseClosure {
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
	protected withStatementHandler(node: ESTree.WithStatement): BaseClosure {
		const objectClosure = this.createClosure(node.object);
		const bodyClosure = this.createClosure(node.body);

		return () => {
			const data = objectClosure() as ScopeData;
			const currentScope = this.getCurrentScope();
			const newScope = new Scope(data, currentScope, WithScope);

			// const data = objectClosure();
			// copy all properties
			// for (let k in data) {
			// 	newScope.data[k] = data[k];
			// }

			this.setCurrentScope(newScope);

			// save last value
			const result = this.setValue(bodyClosure());

			this.setCurrentScope(currentScope);

			return result;
		};
	}

	protected throwStatementHandler(node: ESTree.ThrowStatement): BaseClosure {
		const argumentClosure = this.createClosure(node.argument);

		return () => {
			this.setValue(undefined);
			throw argumentClosure();
		};
	}

	// try{...}catch(e){...}finally{}
	protected tryStatementHandler(node: ESTree.TryStatement): BaseClosure {
		const blockClosure = this.createClosure(node.block);
		const handlerClosure = node.handler ? this.catchClauseHandler(node.handler) : null;
		const finalizerClosure = node.finalizer ? this.createClosure(node.finalizer) : null;

		return () => {
			const currentScope = this.getCurrentScope();
			const currentContext = this.getCurrentContext();
			const labelStack = currentScope.labelStack.concat([]);
			const callStack: string[] = this.callStack.concat([]);
			let result: any = EmptyStatementReturn;
			let finalReturn: any;
			let throwError: any;

			const reset = () => {
				this.setCurrentScope(currentScope); //reset scope
				this.setCurrentContext(currentContext); //reset context
				currentScope.labelStack = labelStack; //reset label stack
				this.callStack = callStack; //reset call stack
			};

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
				reset();

				if (this.isInterruptThrow(err)) {
					throw err;
				}

				if (handlerClosure) {
					try {
						result = this.setValue(handlerClosure(err));
						if (result instanceof Return) {
							finalReturn = result;
						}
					} catch (err) {
						reset();

						if (this.isInterruptThrow(err)) {
							throw err;
						}

						// save catch throw error
						throwError = err;
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
				} catch (err) {
					reset();

					if (this.isInterruptThrow(err)) {
						throw err;
					}

					// save finally throw error
					throwError = err;
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
	protected catchClauseHandler(node: ESTree.CatchClause): (e: Error) => any {
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
	protected continueStatementHandler(node: ESTree.ContinueStatement): BaseClosure {
		return () => (node.label ? new ContinueLabel(node.label.name) : Continue);
	}
	protected breakStatementHandler(node: ESTree.BreakStatement): BaseClosure {
		return () => (node.label ? new BreakLabel(node.label.name) : Break);
	}
	protected switchStatementHandler(node: ESTree.SwitchStatement): BaseClosure {
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

					// notice: never return Break!
					if (ret === EmptyStatementReturn) continue;
					if (ret === Break) {
						break;
					}

					result = ret;

					if (
						result instanceof Return ||
						result instanceof BreakLabel ||
						result instanceof ContinueLabel ||
						result === Continue
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

	protected switchCaseHandler(node: ESTree.SwitchCase): SwitchCaseClosure {
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
	protected labeledStatementHandler(node: ESTree.LabeledStatement): BaseClosure {
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

	protected debuggerStatementHandler(node: ESTree.DebuggerStatement): BaseClosure {
		return () => {
			debugger;
			return EmptyStatementReturn;
		};
	}

	// get es3/5 param name
	protected createParamNameGetter(node: ESTree.Pattern): ReturnStringClosure {
		if (node.type === "Identifier") {
			return () => node.name;
		} else {
			throw this.createInternalThrowError(Messages.ParamTypeSyntaxError, node.type, node);
		}
	}

	protected createObjectKeyGetter(node: ESTree.Expression): Getter {
		let getter: Getter;
		// var obj = { title: "" }
		if (node.type === "Identifier") {
			getter = () => node.name;
		} else {
			// Literal or ...
			// var obj = { "title": "" } or others...
			getter = this.createClosure(node);
		}

		return function () {
			return getter();
		};
	}

	protected createMemberKeyGetter(node: ESTree.MemberExpression): Getter {
		// s['a'];  node.computed = true
		// s.foo;  node.computed = false
		return node.computed
			? this.createClosure(node.property)
			: this.createObjectKeyGetter(node.property);
	}

	// for UnaryExpression UpdateExpression AssignmentExpression
	protected createObjectGetter(node: ESTree.Expression | ESTree.Pattern): Getter {
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
	protected createNameGetter(node: ESTree.Expression | ESTree.Pattern): Getter {
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

	protected varDeclaration(name: string): void {
		const context = this.collectDeclVars;
		context[name] = undefined;
	}

	protected funcDeclaration(name: string, func: () => any): void {
		const context = this.collectDeclFuncs;
		context[name] = func;
	}

	protected addDeclarationsToScope(
		declVars: CollectDeclarations,
		declFuncs: CollectDeclarations,
		scope: Scope
	) {
		const scopeData = scope.data;

		for (let key in declFuncs) {
			const value = declFuncs[key];
			scopeData[key] = value ? value() : value;
		}

		for (let key in declVars) {
			if (!(key in scopeData)) {
				scopeData[key] = void 0;
			}
		}
	}

	protected getScopeValue(name: string, startScope: Scope): any {
		const scope = this.getScopeFromName(name, startScope);
		return scope.data[name];
	}

	protected getScopeDataFromName(name: string, startScope: Scope) {
		return this.getScopeFromName(name, startScope).data;
	}

	protected getScopeFromName(name: string, startScope: Scope) {
		let scope: Scope | null = startScope;

		do {
			if (name in scope.data) {
				//if (hasOwnProperty.call(scope.data, name)) {
				return scope;
			}
		} while ((scope = scope.parent));

		return this.globalScope;
	}

	protected setValue(value: any) {
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
