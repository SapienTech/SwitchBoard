$(function(){
	Parse.initialize(PARSE_ID, PARSE_MASTER_KEY);

	$(document).keydown(function(e){
		var key = e.which;
		if(key==13){
			$("#submit-button").click();
		}
	});


	$('#submit-button').click(function(){
		var username = $('#email').val();
		var password = $('#password').val();
		Parse.User.logIn(username, password,{}).then(
			function(user){
				window.location = "/discover.html";
			}, function(user, error){
				alert("Incorrect username and/or password.");
			});
		});
});
