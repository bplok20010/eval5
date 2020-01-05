const vm = require("vm");

const ret = vm.runInNewContext(
	`
       function t(){
        try {
            // 56;
            // throw 0
        } catch (e) {
            // 99
        } finally {
            console.log(2);
            89;
            return 345
        }
        }
        t()
        `,
	{ console },
	{ timeout: 115 }
);

console.log(ret);
