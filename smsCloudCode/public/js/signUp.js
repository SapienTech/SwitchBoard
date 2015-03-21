$(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");

	// Variables
	var introText = "Welcome to SMS in a Bottle!";

	/*signUp*/
	function signUp(){
		var user = new Parse.User();
		var username = $('#email').val();
		var email = username;
		var phone = $('#phone').val();
		var password = $('#password').val();
		user.set("username", username);
		user.set("email", email);
		
		user.set("password", password);
		user.set("groups", ["#trico"]);

		// First format the number
		formatNumber(phone).then(function(newNumber){
			user.set("phone", newNumber);
			return Parse.Promise.as("Success");
		}).then(function(obj){
			// Then call signup
			return user.signUp(null,{});
		}).then(function(obj){
			// Then make a user
			return makePerson(user.get("phone"));
		}).then(function(obj){
			// Then go to new page
			alert("Signed in.");
			sendIntroSMS(user.get("phone"));
			window.location = "/discover.html";
		}, function(error){
			alert(error);
		});
	}

/* formatNumber(number) -- formats a number into the form +15556666. Returns a promise w/the formatted number, or an error

*/
	function formatNumber(number){
		var returnNum = new Parse.Promise();
		var newNumber;
		// If empty, return error parse promise
		if(!number.length){
			returnNum.reject("Phone number is empty.");
			return returnNum;
		}

		//Remove anything that's not a number
		newNumber = number.replace(/\D/g,"");

		//If not a 1 at beginning, add 1.
		if(newNumber.charAt(0)!="1"){
			newNumber = "1" + newNumber;
		}
		
		//If phone number is not 11 digits, throw an error
		if(newNumber.length!=11){
			returnNum.reject("Please enter a valid phone number.");
			return returnNum;
		}
		//Add a plus at the beginning
		newNumber = "+" + newNumber;
		returnNum.resolve(newNumber);
		//return the promise
		return returnNum;
	}


/* makePerson - returns a promise of a saved person.

*/

	function makePerson(phone){
		var Person = Parse.Object.extend("Person");
  		var person = new Person();
  		person.set("number", phone);
  		person.set("groups", ["#trico"]);
  		person.set("busyBool", false);
  		person.set("partner", "");
  		return person.save();
  	}
  		

	function sendIntroSMS(number) {
		Parse.Cloud.run('sendSMS',
		{
		    'msgbody' : introText,
		    'number' : number
		},
  		{
			success: function(result) {
				alert("Does this actually work?");
			},
			error: function(error) {
					alert(error);
				}
		});
	}

	// Set up our event handlers
	$("#submit-button").click(function(){
		signUp();
	});
});
