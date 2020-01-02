import { parse, Node as AST } from "acorn";
import { Node, ESTree } from "./nodes";

const hasOwnProperty = Object.prototype.hasOwnProperty;
const Break = Symbol("Break");
const Continue = Symbol("Continue");
const DefaultCase = Symbol("DefaultCase");

interface Program extends AST {
	body?: any;
	sourceType?: any;
}

type Getter = () => any;
type BaseClosure = () => any;
type CaseItem = {
	testClosure: BaseClosure;
	bodyClosure: BaseClosure;
};
type SwitchCaseClosure = () => CaseItem;
type ReturnStringClosure = () => string;

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

type ScopeData = {};
type Labels = {};

class Scope {
	name: string;
	parent: Scope | null;
	data: ScopeData;
	labels: Labels;
	currentLabel: string;
	labelStack: string[];
	constructor(data: ScopeData = {}, parent: Scope | null = null, name?: string) {
		this.name = name;
		this.parent = parent;
		this.data = data;
		this.labels = Object.create(null);
		this.labelStack = [];
	}
}

type Context = {};

function noop() {}

function emptyReturn() {}

export default class Interpreter {
	// last expression value
	value: any;
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
			context: options.context || {},
		};
		this.value = undefined;
		this.rootContext = options.context || {};

		if (typeof code === "string") {
			const ast: Program = <Program>parse(code, {
				ranges: true,
				locations: true,
			});
			this.ast = <ESTree.Program>ast;
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

	// a==b a/b
	binaryExpressionHandler(node: ESTree.BinaryExpression): BaseClosure {
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
					throw SyntaxError("Unknown binary operator: " + node.operator);
			}
		};
	}

	// a && b
	logicalExpressionHandler(node: ESTree.LogicalExpression): BaseClosure {
		const leftExpression = this.create(node.left);
		const rightExpression = this.create(node.right);

		return () => {
			switch (node.operator) {
				case "||":
					return leftExpression() || rightExpression();
				case "&&":
					return leftExpression() && rightExpression();
				default:
					throw SyntaxError("Unknown logical operator: " + node.operator);
			}
		};
	}

	// typeof a !a()
	unaryExpressionHandler(node: ESTree.UnaryExpression): BaseClosure {
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
						throw SyntaxError("Unknown unary operator: " + node.operator);
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

			switch (node.operator) {
				case "++":
					return node.prefix ? ++obj[name] : obj[name]++;
				case "--":
					return node.prefix ? --obj[name] : obj[name]--;
				default:
					throw SyntaxError("Unknown update operator: " + node.operator);
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
				return keyNode.name;
			} else if (keyNode.type === "Literal") {
				return keyNode.value as string;
			} else {
				throw SyntaxError("Unknown object structure: " + keyNode.type);
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

			items.forEach(function(item) {
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
			});

			return result;
		};
	}

	// [1,2,3]
	arrayExpressionHandler(node: ESTree.ArrayExpression) {
		const items: Array<() => any> = node.elements.map(element => this.create(element));

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
					// method call
					// tips:
					// test.call(ctx, ...) === test.call.bind(test)(ctx, ...)
					// test.apply(ctx, ...) === test.apply.bind(test)(ctx, ...)
					// test.f(...) === test.f.bind(test)(...)
					// ...others
					return obj[key].bind(obj);
				};
			default:
				const closure = this.create(node);
				return () => {
					// function call
					// this = rootContext
					// tips:
					// test(...) === test.call(this.rootContext, ...)
					return closure().bind(this.rootContext);
				};
		}
	}

	// func()
	callExpressionHandler(node: ESTree.CallExpression): BaseClosure {
		const funcGetter = this.createCallFunctionGetter(node.callee);
		const argsGetter = node.arguments.map(arg => this.create(arg));
		return () => {
			const func = funcGetter();
			const args = argsGetter.map(arg => arg());
			return func(...args);
		};
	}

	// var f = function() {...}
	functionExpressionHandler(node: ESTree.FunctionExpression | ESTree.FunctionDeclaration) {
		const self = this;
		const currentScope = this.getCurrentScope();
		const newScope = new Scope({} /*Object.create(null)*/, currentScope);
		const paramsGetter = node.params.map(param => this.createParamNameGetter(param));
		const paramLength = node.params.length;
		// set scope
		this.setCurrentScope(newScope);
		const bodyGetter = this.create(node.body);
		// restore scope
		this.setCurrentScope(currentScope);
		return () => {
			function func(...args: any[]) {
				// init arguments var
				newScope.data["arguments"] = arguments;
				paramsGetter.forEach((getter, i) => {
					newScope.data[getter()] = args[i];
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
				value: paramLength,
				writable: false,
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, "$name", {
				value: node.id ? node.id.name : "",
				writable: false,
				configurable: false,
				enumerable: false,
			});
			Object.defineProperty(func, "$isFunction", {
				value: true,
				writable: false,
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
			return new construct(...args.map(arg => arg()));
		};
	}

	// a.b a['b']
	memberExpressionHandler(node: ESTree.MemberExpression): BaseClosure {
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
	thisExpressionHandler(node: ESTree.ThisExpression): BaseClosure {
		return () => this.getCurrentContext();
	}

	// var1,var2,...
	sequenceExpressionHandler(node: ESTree.SequenceExpression): BaseClosure {
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
	literalHandler(node: ESTree.Literal): BaseClosure {
		return () => {
			return node.value;
		};
	}

	// var1 ...
	identifierHandler(node: ESTree.Identifier): BaseClosure {
		const currentScope = this.getCurrentScope();

		return () => {
			// console.log(node.name, currentScope, "ssc");
			const data = this.getScopeDataFromName(node.name, currentScope);
			// console.log(data, "ssc data");
			return data[node.name];
		};
	}

	// a=1 a+=2
	assignmentExpressionHandler(node: ESTree.AssignmentExpression): BaseClosure {
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
					throw SyntaxError("Unknown assignment expression: " + node.operator);
			}

			context[name] = value;

			return value;
		};
	}

	// function test(){}
	functionDeclarationHandler(node: ESTree.FunctionDeclaration): BaseClosure {
		this.funcDeclaration(node.id.name, this.functionExpressionHandler(node)());
		return noop;
	}

	getVariableName(node: ESTree.Pattern) {
		if (node.type === "Identifier") {
			return node.name;
		} else {
			throw SyntaxError("Unknown variable type: " + node.type);
		}
	}

	// var i;
	// var i=1;
	variableDeclarationHandler(node: ESTree.VariableDeclaration): BaseClosure {
		const assignments = [];
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
		return () => {
			if (assignments.length) {
				this.create({
					type: "BlockStatement",
					body: assignments,
				})();
			}
		};
	}

	// {...}
	programHandler(node: ESTree.Program | ESTree.BlockStatement): BaseClosure {
		const stmtClosures: Array<BaseClosure> = (node.body as Node[]).map((stmt: Node) => {
			// if (stmt.type === "EmptyStatement") return null;
			return this.create(stmt);
		});

		return () => {
			let result: any = emptyReturn;
			for (let i = 0; i < stmtClosures.length; i++) {
				const stmtClosure = stmtClosures[i];
				const ret = stmtClosure();
				// if (!stmtClosure) continue;
				// EmptyStatement
				if (ret === emptyReturn) continue;
				////BlockStatement: break label;  continue label;
				if (result === Break || result === Continue) {
					break;
				}

				result = ret;
				// return
				if (result instanceof Return) {
					break;
				}
			}

			return result;
		};
	}
	// all expression: a+1 a&&b a() a.b ...
	expressionStatementHandler(node: ESTree.ExpressionStatement): BaseClosure {
		return this.create(node.expression);
	}
	emptyStatementHandler(node: Node): BaseClosure {
		return emptyReturn;
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
			: /*!important*/ () => emptyReturn;
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
		let testClosure = node.test ? this.create(node.test) : () => true;
		let updateClosure = noop;
		const bodyClosure = this.create(node.body);

		if (node.type === "ForStatement") {
			initClosure = node.init ? this.create(node.init) : initClosure;
			updateClosure = node.update ? this.create(node.update) : initClosure;
		}

		return () => {
			let result: any = emptyReturn;
			let shouldInitExec = node.type === "DoWhileStatement";

			for (initClosure(); shouldInitExec || testClosure(); updateClosure()) {
				shouldInitExec = false;

				const ret = bodyClosure();

				// EmptyStatement
				if (ret === emptyReturn || ret === Continue) continue;

				if (ret === Break) {
					break;
				}

				result = ret;

				if (result instanceof Return) {
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

		return () => {
			let result: any = emptyReturn;
			let x: string;
			for (x in rightClosure()) {
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

				const ret = bodyClosure();

				// EmptyStatement
				if (ret === emptyReturn || ret === Continue) continue;

				if (ret === Break) {
					break;
				}

				result = ret;

				if (result instanceof Return) {
					break;
				}
			}

			return result;
		};
	}
	withStatementHandler(node: ESTree.WithStatement): BaseClosure {
		const currentScope = this.getCurrentScope();
		const objectClosure = this.create(node.object);
		const newScope = new Scope({}, currentScope);

		this.setCurrentScope(newScope);
		const bodyClosure = this.create(node.body);
		this.setCurrentScope(currentScope);

		return () => {
			const data = objectClosure();
			// newScope.data = data;
			// copy all property
			for (var k in data) {
				newScope.data[k] = data[k];
			}

			return bodyClosure();
		};
	}
	throwStatementHandler(node: ESTree.ThrowStatement): BaseClosure {
		const argumentClosure = this.create(node.argument);
		return () => {
			throw argumentClosure();
		};
	}
	// try{...}catch(e){...}finally{}
	tryStatementHandler(node: ESTree.TryStatement): BaseClosure {
		const blockClosure = this.create(node.block);
		const handlerClosure = this.catchClauseHandler(node.handler);
		const finalizerClosure = node.finalizer ? this.create(node.finalizer) : null;

		return () => {
			let result: any = emptyReturn;
			let ret: any;
			try {
				ret = blockClosure();
				if (ret !== emptyReturn) {
					result = ret;
				}
			} catch (e) {
				ret = handlerClosure(e);
				if (ret !== emptyReturn) {
					result = ret;
				}
			}

			if (finalizerClosure) {
				ret = finalizerClosure();
				if (ret !== emptyReturn) {
					result = ret;
				}
			}

			return result;
		};
	}
	// ... catch(e){...}
	catchClauseHandler(node: ESTree.CatchClause): (e: Error) => any {
		const currentScope = this.getCurrentScope();
		const paramNameGetter = this.createParamNameGetter(node.param);
		const bodyClosure = this.create(node.body);

		return (e: Error) => {
			let result: any;
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
				delete scopeData[paramName];
			}

			return result;
		};
	}
	continueStatementHandler(node: ESTree.ContinueStatement): BaseClosure {
		return () => Continue;
	}
	breakStatementHandler(node: ESTree.BreakStatement): BaseClosure {
		return () => Break;
	}
	switchStatementHandler(node: ESTree.SwitchStatement): BaseClosure {
		const discriminantClosure = this.create(node.discriminant);
		const caseClosures = node.cases.map(item => this.switchCaseHandler(item));
		return () => {
			const value = discriminantClosure();
			let match = false;
			let result: any;
			let ret: any, defaultCase: CaseItem;

			for (let i = 0; i < caseClosures.length; i++) {
				const item = caseClosures[i]();
				const test = item.testClosure();

				if (test === DefaultCase) {
					defaultCase = item;
					continue;
				}

				if (match || test === value) {
					match = true;
					ret = item.bodyClosure();

					if (ret === Break || ret === Continue || ret instanceof Return) {
						break;
					}

					result = ret;
				}
			}

			if (!match && defaultCase) {
				result = defaultCase.bodyClosure();
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
		//TODO:
		const currentScope = this.getCurrentScope();
		const labelName = node.label.name;
		const bodyClosure = this.create(node.body);

		currentScope.labels[labelName] = bodyClosure;

		return () => {
			let result: any;
			currentScope.labelStack.push(labelName);

			result = bodyClosure();

			currentScope.labelStack.pop();

			return result;
		};
	}

	// get es3/5 param name
	createParamNameGetter(node: ESTree.Pattern): ReturnStringClosure {
		if (node.type === "Identifier") {
			return () => node.name;
		} else {
			throw SyntaxError("Unknown param type: " + node.type);
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
		const currentScope = this.getCurrentScope();

		switch (node.type) {
			case "Identifier":
				return () => this.getScopeDataFromName(node.name, currentScope);
			case "MemberExpression":
				return this.create(node.object);
			default:
				throw SyntaxError("Unknown assignment type: " + node.type);
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
				throw SyntaxError("Unknown assignment type: " + node.type);
		}
	}

	varDeclaration(name: string): void {
		const context = this.getCurrentContext();
		if (!hasOwnProperty.call(context, name)) {
			context[name] = undefined;
		}
	}

	funcDeclaration(name: string, func: () => any): void {
		const context = this.getCurrentContext();
		if (!hasOwnProperty.call(context, name) || context[name] === undefined) {
			context[name] = func;
		}
	}

	getScopeValue(name: string, startScope: Scope): any {
		const scope = this.getScopeFromName(name, startScope);
		return scope.data[name];
	}

	getScopeDataFromName(name: string, startScope: Scope) {
		return this.getScopeFromName(name, startScope).data;
	}

	getScopeFromName(name: string, scope: Scope) {
		const data: ScopeData = scope.data;

		do {
			if (hasOwnProperty.call(data, name)) {
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
}
