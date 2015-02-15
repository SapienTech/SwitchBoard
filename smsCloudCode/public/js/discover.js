$(function(){ 
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");
	var currentUserName;
  
	//Still need to authenticate user

  // This returns all of the groups the current user is a member of
  function getMemberGroups(){
    var currentUser = Parse.User.current();
    return currentUser.get("groups");
  }
    //this logout function needs to also disassociate User.currert()
  function logout(){
    Parse.User.logOut();
    window.location = "/index.html";
  }

  function makeTopBar(user){
    var userText = document.getElementById("user-name");
    userText.innerHTML = user ;
  }

  function addToGroup(groupName){
		var currentUser = Parse.User.current();
		currentUser.add("groups", groupName);
		currentUser.save().then(function(currentUser){
			var query = new Parse.Query("Person");
			//need to clear up this redundancy
			query.equalTo("number", currentUser.get("phone"));
			query.first().then(function(person){
        var groupVar = {};
        groupVar[groupName] = 0;
				person.add("groups", groupVar);
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
            groupsTable.append('<tr><td>' + group + '</td>' + '<td class = "joined">' + isInGroup(group) + '</td></tr>');
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
        // add to group (unless they're already in)
        if(!isInGroup(grp)){
          addToGroup(grp);
          alert("Joined" + grp);
          joined.html("true");
        }
        else{
          alert("You are already a member of " + grp + " !");
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
    });
