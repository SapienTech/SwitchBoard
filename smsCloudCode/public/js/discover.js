$(function(){
	Parse.initialize("kg3Jvwzxa0HSaJR0J1hVf4B23qqUi9UkwTM9ykH9", "WJ7hKtik8cAtR4e8fdMRTlR7wzBqGNoueRUZMeoV");
	var currentUserName;

	//Still need to authenticate user


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
      var groupsTable = document.getElementById("groups-table");
      Parse.Cloud.run("getGroups",{},{
        success: function(result){
          groupsArray = result;
          tableLength = groupsArray.length;
          for(var i = 0; i < tableLength; i++){
            var match = false;
            var row = groupsTable.insertRow(i);
            var cell = row.insertCell(0);
            cell.innerHTML = groupsArray[i];
            for(var j = 0; j < memberGroups.length; j++){
              if(memberGroups[j]==groupsArray[i]){
                match = true;
              }
            }
            if(match){
              row.insertCell(1).innerHTML="✓";
            }
            else{
              var cell2 = row.insertCell(1);
              cell2.innerHTML="+";
            }
          }
          addRowHandlers();
        },
        error: function(error){
          //didn't work yo
        }
      });
    };
    	//eventuall call this function
    //authenticateUser();
    makeTable();
    //var groupArray = makeTable();

});