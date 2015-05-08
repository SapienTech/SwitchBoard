$(function(){ 
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");
	var currentUserName;
  // Handlers

  $(".reminder").click(function(){
    sendMeText();
    alert("Hurling a bottle into the ocean...");
  })


  // This returns all of the groups the current user is a member of
  function getMemberGroups(){
    var currentUser = Parse.User.current();
    return currentUser.get("groups");
  }

  function addToGroup(groupName){
		var currentUser = Parse.User.current();
		currentUser.add("groups", groupName);
		currentUser.save().then(function(currentUser){
			var query = new Parse.Query("Person");
			//need to clear up this redundancy
			query.equalTo("number", currentUser.get("phone"));
			query.first().then(function(person){

				person.add("groups", groupName);
				return person.save();	
			});
		});
	}

  function removeFromGroup(groupName){
    var currentUser = Parse.User.current();
    currentUser.remove("groups", groupName);
    currentUser.save().then(function(currentUser){
      var query = new Parse.Query("Person");
      query.equalTo("number", currentUser.get("phone"));
      query.first().then(function(person){
        person.remove("groups", groupName);
        return person.save(); 
      });
    });
  }

    function makeTable(){
      var memberGroups = getMemberGroups();
      var groupsArray;
      var groupsTable = $("#groups-table");

      // Add our global event listener for the entire table:
      groupsTable.on("click","tr", function(event){
        tableClickListener($(this));
      });

      // Grab the groups:
      Parse.Cloud.run("getGroups",{},{}).then(
        function(result){
          groupsArray = result;
        }, 
        function (error){
          alert("Found an error.")

        }).then(function(obj){
          for(var i = 0; i < groupsArray.length; i++){
            group = groupsArray[i];
            if (isInGroup(group)){
              groupsTable.append('<tr class = "joinedRow"><td class = grp>' + group + '</td>' + '<td class = "joined">' + "Joined" + '</td></tr>');
            }
            else{
              groupsTable.append('<tr><td class = grp>' + group + '</td>' + '<td class = "joined">' + "" + '</td></tr>');
            }
            
          }
        }, function(error){});
    }

    // This is just the listener function for the tablerow click
    function tableClickListener(obj){
      // Grab the row 
        var row = $(obj);
        
        // Grabs the text of the group
        var grp = row.children().first().text();
        var joined = row.children(".joined");
        // add to group
        if(!isInGroup(grp)){
          addToGroup(grp);
          row.addClass("joinedRow");
          joined.html("Joined!");
        }
        // Or remove them
        else{
          removeFromGroup(grp);
          row.removeClass("joinedRow");
          joined.html("");
        }
        
    }
    //This function returns a bool, according to whether or the user in a specific group
    function isInGroup(group){
      var user = Parse.User.current();
      var groupList =  user.get("groups");
      if(($.inArray(group, groupList)) > -1){
        return true;
      }
      return false;
    }
    //authenticateUser();
    makeTable();
    //var groupArray = makeTable();
    // });                return validNum;


    function sendMeText() {
        var user = Parse.User.current();
        var text = "A new message has washed up on shore...";
        var number = user.get("phone");
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
});


