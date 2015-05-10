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
	
$(document).ready(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");
	var currentUser = Parse.User.current();


	// // Insane function to keep input windows from resizing on mobile
	// $("input").focus(function(){
	// 	// var height = $("body").css("height");
	// 	$("html").css("height", 3000);
	// })

    function sendMeText() {

        var user = Parse.User.current();
        var number;
        if(!user){
          number = prompt("Please enter your phone number", "Phone Number");
          formatNumber(number).then(function(obj){
          	number = obj;
          });
          // parse phone number
        }
        else{
	        number = user.get("phone");
        }
        var text = "A new message has washed up on shore...";

        Parse.Cloud.run('sendSMS',
        {
            'msgbody' : text,
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

    /* formatNumber(number) -- formats a number into the form +15556666. Returns a promise w/the formatted number, or an error

*/
	


	$(".top-bar").load("header.html", function(){
		if(currentUser){
			// Logged in 
			// Show logout button
			$(".log-button").html("Logout");
			$(".log-button").addClass("log-out");
			$(".log-button").removeClass("log-in");
			$(".signup-column").addClass("hidden-element");
			// compensate for invisible signup button
			$(".log-column").addClass("small-offset-6");
			$(".log-column").removeClass("small-offset-2");
		}
		else{
			// Not logged in. Show the login button. 
			// $("#user-name").html("");
			$(".log-button").html("Login");
			$(".log-button").addClass("log-in");
			$(".log-button").removeClass("log-out");
			$(".signup-column").removeClass("hidden-element");
			// set proper padding for both buttons
			$(".log-column").removeClass("small-offset-6");
			$(".log-column").addClass("small-offset-2");
		}   

		$(".log-out").click(function(){
			alert("Logged out!");
			logout();
		})

		$(".log-in").click(function(){
			window.location = "/login.html";
		})
		$(".signup-button").click(function(){
			window.location = "/signup.html";
		})

		function logout(){
	    	Parse.User.logOut();
	    	window.location = "/index.html";
	  	}

	  	$(".reminder").click(function(){
    		sendMeText();
    		alert("Hurling a bottle into the ocean...");
  		})
	});

	// loads footer
	$(".credits").load("footer.html");
	//Still need to authenticate user
})