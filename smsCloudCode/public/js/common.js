$(document).ready(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");
	var currentUser = Parse.User.current();
	$(".top-bar").load("header.html", function(){
		if(currentUser){
			// Logged in
			$("#user-name").html(currentUser.get("email"));   
			// Show logout button
			$(".log-button").html("Logout");
		}
		else{
			// Not logged in. Show the login button. 
			$("#user-name").html("");
			$(".log-button").html("Login");
		}   
	  	
	});
    	// userText.innerHTML = "BLAHBLAH";
		// makeTopBar()
	
	function logout(){
    	Parse.User.logOut();
    	window.location = "/index.html";
  	}
  	$(".logout").click(function(){
		alert("Logged out!");
		logout();
	})

	$(".credits").load("footer.html");
	//Still need to authenticate user
})