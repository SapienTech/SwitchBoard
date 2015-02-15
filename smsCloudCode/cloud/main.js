
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world FROM CLOUDz!");
});

// Cloud functions: define("Function Name, Function(request response)")
// Response is a JSON object



Parse.Cloud.define("sendSMS", function(request, response){

    var client = require('twilio')('AC40dc454f2c503e6f4578d9165b313a96', '0d7fd1fa9d97222b263cba34206b563e'); 
     
    client.sendSms({  
      //to: request.params.number,
      to: request.params.number,
      from:'+12564292078', 
      body: request.params.msgbody

     }, function(err, responseData) { 
       if (err) {
         console.log(err);
       } else {
            alert("TEXT SENT!"); 
         // console.log(responseData.from); 
         // console.log(responseData.body);
       }
     }
     );
});

function connectUsers(request, hashtag) {
  var personQuery = new Parse.Query("Person");
  personQuery.include("groups");
  personQuery.equalTo("groupName", 0);
  //personQuery.notEqualTo("number", request.params.From);
  //personQuery.ascending("updatedAt");
  personQuery.first().then(function(partner) {
    Parse.Cloud.run('sendSMS', {
      'msgbody' : 'found partner',
      'number' : request.params.From
      },{
      success: function(result){
        //not sure if we need these here for this function
      },
      error: function(error){
        //received an error
      }
      });

    //update partner number:
    // partner.set("partner", request.params.From);
    // //change the status of the groups array
    // //this is all assuming the person is not in a chat with someone else
    // //this may lead to some problems
    // groups = partner.get("groups");
    // for (i = 0; i < groups.length; i++) {
    //   if (groups[i][0] == hashtag) {
    //     groups[i][1] = 1;
    //   }
    // }
    // partner.set("groups", groups);
    // return partner.save();

  }, function(error) {
    //this will need to move eventually
  });
};


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
      connectUsers(request, hashtag);
      /*group does exist. Get a user who belongs to one of
        these groups and is available*/      
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

Parse.Cloud.define("receiveSMS", function(request, response){
  //parsing the hashtag.
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

  //.then(function())
  });


