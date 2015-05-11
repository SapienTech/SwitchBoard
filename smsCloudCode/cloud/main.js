/* --------------------------------------------

                  CLOUD FUNCTIONS

  ---------------------------------------------  */

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
  console.log("Sender number: " +  number);

  // Check to see if user exists
  var user; //this was here before, do we still need it?
  getUserFromNumber(number).then(function(user){

    if(!user){
      sendSMS(number, "Looks like this isn't a registered number. Please sign up at switch-board.io ");
      return;
    }
    console.log("Proceeding with sendSMS");

    hashtag = parseTag(request.params.Body);

    // If it's a utility hashtag, run that utility and exit
    if(utilityHash(hashtag, number)){
      return;
    }
    //If no hashtag, try to route message
    else if (hashtag == "") {
        // 0-4 if yes. 0-4 correspond to tutorial stages. */
        if (user.get("tutorial") > -1) {
            tutorial(user.get("number"));
        }
        else {
            //check to see if user has partner. yes: route message, no: error message
        sendToPartner(request, number)
        }
    }
    //Else, we do have a hashtag and we need to route it
    else {
      if (user.get("tutorial") > -1) {
        user.set("tutorial", -1);
        user.save();
      }
      routeHashtag(request, hashtag);
      }
  });

  });

/* --------------------------------------------

                       JS

  ---------------------------------------------  */

/*parseTag (hashtag)

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

/* logMSG (sender, recipient, body)

  Saves a message when a message is sent. Saves at max three messages per RECIPIENT.

 */
function logMSG(sender, recipient, body){
  var MSGLog = Parse.Object.extend("msgLog");
  var msg = new MSGLog();
  msg.set("recipient", recipient);
  msg.set("sender", sender);
  msg.set("body", body);
  msg.set("reported", false);
  msg.save();
  // If we have more than 3 messages for a recipient, delete the oldest one
  var msgQuery = new Parse.Query("msgLog");
  msgQuery.equalTo("recipient", recipient);
  msgQuery.descending("createdAt");
  msgQuery.find().then(function(results){
    if(results.length > 3){
      console.log("Destroyed last text message");
      results[3].destroy();
    }
  });

}



/////////////helper functions for routing messages without hashtag/////////////


// Once we've determined we have a partner, this is the main relay function
function sendToPartner(request, number){
  hasPartner(number).then(function(parterNumber){
    // If we do indeed have a partner, relay the msg
    if(partnerNumber){
      logMSG(number, partnerNumber, request.params.Body);
      sendSMS(partnerNumber, request.params.Body);

    }
    // If we don't have a partner, tell them
    else{
      sendSMS(number, "Looks like you're not currently in a group! Message with a hashtag to start chatting.");

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
    
    // If we found a partner, set info etc
    if (partner.length > 0){
      sendJoinSMS(request.params.From, hashtag);
      // Set partner's info
      setPartnerInfo(partner[0], request);
      // Set our info (and potentially disconnect current partner)
      return setSenderInfo(partner[0], request);
    }

    // If we didn't find a partner, bail & set our busyBool to false
    else {

      return getUserFromNumber(request.params.From).then(function(user){
        user.set("busyBool", false);
        sendSMS(request.params.From, 'Looks like everyone in ' + hashtag + ' is busy.  Please try again later.');
        return user.save();
      }); 
    }

  }, function(error) {
    console.log("Connect users threw an error.");
  });
};

/*sendJoinSMS - sends a message to a user when they start a conversation. */
function sendJoinSMS(number, hashtag){
  var query = new Parse.Query("Person");
  query.equalTo("groups", hashtag);
  query.find().then(function(groupArr){
    var groupNum = groupArr.length;
    sendSMS(number, 'Connected to one person out of ' + groupNum + ' in ' + hashtag + ". Feel free to start chatting without a hashtag!");
  });
}
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
    case ("#report"):
      report("number");
      break;
    case ("#tutorial"):
      tutorial(number);
      break;
    case ("#boards"):
      board(number);
      break;
    default:
      return false;
  }

  return true;
}

function board(number) {
  var msgBody = 'Current popular boards: ';
  var query = new Parse.Query("Groups");
  query.equalTo("type", "general");
  query.each(function(user){
    if (msgBody.length < 140) {
      //console.log(user.get("groupName"));
      msgBody = msgBody + user.get("groupName") + " ";
    }
  }).then(function() {
    sendSMS(number, msgBody);
  });
}

/* report(number)
 *
 * This finds the last three messages received by the user, 
 * and flags them as abusive, for review in the admin panel
 *
 *
 */
