var libUrl = "https://cdn.jsdelivr.net/npm/angular@latest/angular.min.js";
version.innerHTML = "version: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter(window);
var _init = false;
function run() {
	try {
		!_init && interpreter.evaluate(lib.value);
		_init = true;

		var result = interpreter.evaluate(code.value);
		results.innerHTML = "complete";
		console.log(result);
	} catch (e) {
		console.log(e);
		results.innerHTML = '<div class="error">' + e.message + "</div>";
	}
}

function startRun() {
	results.innerHTML = "parsing...";
	setTimeout(run, 10);
}
main();
function main() {
	results.innerHTML = "loading...";
	runBtn.disabled = true;

	fetch(libUrl)
		.then(res => res.text())
		.then(s => {
			runBtn.disabled = false;

			lib.value = s;
			code.value = `
angular.module('todoApp', [])
  .controller('TodoListController', function() {
    var todoList = this;
    todoList.todos = [
      {text:'learn AngularJS', done:true},
      {text:'build an AngularJS app', done:false}];
 
    todoList.addTodo = function() {
      todoList.todos.push({text:todoList.todoText, done:false});
      todoList.todoText = '';
    };
 
    todoList.remaining = function() {
      var count = 0;
      angular.forEach(todoList.todos, function(todo) {
        count += todo.done ? 0 : 1;
      });
      return count;
    };
 
    todoList.archive = function() {
      var oldTodos = todoList.todos;
      todoList.todos = [];
      angular.forEach(oldTodos, function(todo) {
        if (!todo.done) todoList.todos.push(todo);
      });
    };
  });

            `;

			startRun();
		});
}
