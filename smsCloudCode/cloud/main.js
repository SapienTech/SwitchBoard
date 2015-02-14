
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
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

