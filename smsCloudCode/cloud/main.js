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
      // callbak for sendSMS
      response.success("We made our text to" + request.params.number);
     }
     );

});

//called when twilio receives message
Parse.Cloud.define("receiveSMS", function(request, response){
  //parsing the hashtag.
  number = request.params.From;
  // Check to see if user is active
  var userExists;
  getUserFromNumber(number).then(function(userExists){
  });

  if(!userExists){
    sendSMS(number, "Looks like this isn't a registered number. Please sign up at www.MSGinabottle.com.");
    return;
  }

  console.log("Proceeding with sendSMS");

  hashtag = parseTag(request.params.Body);
  
  // check if it's a utility hashtag
  if(utilityHash(hashtag, number)){
    return true;
  }
  //if no hashtag, route message
  else if (hashtag == "") {
    //check to see if user has partner. yes: route message, no: error message
    sendToPartner(request, number)
  }
  //else we do have a hashtag and we need to route it
  else {
    routeHashtag(request, hashtag);
    }
  });



/*parseTag

parses message to check if hashtag exists

*/
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


// Once we've determined we have a partner, this is the main relay function
function sendToPartner(request, number){
  hasPartner(number).then(function(parterNumber){
    // If we do indeed have a partner, relay the msg
    if(partnerNumber){

      sendSMS(partnerNumber, request.params.Body);

    }
    // If we don't have a partner, tell them
    else{

      sendSMS(partnerNumber, "Looks like you're not currently in a group! Message with a hashtag to start chatting.");

    }
  }, function(){
    console.log("hasPartner threw an error");
  });
} 
/* hasPartner

  -Given a number, returns a promise-fied number of the partner, or if not, returns false

*/
function hasPartner(number) {

  // Grab the user
  return getUserFromNumber(number).then(function(user){
  // We either return a promise which contains a number, or a promise which contains 'false'
    partnerNumber = user.get("partner");
    if (partnerNumber) {
      var successful = new Parse.Promise();
      successful.resolve(partnerNumber);
      // console.log("Tried to return partner number: " + partnerNumber);
      // This just make's sure we keep the user updated w/each message, for the timeoutFunction
      updateUserTimes(user);
      // This used to return 'partnerNumber - but that's wrong, no?
      return successful;
    }
    else {
      console.log("Didn't find a partner number");
      var noPartner = new Parse.Promise();
      noPartner.resolve(false);
      return noPartner;
    }
  },
    function(error) {
      console.log("hasPartner query failed. ")
      return false;
    });

}

/* updateUserTimes - save user and partner user to make sure updatedTimes update w/each message

 */

function updateUserTimes(user){
  user.save().then(function(){
    getUserFromNumber(user.get("partner")).then(function(partnerUser){
      partnerUser.save();
    });
  });
}


//////////////helper functions to handle new hashtag request////////////////////

function routeHashtag(request, hashtag) {
  var query = new Parse.Query("Groups");
  query.equalTo("groupName", hashtag);
  query.find().then(function(groups) {
    // Testing code, sends a text if group exists.
    if (groups.length > 0) {
      sendSMS(request.params.From, "Group exists");

       /*group does exist. Get a user who belongs to one of
        these groups and is available*/ 
      connectUsers(request, hashtag);
           
    }
    else {
      //group does not exist
      sendSMS(request.params.From, "Looks like that group doesn't exist!");
    }
  }, function(error) {
    console.log("Error in routeHashtag" + error);
  });
};


/* setPartnerInfo 

When we've matched with a partner, set their info

*/
function setPartnerInfo(partner, request){
  partner.set("partner", request.params.From);
  partner.set("busyBool", true);
  partner.save();
  //route message to new partner
  sendSMS(partner.get("number"), request.params.Body);
}

