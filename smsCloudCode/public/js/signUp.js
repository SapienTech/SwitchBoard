$(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");

	// Variables
	var introText = "Welcome to Switchboard! Reply with '#tutorial' to learn more or '#swat your message' to jump right in!";
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
        user.set("tutorial", -1);
   //      if(email.search(/@swarthmore.edu/i) == -1){
			// alert("Please use a valid Swarthmore.edu email address.");
			// return;
   //      }
   //      else{
			// user.set("groups", ["#swat"]);
   //      }
		// First check email is swat email 
        // then checks phone number
        checkEmail(email).then(function(email){
            user.set("username", username);
            user.set("email", email);
            return Parse.Promise.as("Success");
        })
       .then(function(obj){
			return formatNumber(phone);
        }).then(function(newNumber){
            return verifyNumber(newNumber);
        }).then(function(validNumber){
			user.set("phone", validNumber);
			return Parse.Promise.as("Success");
		}).then(function(obj){
			// Then call signup
			user.set("groups", ["#swat"]);
			return user.signUp(null,{});
		}).then(function(obj){
			// Then make a user
			return makePerson(user.get("phone"));
		}).then(function(obj){
			// Then go to new page
			sendIntroSMS(user.get("phone"));
			window.location = "/discover.html";
			alert("Welcome on board! Routing you a text with more info");
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
        var check = new Parse.Query("User");
        check.equalTo("email", email);
        return check.count().then(function(count){
        	if(count){
        		// found a duplicate email
        		returnEmail.reject("This email is already in use.");
        		return returnEmail;
        	}
        	else{
        		returnEmail.resolve(email);
        		return returnEmail;
        	}
        })
    }



/* ensures no phone duplicates
*/
    function verifyNumber(number) { 
		var validNum = new Parse.Promise();
        var validNumber = number;
        var check = new Parse.Query("User");
        check.equalTo("phone", number);
        check.find().then(function(matches) {
            if (matches.length > 0) {
                validNum.reject("This number is already in use.");
            }
            else {
                validNum.resolve(validNumber);
            }
        });
        return validNum;
    }



/* makePerson - returns a promise of a saved person.

*/

	function makePerson(phone){
		var Person = Parse.Object.extend("Person");
  		var person = new Person();
  		person.set("number", phone);
  		person.set("groups", ["#swat"]);
  		person.set("busyBool", false);
  		person.set("partner", "");
        person.set("tutorial", -1);
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

	$(".logout").innerHTML = "HELLO TEST";
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

	// Frivilous shit
	
	$(".quickSorta").click(function(){
		alert("This doesn't go anywhere, but I like the way you think.");
	});

});
