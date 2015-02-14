
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


function routeHashtag(hashtag, request) {
  var query = new Parse.Query("Groups");
  query.equalTo("groupName", hashtag);
  query.find().then(function(groups) {
    if (groups.length > 0) {
      //group does exist

      
      //  Parse.Cloud.run('sendSMS', {
      // 'msgbody' : "The group you entered exists",
      // 'number' : request.params.From
      // },{
      // success: function(result){
      //   //not sure if we need these here for this function
      // },
      // error: function(error){
      //   //received an error
      // }
      // });
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
      routeHashtag(result, request);
    },
    error: function(error){
      //do something
    }
  });

  //.then(function())
  });