/* setSenderInfo


When we've matched with a partner, set our (senders) info
and notify old partner of change

*/
function setSenderInfo(partner, request){
  partnerNumber = partner.get("number");
  getUserFromNumber(request.params.From).then(function(sender){

    // Grab the sender's old partner
    oldPartner = sender.get("partner");
    // If there was a partner, disconnect him
    if(oldPartner){
        disconnect(oldPartner);
    }
    // Otherwise, simply set the sender's partner
    sender.set("partner", partnerNumber);
    sender.set("busyBool", true);
    return sender.save();
  }); 
}

/* 

findPartner

Given a text & hashtag, this tries to find a partner, and returns a partner array

*/
function findPartner(request, hashtag){
  var personQuery = new Parse.Query("Person");
  personQuery.include("groups");
  personQuery.equalTo("groups", hashtag);

  // Make sure we don't text ourselves
  personQuery.notEqualTo("number", request.params.From);

  // Make sure they're not busy
  personQuery.notEqualTo("busyBool", true);
  personQuery.ascending("updatedAt");
  // return our partner
  return personQuery.find();
}

/*

connectUsers - primary engine for connecting two users, given a text & a hashtag

returns an empty promise (chainable)

*/

function connectUsers(request, hashtag) {
  // Find a person to partner with
  findPartner(request,hashtag).then(function(partner) {
    // Testing function: return sender a msg that you've found a user

    sendSMS(request.params.From, (partner.length).toString() + ' user(s) found');

    // If we found a partner, set info etc
    if (partner.length > 0){
      // Set partner's info
      setPartnerInfo(partner[0], request);
      // Set our info (and potentially disconnect current partner)
      return setSenderInfo(partner[0], request);
    }

    // If we didn't find a partner, bail & set our busyBool to false
    else {

      return getUserFromNumber(request.params.From).then(function(user){
        user.set("busyBool", false);
        sendSMS(request.params.From, 'Looks like everyone in ' + hashtag + 'is busy.  Please try again later.');
        return user.save();
      }); 
    }

  }, function(error) {
    console.log("Connect users threw an error.");
  });
};

