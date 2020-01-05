export const Messages: {
	[type: string]: [number, string];
} = {
	UnknownError: [3001, "%0"],
	ExecutionTimeOutError: [3002, "Script execution timed out after %0ms"],
	NodeTypeSyntaxError: [1001, "Unknown node type: %0"],
	BinaryOperatorSyntaxError: [1002, "Unknown binary operator: %0"],
	LogicalOperatorSyntaxError: [1003, "Unknown logical operator: %0"],
	UnaryOperatorSyntaxError: [1004, "Unknown unary operator: %0"],
	UpdateOperatorSyntaxError: [1005, "Unknown update operator: %0"],
	ObjectStructureSyntaxError: [1006, "Unknown object structure: %0"],
	AssignmentExpressionSyntaxError: [1007, "Unknown assignment expression: %0"],
	VariableTypeSyntaxError: [1008, "Unknown variable type: %0"],
	ParamTypeSyntaxError: [1009, "Unknown param type: %0"],
	AssignmentTypeSyntaxError: [1010, "Unknown assignment type: %0"],
	FunctionUndefinedReferenceError: [2001, "%0 is not a function"],
	VariableUndefinedReferenceError: [2002, "%0 is not defined"],
};
