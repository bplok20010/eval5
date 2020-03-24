function _typeof(obj) {
	"@babel/helpers - typeof";
	if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
		_typeof = function _typeof(obj) {
			return typeof obj;
		};
	} else {
		_typeof = function _typeof(obj) {
			return obj &&
				typeof Symbol === "function" &&
				obj.constructor === Symbol &&
				obj !== Symbol.prototype
				? "symbol"
				: typeof obj;
		};
	}
	return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

function _defineProperties(target, props) {
	for (var i = 0; i < props.length; i++) {
		var descriptor = props[i];
		descriptor.enumerable = descriptor.enumerable || false;
		descriptor.configurable = true;
		if ("value" in descriptor) descriptor.writable = true;
		Object.defineProperty(target, descriptor.key, descriptor);
	}
}

function _createClass(Constructor, protoProps, staticProps) {
	if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	if (staticProps) _defineProperties(Constructor, staticProps);
	return Constructor;
}

function _createSuper(Derived) {
	return function() {
		var Super = _getPrototypeOf(Derived),
			result;
		if (_isNativeReflectConstruct()) {
			var NewTarget = _getPrototypeOf(this).constructor;
			result = Reflect.construct(Super, arguments, NewTarget);
		} else {
			result = Super.apply(this, arguments);
		}
		return _possibleConstructorReturn(this, result);
	};
}

function _possibleConstructorReturn(self, call) {
	if (call && (_typeof(call) === "object" || typeof call === "function")) {
		return call;
	}
	return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
	if (self === void 0) {
		throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	}
	return self;
}

function _isNativeReflectConstruct() {
	if (typeof Reflect === "undefined" || !Reflect.construct) return false;
	if (Reflect.construct.sham) return false;
	if (typeof Proxy === "function") return true;
	try {
		Date.prototype.toString.call(Reflect.construct(Date, [], function() {}));
		return true;
	} catch (e) {
		return false;
	}
}

function _getPrototypeOf(o) {
	_getPrototypeOf = Object.setPrototypeOf
		? Object.getPrototypeOf
		: function _getPrototypeOf(o) {
				return o.__proto__ || Object.getPrototypeOf(o);
		  };
	return _getPrototypeOf(o);
}

function _inherits(subClass, superClass) {
	if (typeof superClass !== "function" && superClass !== null) {
		throw new TypeError("Super expression must either be null or a function");
	}
	subClass.prototype = Object.create(superClass && superClass.prototype, {
		constructor: { value: subClass, writable: true, configurable: true },
	});
	if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
	_setPrototypeOf =
		Object.setPrototypeOf ||
		function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};
	return _setPrototypeOf(o, p);
}

var TodoApp = /*#__PURE__*/ (function(_React$Component) {
	_inherits(TodoApp, _React$Component);

	var _super = _createSuper(TodoApp);

	function TodoApp(props) {
		var _this;

		_classCallCheck(this, TodoApp);

		_this = _super.call(this, props);
		_this.state = {
			items: [],
			text: "",
		};
		_this.handleChange = _this.handleChange.bind(_assertThisInitialized(_this));
		_this.handleSubmit = _this.handleSubmit.bind(_assertThisInitialized(_this));
		return _this;
	}

	_createClass(TodoApp, [
		{
			key: "render",
			value: function render() {
				return /*#__PURE__*/ React.createElement(
					"div",
					null,
					/*#__PURE__*/ React.createElement("h3", null, "TODO"),
					/*#__PURE__*/ React.createElement(TodoList, {
						items: this.state.items,
					}),
					/*#__PURE__*/ React.createElement(
						"form",
						{
							onSubmit: this.handleSubmit,
						},
						/*#__PURE__*/ React.createElement(
							"label",
							{
								htmlFor: "new-todo",
							},
							"What needs to be done?"
						),
						/*#__PURE__*/ React.createElement("input", {
							id: "new-todo",
							onChange: this.handleChange,
							value: this.state.text,
						}),
						/*#__PURE__*/ React.createElement(
							"button",
							null,
							"Add #",
							this.state.items.length + 1
						)
					)
				);
			},
		},
		{
			key: "handleChange",
			value: function handleChange(e) {
				this.setState({
					text: e.target.value,
				});
			},
		},
		{
			key: "handleSubmit",
			value: function handleSubmit(e) {
				e.preventDefault();

				if (this.state.text.length === 0) {
					return;
				}

				var newItem = {
					text: this.state.text,
					id: Date.now(),
				};
				this.setState(function(state) {
					return {
						items: state.items.concat(newItem),
						text: "",
					};
				});
			},
		},
	]);

	return TodoApp;
})(React.Component);

var TodoList = /*#__PURE__*/ (function(_React$Component2) {
	_inherits(TodoList, _React$Component2);

	var _super2 = _createSuper(TodoList);

	function TodoList() {
		_classCallCheck(this, TodoList);

		return _super2.apply(this, arguments);
	}

	_createClass(TodoList, [
		{
			key: "render",
			value: function render() {
				return /*#__PURE__*/ React.createElement(
					"ul",
					null,
					this.props.items.map(function(item) {
						return /*#__PURE__*/ React.createElement(
							"li",
							{
								key: item.id,
							},
							item.text
						);
					})
				);
			},
		},
	]);

	return TodoList;
})(React.Component);

ReactDOM.render(
	/*#__PURE__*/ React.createElement(TodoApp, null),
	document.getElementById("example")
);
