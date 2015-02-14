$(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");

	// Variables
	var introText = "Welcome to SMS in a Bottle!";

	// Functions
	function signUp(){
		var user = new Parse.User();
		var username = $('#email').val();
		var email = username;
		var phone = $('#phone').val();
		var password = $('#password').val();

		user.set("username", username);
		user.set("email", email);
		user.set("phone", phone);
		user.set("password", password);
		user.set("groups", ["#trico", 0]);

		user.signUp(null,{}).then(function(user){
			alert("Signed in.");
			sendIntroSMS(phone);
			window.location = "/discover.html";
		}, function(error){
			alert(error.code + " " + error.message);
		}
  		).then(function(user){
  			makePerson(phone);
  		}, function(error){
  			alert("error creating user");
  			alert(error.code + " " + error.message);
		});
	}

	function makePerson(phone){
		var Person = Parse.Object.extend("Person");
  		var person = new Person();
  		person.set("number", phone);
  		person.set("groups", ["#trico", 0]);
  		person.set("partner", "+13109987101");
  		person.save();
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
