import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("NewExpression", () => {
	const { people, People } = evaluate(
		`
function People(name, age){
  this.name = name;
}

d = {
  people: new People("eval5", 12),
  People: People
};
  `
	);

	// constructor
	deepEqual(People.length, 2);
	deepEqual(People.name, "People");

	// entity
	deepEqual(true, people instanceof People);
	deepEqual(people.name, "eval5");
	deepEqual(true, people.constructor === People);
});

test("NewExpression for built-in functions", () => {
	const { array, date, regexp } = evaluate(
		`
    var array = new Array(1, 2, 3);
    var date = new Date();
    var regexp = new RegExp('abc');

   d =  {
      array: array,
      date: date,
      regexp: regexp
    }
  `
	);

	deepEqual(array.length, 3);
	deepEqual(true, date <= new Date());
	deepEqual(true, regexp instanceof RegExp);
});

test("NewExpression for constructor function which return object", () => {
	const { o, p } = evaluate(
		`
    var o = {
      a: 1
    }

    function P() {
      this.name = 1

      return o
    }

    var p = new P()

    d= {
      o: o,
      p: p
    }
    `
	);

	deepEqual(o, p);
});