function report(number){
    // Find all messages sent to recipient
    // Find all of those whose sender matches the most recent sender
    // Flag each as abusive
    var msgQuery = new Parse.Query("msgLog");
    msgQuery.equalTo("recipient", number);
    // Sort by most recent
    msgQuery.descending("createdAt");
    // Get all messages
    msgQuery.find(function(msg){
      if(msg == null){
        return;
      }
      // Scan thru all messages - if the sender matches the most recent message, mark it as abusive
      for(i = 0; i < msg.length; i++){
        if(msg[i].get("sender") == msg[0].get("sender")){
          msg[i].set("reported", true);
          msg[i].save();
        }
      }
    });
    sendSMS(number, "Thank you for reporting abusive messages. They have been marked for review.");
    leave(number);

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
    else {
      // if user uses #leave from tutorial:
      getUserFromNumber(number).then(function(user) {
        if (user.get("tutorial") == -1) {
          sendSMS(number, "Looks like you're not currently partnered with anybody!");
        }
        else {
          sendSMS(user.get("number"), "You have exited the tutorial using #leave, get started with '#swat [your message]' or join groups at switch-board.io!");
          user.set("tutorial", -1);
          user.save();
        }
      });
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
  return getUserFromNumber(number).then(function(person){
    // If they have a partner, disconnect the partner
    hasPartner(number).then(function(partnerNum){
      if (partnerNum){
        disconnect(partnerNum);
      }
    }).then(function(){
      var query = new Parse.Query("User");
      //console.log(number);
      query.equalTo("phone", number);
      query.first().then(function(user) {
        Parse.Cloud.useMasterKey();
        user.destroy();
        person.destroy();
      });
    });
    sendSMS(number, "You have been unsubscribed. Hope to see you back soon!");
  });
}

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
        console.log("changed busyBool to true");
        return user.save();
      });
    });
  });
}
  
  //this will be filled out, with messages corresponding to number of replies
var msg1 = "I'm the switchboard operator. My job is to pair you up with a random person and let you chat anonymously through this number.";

var msg2 = "Once I connect you, you can chat normally without a hashtag. Since we're in a conversation, text me anything without a hashtag now to continue!";

var msg3 = "I got it. Find popular boards by texting #boards, and join your favorite ones on switch-board.io.";

var msg4 = "To finish, #leave this tutorial, or begin a message with '#swat [your message]' to start chatting!";


function tutorial(number){
    getUserFromNumber(number).then(function(user) {
    //return busy(number).then(function(user) {
        console.log("this is " + user.get("number"));
        switch(user.get("tutorial")) {
            case(-1):
                console.log("accessed user.tutorial");
                user.set("tutorial", 0);
                sendSMS(number, msg1).then(function(obj){
                    sendSMS(number, msg2);
                });
                break;
            case(0): 
                user.set("tutorial", 1);
                sendSMS(number, msg3).then(function(obj){
                  sendSMS(number, msg4);
                });
                break;
            default:
                console.log("went to default");
              return user.save();
        }
        return user.save();
    });
}


/*We will eventually want to go through all the functions above
and call this function. This function may way to return a promise?*/
function sendSMS(recipient, body){
  return Parse.Cloud.run('sendSMS', {
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
  // Disconnect users who have been inactive for more than 15 minutes. 
  var timeoutQuery = new Parse.Query("Person");
  timeoutQuery.notEqualTo("partner", "");
  timeoutQuery.each(function(user){
    timeout(user, 15.0);
  });

});

/* unbusy(user, minutes) -- unbusies a user if they have been busy for more than x minutes
 *
 *
 */
function unbusy(user, minutes){
  // test timestamp
  var timeDifference = getServerTime() - getUserTime(user);
  // How many minutes we need them to be busy for before we unbusy
  if(timeDifference > (minutes * 60) ) {
    user.set("busyBool", false);
    user.save(); 
  }
};

/* timeout (user, minutes) - times out a user if they have been vacant for too long

 */
function timeout(user, minutes){
  var curTime = getServerTime();
  var lastUpdated = getUserTime(user);
  var timeDifference = curTime - lastUpdated;
  var number = user.get("number");
  var partnerNum = user.get("partner");
  if(timeDifference > (minutes * 60) ){ 
    disconnect(number);
  }
};

/* getUserTime (user) - returns the amount of seconds since 1970 of the updatedAt user field
 *
 *
 */
function getUserTime(user){
  var userLastActive = user.updatedAt;
  var userDate = new Date(userLastActive);
  var time = userDate.getTime();
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
