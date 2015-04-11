$(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");

	// Variables
	var introText = "Welcome to SMS in a Bottle!";
	var currentUser = Parse.User.current();
	if(currentUser){
		window.location = "/discover.html";
	}

	// If they're logged in, redirect


	/*signUp*/
	function signUp(){
		var user = new Parse.User();
		var username = $('#email').val();
		var email = username;
		var phone = $('#phone').val();
		var password = $('#password').val();
		user.set("busyBool", false);
		user.set("password", password);
		user.set("groups", ["#swat"]);

		// First check email is swat email 
        // then checks phone number
        checkEmail(email).then(function(email){
            user.set("username", username);
            user.set("email", email);
            return Parse.Promise.as("Success");
        }).then(function(obj){
			return formatNumber(phone);
        }).then(function(newNumber){
            return verifyNumber(newNumber);
        }).then(function(validNumber){
			user.set("phone", validNumber);
			return Parse.Promise.as("Success");
		}).then(function(obj){
			// Then call signup
			return user.signUp(null,{});
		}).then(function(obj){
			// Then make a user
			return makePerson(user.get("phone"));
		}).then(function(obj){
			// Then go to new page
			sendIntroSMS(user.get("phone"));
			window.location = "/discover.html";
		}, function(error){
			alert(error);
		});
	}


    function checkEmail(email) {
        var returnEmail = new Parse.Promise();
        var n = email.search(/@swarthmore.edu/i);
        if (n == -1) {
            returnEmail.reject("Not a valid Swarthmore email address");
            return returnEmail;
        }
        returnEmail.resolve(email);
        return returnEmail;
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

/* ensures no phone duplicates, may want to do a phone verify after beta
*/
    function verifyNumber(number) { 
		var validNum = new Parse.Promise();
        var validNumber;
        var check = new Parse.Query("User");
        query.equalTo("phone", number);
        query.find().then(function(matches) {
            if (matches.length > 0) {
                validNum.reject("Phone number already in use");
                return validNum;
            }
            else {
                validNumber = number;
                validNum.resolve(validNumber);
                return validNum;
            }
        }
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
			},
			error: function(error) {
					alert(error);
				}
		});
	}

	// Set up our event handlers
	$(document).keydown(function(e){
		var key = e.which;
		if(key == 13){
			$("#submit-button").click();
		}
	})
	$("#submit-button").click(function(){
		signUp();
	});

});
