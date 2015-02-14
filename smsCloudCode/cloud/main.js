
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
// Cloud functions: define("Function Name, Function(request response)")
// Response is a JSON object
Parse.Cloud.Run("hello",{}, function(result{

}));