//disconnects the phone number from their partner. 
function disconnect(number) {
  getUserFromNumber(number).then(function(partner) {
    partner.set("partner", "");
    partner.set("busyBool", false);
    sendSMS(partner.get("number"),'You were disconnected from your partner.' );
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

///////////////Helper functions for utility hashtags///////////////////

//Returns a bool, if the hashtag is a utility tag. If so, executes the specified function. Returns false otherwise.
function utilityHash(hashtag, number){
  switch(hashtag){
    case("#leave"):
      leave(number);
      break;
    
    case("#unsubscribe"):
      unsubscribe(number);
      break;
    
    case("#busy"):
      busy(number);
      break;
    
    default:
      return false;
  }

  return true;
}
/*This function returns a promise, just so as to keep it asynchronous*/

function leave(number){
  // First, we need to check if the user has a partner. If they don't, we need to tell them they're not in a convo. But hasPartner doesn't do what it says.
  return hasPartner(number).then(function(partner){
    console.log("Attempting to call leave function, with sender number: " + number +  ", partner number: " + partner);
    if(partner){
      disconnect(number);
      disconnect(partner);
      console.log("changed busyBool to false");
    }
    else{
      sendSMS(number, "Looks like you're not currently partnered with anybody!");
    }
    var myPromise = new Parse.Promise();
    myPromise.resolve();

    return myPromise;
  }, function(){
    console.log('leave returned an error');
  });
}

function unsubscribe(number) {
  //if hashtag == "#unsubscribe" then go through unsubscribe process
  return getUserFromNumber(number).then(function(user){
    // If they have a partner, disconnect the partner
    hasPartner(number).then(function(partnerNum){
      if (partnerNum){
        disconnect(partnerNum);
      }
    }).then(function(){
      user.destroy();
      sendSMS(number, "You have been unsubscribed. Hope to see you back soon!");
    });

    // We need code to actually delete the USER
    /*var userQuery = new Parse.Query("User");
    userQuery.equalTo("number", number);
    userQuery.first(function(){});*/
  });

};
/* busy(number) - sets user busy for a number of hours specified in unBusy. Returns an empty promise (hence all the returns)

*/
function busy(number){
  return hasPartner(number).then(function(number) {
    // remove partner if we have one
    if (number) {
      return leave(number);
    }
    var myPromise = new Parse.Promise();
    myPromise.resolve();
    return myPromise;
  }).then(function() {
    var query = new Parse.Query("Person");
    query.equalTo("number", number);
    return query.first().then(function(user) {
      user.fetch().then(function(){
        user.set("busyBool", true);
        sendSMS(number, "You have been set to busy for one hour.");
        console.log("changed busyBool to true")
        return user.save();
      });
    });
  });
}
  

/*We will eventually want to go through all the functions above
and call this function. This function may way to return a promise?*/
function sendSMS(recipient, body){
  Parse.Cloud.run('sendSMS', {
    'msgbody' : body,
    'number' : recipient
    },{
    success: function(result){
      console.log(result);
    },
    error: function(error){
      console.log("Send sms error:" + error);
    }
    });
}

/* getUserFromNumber
  returns a user promise object, given a phone number 


*/
function getUserFromNumber(number) {

  var personQuery = new Parse.Query("Person");
  personQuery.equalTo("number", number);

  return personQuery.first().then(function(user){

    console.log("Found user from number: " + number);
    var promise = new Parse.Promise();
    promise.resolve(user);
    return promise;
  }, function(){
    var promise = new Parse.Promise();
    promise.resolve(false);
    return promise;
  });
}

Parse.Cloud.job("manageUsers", function(request, status) {
  console.log("Running unBusy");
  currentTime = getServerTime();
  var busyQuery = new Parse.Query("Person");
  // For users without a partner, AND with busybool = true, unbusy
  busyQuery.equalTo("partner","");
  busyQuery.equalTo("busyBool", true);
  busyQuery.each(function(user) {
      unbusy(user, 1);
  });
  console.log("Finished running unBusy");
  // Disconnect users who have been inactive for more than 5 minutes. 
  var timeoutQuery = new Parse.Query("Person");
  timeoutQuery.notEqualTo("partner", "");
  timeoutQuery.each(function(user){
    timeout(user, 5.0);
  });

});

/* unbusy(user, minutes) -- unbusies a user if they have been busy for more than x minutes
 *
 *
 */
function unbusy(user, minutes){
  // test timestamp
  var timeDifference = getServerTime() - getUserTime(user);
  console.log("Time difference is: " + timeDifference);
  // How many minutes we need them to be busy for before we unbusy
  if(timeDifference > (minutes * 60) ) {
    console.log("Found a user who was busied more than a minute ago. Unbusying.")
    user.set("busyBool", false);
    user.save(); 
  }
  else{
    console.log("This user wasn't unbusied long enough ago. Not unbusying. ")
  }
}

/* timeout (user, minutes) - times out a user if they have been vacant for too long

 */
function timeout(user, minutes){
  var curTime = getServerTime();
  var lastUpdated = getUserTime(user);
  var timeDifference = curTime - lastUpdated;
  var number = user.get("number");
  var partnerNum = user.get("partner");
  console.log("Calculating time out between users. Servertime:" + curTime + ", last updated time: " + lastUpdated + ", timeDifference = " + timeDifference + "testing against:" + (minutes * 60));
  if(timeDifference > (minutes * 60) ){ 
    disconnect(number);
    disconnect(partnerNum);
    console.log("disconnected due to inactivity");
  }
}





/* getUserTime (user) - returns the amount of seconds since 1970 of the updatedAt user field
 *
 *
 */
function getUserTime(user){
  console.log("Calculating userTime...");
  // This isn't being got for some reason
  var userLastActive = user.updatedAt;
  var userDate = new Date(userLastActive);
  var time = userDate.getTime();
  console.log("done calculating user time.");
  // Returns the updated at time in seconds
  return time/1000.0;
}

/* getServerTime
  returns the time in SECONDS since 1970
*/
function getServerTime() {
  time = Date.now();
  return time/1000.0;
}
