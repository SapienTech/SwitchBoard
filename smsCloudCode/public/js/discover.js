$(function(){
  Parse.initialize(PARSE_ID, PARSE_MASTER_KEY);
  var currentUserName;
  // Handlers

  


  //Still need to authenticate user

  // This returns all of the groups the current user is a member of
  function getMemberGroups(){
    var currentUser = Parse.User.current();
    return currentUser.get("groups");
  }

   //gets groups with group_type identifier
   //note: should consider error checking
  function getGroups(group_type) {
     var query = new Parse.Query("Groups");
     query.equalTo("type", group_type);
     return query.find().then(function(groupList){
        var promise = new Parse.Promise();
        promise.resolve(groupList);
        return promise;
     });
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

    function makeGeneralTable(){
      var memberGroups = getMemberGroups();
      //var groupsArray;
      var groupsTable = $("#general-table");
      var groupType = "general";

      // Add our global event listener for the entire table:
      groupsTable.on("click","tr", function(event){
        tableClickListener($(this));
      });

      // Grab the groups:
         getGroups(groupType).then(function(groupsArray){
          for(var i = 0; i < groupsArray.length; i++){
            group = groupsArray[i].get("groupName");
            if (isInGroup(group)){
              groupsTable.append('<tr class = "joinedRow"><td class = grp>' + group + '</td>' + '<td class = "joined">' + "Joined" + '</td></tr>');
            }
            else{
              groupsTable.append('<tr><td class = grp>' + group + '</td>' + '<td class = "joined">' + "" + '</td></tr>');
            }

          }
        }, function(error){});
    }


    function makeMajorTable(){
      var memberGroups = getMemberGroups();
      //var groupsArray;
      var groupsTable = $("#major-table");
      var groupType = "major";

      // Add our global event listener for the entire table:
      groupsTable.on("click","tr", function(event){
        tableClickListener($(this));
      });

      // Grab the groups:
         getGroups(groupType).then(function(groupsArray){
          for(var i = 0; i < groupsArray.length; i++){
            group = groupsArray[i].get("groupName");
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

    makeGeneralTable();
    makeMajorTable();



});

/*
 * old code from make table
      Parse.Cloud.run("getGroups",{},{}).then(
        function(result){
          groupsArray = result;
        },
        function (error){
          alert("Found an error.")
          */

