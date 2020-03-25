var libUrl = "https://cdn.jsdelivr.net/npm/knockout@3.5.1";
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
var initialData = [
    { firstName: "Danny", lastName: "LaRusso", phones: [
        { type: "Mobile", number: "(555) 121-2121" },
        { type: "Home", number: "(555) 123-4567"}]
    },
    { firstName: "Sensei", lastName: "Miyagi", phones: [
        { type: "Mobile", number: "(555) 444-2222" },
        { type: "Home", number: "(555) 999-1212"}]
    }
];
 
var ContactsModel = function(contacts) {
    var self = this;
    self.contacts = ko.observableArray(ko.utils.arrayMap(contacts, function(contact) {
        return { firstName: contact.firstName, lastName: contact.lastName, phones: ko.observableArray(contact.phones) };
    }));
 
    self.addContact = function() {
        self.contacts.push({
            firstName: "",
            lastName: "",
            phones: ko.observableArray()
        });
    };
 
    self.removeContact = function(contact) {
        self.contacts.remove(contact);
    };
 
    self.addPhone = function(contact) {
        contact.phones.push({
            type: "",
            number: ""
        });
    };
 
    self.removePhone = function(phone) {
        self.contacts().forEach(function(item){
            item.phones.remove(phone)
        })
    };
 
    self.save = function() {
        self.lastSavedJson(JSON.stringify(ko.toJS(self.contacts), null, 2));
    };
 
    self.lastSavedJson = ko.observable("")
};
 
ko.applyBindings(new ContactsModel(initialData), document.getElementById('example'));

            `;

			startRun();
		});
}
