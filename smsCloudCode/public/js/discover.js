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
				person.add("groups", {"#swat": 0});
				return person.save();	
			});
		});
	}

    function addRowHandlers() {
      var table = document.getElementById("groups-table");
      var rows = table.getElementsByTagName("tr");
      var memberGroups = getMemberGroups();
      for (i = 0; i < rows.length; i++) {
          var currentRow = table.rows[i];
          var createClickHandler = function(row) {
            return function() { 
              var group = row.getElementsByTagName("td")[0].innerHTML;
              var cell = row.getElementsByTagName("td")[1];
                for(var i = 0; i < memberGroups.length; i++){
                  if(memberGroups[i]==group){
                  alert("Already a member of "+ group);
                    return;
                  }
                }
                //Switch cell to ✓, and join group on parse
                cell.innerHTML = "✓";

                addToGroup(group);
                //add to queue group
                // Parse.Cloud.run("joinGroup",{
                //   "username": Parse.User.current().get("username"),
                //   "newgroup": group
                // },{
                //   success: function(result){
                //     alert(result);
                //   },
                //   error: function(error){
                //     }
                //   });
                };
              };

          currentRow.onclick = createClickHandler(currentRow);
      }
  }

    function makeTable(){
      var groupsArray;
      var tableLength;
      var memberGroups = getMemberGroups();
      // var groupsTable = $("#groups-table");
      var groupsTable = document.getElementById("groups-table");
      Parse.Cloud.run("getGroups",{},{
        success: function(result){
          groupsArray = result;
          // Make the table
          for(var i = 0; i < groupsArray.length; i++){
            group = groupsArray[i];
            var match = false;
            // Make row, then cell[0] (stores group name)
            var row = groupsTable.insertRow(i);
            var nameCell = row.insertCell(0);
            // Set the cell[0] text to the group name
            var joinedCell = row.insertCell(1);
            nameCell.innerHTML = group;
            if(isInGroup(group)){
              joinedCell.innerHTML="✓";
            }
            else{
              joinedCell.innerHTML="+";
            }
          }
          addRowHandlers();
        },
        error: function(error){
          //didn't work yo
        }
      });
    }

    //This function returns a bool, according to whether or the user in a specific group
    function isInGroup(group){
      var user = Parse.User.current();
      var groupList =  user.get("groups");
      if(($.inArray(group, groupList)) > -1){
        return true;
      }
      return false;
    	//eventuall call this function
    }
    //authenticateUser();
    makeTable();
    //var groupArray = makeTable();


});