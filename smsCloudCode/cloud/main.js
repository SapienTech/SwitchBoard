
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
         toReturn = "";
      }
     else{
         for(i = 0; i < inputString.length && inputString.charAt(i)!=" "; i++){
             toReturn+=inputString[i];
         }
      }
      response.success(toReturn);
});


// Parse.Cloud.define("receiveSMS", function(request, response){
//   //Do our hashtag checks first. 
//   var hashtag;
//   Parse.Cloud.run("parseTag",{
//     'msgbody' : request.params.Body
//   },{
//     success: function(result){
//       hashtag = result;

//   //first test if the sender has a partner, if not, run text engine. if so, just send sms to them
//   var query = new Parse.Query("User");
//   var recipientNumber;
//   //find the sender
//   query.equalTo("phoneNumber", request.params.From);

//   query.first().then(function(request){
//     //success: function(result){

//       //see if the sender has a partner
//       if (hashtag==""){
//         if (result.has("partnerNumber")){
//         Parse.Cloud.run('sendSMS', {
//           'msgbody' : request.params.Body,
//           'number': result.get("partnerNumber")
//         },{
//           success: function(result){
//           },
//           error: function(error){

//           }
//         });
//       }
//       else {
//         Parse.Cloud.run('sendSMS', {
//           'msgbody' : "Looks like you don't have a partner. Start your text with a # followed by a group name to get started",
//           'number' : request.params.From

//         }, {
//         success: function(result){
//         },
//         error: function(error){
//           }
//         });
//       }
//     }
//       else {
//         //User has partner but is leaving


//         //User does not have a partner
//         Parse.Cloud.run('textEngine', {
//         'msgbody' : request.params.Body,
//         'sender' : request.params.From,
//         'hashtag' : hashtag
//         },
//       {
//       success: function(result) {
//         //find who we're sending it to, now that we've set the partner to somebody
//         Parse.Cloud.run('sendSMS',{
//       'msgbody' : request.params.Body,
//       'number' : result,
//       },
//         {
//           success: function(result) {
//             alert(result);
//           },
//           error: function(error) {
//             alert(error);
//           }
//         });
//       response.success("WE RECEIEVED A TEXT!");
//       },
//       error: function(error) {
//         alert(error);
//       }
//      });

//       }
//     },
//     error: function(error){
//     }
//   });

//     },
//     error: function(error){

//     }
//   });
// });


// Parse.cloud.define("signUp", function(request, response){

//   var user = new Parse.user();
//   user.set("email", request.params.email);
//   user.set("password", request.params.password);
//   user.set("phoneNumber", request.params.phone);

//   user.signUp(null, {
//     success: function(user){
//       alert("Signed in.");

//     },
//     error: function(user, error){}
//   })

// });
// Parse.Cloud.define("signUp", function(request, response){

//     var user = new Parse.User();
//     user.set("email", request.params.email);
//     user.set("password", request.params.password);
//     user.set("phoneNumber", request.params.phone);
//     user.set("groups", ['#trico']);
//  //       // other fields can be set just like with Parse.Object
//  //       //user.set("phone", document.getElementById("phone"));
//  //       alert("sent info");
//        user.signUp(null, {
//          success: function(user) {
//            alert("successful");
//            // Hooray! Let them use the app now.
//          },
//          error: function(user, error) {
//            // Show the error message somewhere and let the user try again.
//            alert("Error: " + error.code + " " + error.message);
//          }
//        });
//   var Queue = Parse.Object.extend("Queue");
//   var queue = new Queue();
  
//   queue.save({
//     email: request.params.email,
//     groups: ["#trico"]
// }, {
//   success: function(queue) {
//     // The object was saved successfully.
//   },
//   error: function(queue, error) {
//     // The save failed.
//     // error is a Parse.Error with an error code and message.
//   }
// });
// });

