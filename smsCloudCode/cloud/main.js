
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
  number = request.params.From;
  // check if it's a utility hashtag
  if(utilityHash(hashtag, number)){
    return true;
  }
  //if no hashtag, route message
  else if (hashtag == "") {
    //check to see if user has partner. yes: route message, no: error message
    sendToPartner(request, number)
    // haspartner(number);
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


// Once we've determined we have a partner, this is the main relay function
function sendToPartner(request, number){
  hasPartner(number).then(function(parterNumber){
    if(partnerNumber){


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

    }

    else{

      Parse.Cloud.run('sendSMS', {
      'msgbody' : "You are currently not in a group, start message with a hashtag to start talking",
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
  }, function(){
    console.log("hasPartner threw an error");
  });
} 
//checks to see if user has partner, returns [true, number] or [false, ""]
// Somehow, we need to get this to return a promise. 
function hasPartner(number) {
  var query = new Parse.Query("Person");
  query.equalTo("number", number);
    return query.first().then(function(user) {
    partnerNumber = user.get("partner");
    if (partnerNumber) {
      var successful = new Parse.Promise();
      successful.resolve(partnerNumber);
      console.log("Tried to return partner number: " + partnerNumber);
      return partnerNumber;
    }
    else {
      console.log("Didn't find a partner number");
      return false;
    }
  },
    function(error) {
      console.log("hasPartner query failed. ")
      return false;
    });
};



//////////////helper functions to handle new hashtag request////////////////////

function routeHashtag(request, hashtag) {
  var query = new Parse.Query("Groups");
  query.equalTo("groupName", hashtag);

  
  query.find().then(function(groups) {
    // Testing code, sends a text if group exists.
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


// When we've matched with a partner, set their info
function setPartnerInfo(partner, request){
  partner.set("partner", request.params.From);
  partner.set("busyBool", true);
  partner.save();
  //route message to new partner
  Parse.Cloud.run('sendSMS', {
  'msgbody' : request.params.Body,
  'number' : partner.get("number")
  },{
  success: function(result){
    //not sure if we need these here for this function
  },
  error: function(error){
    //received an error
  }
  });
}

// When we've matched with a partner, set our (senders) info
// and notify old partner of change
function setSenderInfo(partner, request){
  partnerNumber = partner.get("number");
  // Find the sender via the number
  senderQuery = new Parse.Query("Person");
  senderQuery.equalTo("number", request.params.From);

  senderQuery.first().then(function(sender) {

    // Grab the sender's old partner
    oldPartner = sender.get("partner");
    if(oldPartner){
        disconnect(oldPartner);
    }
    else{
        console.log("Error: no partner to disconnect in setSenderInfo")
      }
    sender.set("partner", partnerNumber);
    sender.set("busyBool", true);
    return sender.save();
  }); 
}

// Given a text & hashtag, this tries to find a partner, and returns a partner array
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


//if hashtag exists, attempts to pair two users
function connectUsers(request, hashtag) {
  // Find a person to partner with
  findPartner(request,hashtag).then(function(partner) {
    // Testing function: return sender a msg that you've found a user
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

    // If we found a partner:
    if (partner.length > 0){
      // Set partner's info
      setPartnerInfo(partner[0], request);
      // Set our info (and potentially disconnect current partner)
      return setSenderInfo(partner[0], request);
    }

    // If we didn't find a partner:
    else {
      var query = new Parse.Query("Person");
      query.equalTo("number", request.params.From);
      query.first().then(function(user) {
        user.set("busyBool", false);
        return user.save();
      });
      sendBusyMsg(request, hashtag);
    }
   // return partner[0].save();

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

function sendBusyMsg(request, group){
  Parse.Cloud.run('sendSMS', {
  'msgbody' : 'Looks like everyone in ' + group + 'is busy.  Please try again later.',
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

//disconnects the phone number from their partner. 
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

function leave(number){
  // This isn't working b/c hasPartner isn't being given time to complete. 

  // First, we need to check if the user has a partner. If they don't, we need to tell them they're not in a convo. But hasPartner doesn't do what it says.
  return hasPartner(number).then(function(partner){
    console.log("Attempting to call leave function, with sender number: " + number +  ", partner number: " + partner);
    disconnect(number);
    disconnect(partner);
    var myPromise = new Parse.Promise();
    myPromise.resolve();
    console.log("changed busyBool to false");
    return myPromise;
  }, function(){
    console.log('leave returned an error');
  });
}

function unsubscribe(number) {
  //if hashtag == "#unsubscribe" then go through unsubscribe process

};

function busy(number){
  hasPartner(number).then(function(number) {
    if (number) {
      return leave(number);
    }
    var myPromise = new Parse.Promise();
    myPromise.resolve();
    return myPromise;
  }).then(function() {
    console.log("entered busyBOOOOOL!");
    var query = new Parse.Query("Person");
    query.equalTo("number", number);
    query.first().then(function(user) {
      user.fetch().then(function(){
        user.set("busyBool", true);
        console.log("changed busyBool to true")
        return user.save();
      });
      

      Parse.Cloud.run('sendSMS', {
        'msgbody' : 'set to busy for one hour',
        'number' : number
        },{
        success: function(result){
          //not sure if we need these here for this function
        },
        error: function(error){
          //received an error
        }
        });

      
    });
  });
  // if hashtag == busy, then set busy for a certain period of time
}
  



function sendSMS(recipient, body){

}


