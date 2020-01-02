import * as ESTree from "estree";

export { ESTree };

export type Node =
	| ESTree.Node
	| ESTree.BinaryExpression
	| ESTree.LogicalExpression
	| ESTree.UnaryExpression
	| ESTree.UpdateExpression
	| ESTree.ObjectExpression
	| ESTree.ArrayExpression
	| ESTree.CallExpression
	| ESTree.NewExpression
	| ESTree.MemberExpression
	| ESTree.ThisExpression
	| ESTree.SequenceExpression
	| ESTree.Literal
	| ESTree.Identifier
	| ESTree.AssignmentExpression
	| ESTree.FunctionDeclaration
	| ESTree.VariableDeclaration
	| ESTree.BlockStatement
	| ESTree.Program
	| ESTree.ExpressionStatement
	| ESTree.EmptyStatement
	| ESTree.ReturnStatement
	| ESTree.FunctionExpression
	| ESTree.IfStatement
	| ESTree.ConditionalExpression
	| ESTree.ForStatement
	| ESTree.WhileStatement
	| ESTree.DoWhileStatement
	| ESTree.ForInStatement
	| ESTree.WithStatement
	| ESTree.ThrowStatement
	| ESTree.TryStatement
	| ESTree.ContinueStatement
	| ESTree.BreakStatement
	| ESTree.SwitchStatement
	| ESTree.SwitchCase
	| ESTree.LabeledStatement;
