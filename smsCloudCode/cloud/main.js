
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world FROM CLOUDz!");
});

// Cloud functions: define("Function Name, Function(request response)")
// Response is a JSON object

//handles outgoing text message
Parse.Cloud.define("sendSMS", function(request, response){

    var client = require('twilio')('AC40dc454f2c503e6f4578d9165b313a96', '0d7fd1fa9d97222b263cba34206b563e'); 
     
    client.sendSms({  
      //to: request.params.number,
      to: request.params.number,
      from:'+12564292078', 
      body: request.params.msgbody

     }, function(err, responseData) {
     }
     );
});

//called when twilio receives message
Parse.Cloud.define("receiveSMS", function(request, response){
  //parsing the hashtag.
  hashtag = parseTag(request.params.Body);
  if (hashtag == "") {
    //check to see if user has partner. yes: route message, no: error message
    hasPartner(request, hashtag);
  }
  //else we do have a hashtag and we need to route it
  else {
    routeHashtag(request, hashtag);
  }
  });

//parses message to check if hashtag exists
function parseTag(hashtag) {
    //we may want to be careful about using ""
     var toReturn="";
     if(hashtag.charAt(0)!='#'){
         toReturn = "";
      }
     else{
         for(i = 0; i < hashtag.length && hashtag.charAt(i)!=" "; i++){
             toReturn+=hashtag[i];
         }
      }
      return toReturn;
};




/////////////helper functions for routing messages without hashtag/////////////

//checks to see if user has partner, returns [true, number] or [false, ""]
function hasPartner(request, hashtag) {
  var query = new Parse.Query("Person");
  var partnerNumber;
  query.equalTo("number", request.params.From);
  query.first().then(function(user) {
    partnerNumber = user.get("partner");
    if (partnerNumber.length > 1) {
      Parse.Cloud.run('sendSMS', {
      'msgbody' : request.params.Body,
      'number' : partnerNumber  //haspartner[1]
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
      //[true, partnerNumber];
    }
    else {
      Parse.Cloud.run('sendSMS', {
      'msgbody' : "You are currently not in a group, start message with a hastag to start talking",
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
    }
  },
    function(error) {
      return true;//true;
      //[{bool: true, number: '+13109987101'}];
    });
};



//////////////helper functions to handle new hashtag request////////////////////

function routeHashtag(request, hashtag) {
  var query = new Parse.Query("Groups");
  query.equalTo("groupName", hashtag);
  query.find().then(function(groups) {
    if (groups.length > 0) {
       Parse.Cloud.run('sendSMS', {
      'msgbody' : 'group exists',
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });

       /*group does exist. Get a user who belongs to one of
        these groups and is available*/ 
      connectUsers(request, hashtag);
           
    }
    else {
      //group does not exist
      Parse.Cloud.run('sendSMS', {
      'msgbody' : "The group you entered does not exist",
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
    }
  }, function(error) {
    //we didn't find anything
    Parse.Cloud.run('sendSMS', {
    'msgbody' : "The group you entered does not exist, error",
    'number' : request.params.From
    },{
    success: function(result){
      //not sure if we need these here for this function
    },
    error: function(error){
      //received an error
    }
    });
  });
};

//if hashtag exists, attempts to pair two users
function connectUsers(request, hashtag) {
  // if we want to use pair system instead:
  // var busyVar = {};
  // busyVar[hashtag] = 1;
  var personQuery = new Parse.Query("Person");
  personQuery.include("groups");
  personQuery.equalTo("groups", hashtag);
  personQuery.notEqualTo("number", request.params.From);
  personQuery.notEqualTo("busyBool", true);
  personQuery.ascending("updatedAt");
  personQuery.find().then(function(partner) {
    Parse.Cloud.run('sendSMS', {
      'msgbody' : (partner.length).toString() + ' user(s) found',
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });

    // update reciever's partner number:
    if (partner.length > 0){
      // newVar = {};
      // newVar[hashtag] = 1;
      partner[0].set("partner", request.params.From);
      partner[0].set("busyBool", true);
      partner[0].save();
      //route message to new partner
      Parse.Cloud.run('sendSMS', {
      'msgbody' : request.params.Body,
      'number' : partner[0].get("number")
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
      // partner[0].remove("groups", groupVar);
      // partner[0].save().then(function(partner) {
      //   partner.add("groups", newVar);
      //   return partner.save();
      // });
      //update sender's information
      partnerNumber = partner[0].get("number");
      senderQuery = new Parse.Query("Person");
      senderQuery.equalTo("number", request.params.From);
      senderQuery.first().then(function(sender) {
        oldPartner = sender.get("partner");
        if (oldPartner.length > 0) {
          disconnect(oldPartner);
          sender.set("partner", partnerNumber);
          sender.set("busyBool", true);
        }
        else{
          sender.set("partner", partnerNumber);
          sender.set("busyBool", true);
          // sender.remove("groups", groupVar);
          // sender.save().then(function(sender) {
          //   sender.add("groups", newVar);
          //   return sender.save();
          // });
        }
        return sender.save();
      });
    }
    else {
      Parse.Cloud.run('sendSMS', {
      'msgbody' : 'Looks like everyone from that group is busy. Try again later.',
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
    }
    return partner[0].save();

  }, function(error) {
    Parse.Cloud.run('sendSMS', {
      'msgbody' : 'did not find a partner',
      'number' : request.params.From
      },{
      success: function(result){  
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
  });
};

//disconnects old partner from chat when user connects with new partner
function disconnect(number) {
  query = new Parse.Query("Person");
  query.equalTo("number", number);
  query.first().then(function(partner) {
    partner.set("partner", "");
    partner.set("busyBool", false);
    Parse.Cloud.run('sendSMS', {
      'msgbody' : 'You were disconnected from your partner.',
      'number' : partner.get("number")
      },{
      success: function(result){  
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });
    //maybe we should put this in the success section?
    return partner.save();
  });
}

///////////////functions that handles group adding//////////////////

Parse.Cloud.define("getGroups", function(request, response){
  // response.success("helloWorld");
  var query = new Parse.Query("Groups");
    query.find({
      success: function(results) {
        var groupsArray = [];
        for (var i = 0; i < results.length; i++){
        groupsArray[i] = results[i].get("groupName");
      }
      // results is an array of Parse.Object
      response.success(groupsArray);
    },
      error: function(error) {
    // error is an instance of Parse.Error.
    }
  });
});


function leaveChat(request) {
  //if hashtag == "#leave" then this function is called
};

function unsubScribe(request) {
  //if hastage == "#unsubscribe" then go through unsubscribe process

};
  
  /* In case we want to make this a cloud function
  Parse.Cloud.run("parseTag", {
    'msgbody' : request.params.Body
  }, {
    success: function(result){
      //need to make sure this is actually the proper hashtag
      //testing confirmation
      routeHashtag(request, result);
    },
    error: function(error){
      //do something
    }
  });
    */

/* uncommented cloud function, not sure if needed
Parse.Cloud.define("parseTag", function(request, response){
     var inputString = request.params.msgbody;
     var toReturn="";
     if(inputString.charAt(0)!='#'){
         toReturn = "no tag";
      }
     else{
         for(i = 0; i < inputString.length && inputString.charAt(i)!=" "; i++){
             toReturn+=inputString[i];
         }
      }
      response.success(toReturn);
});
*/


