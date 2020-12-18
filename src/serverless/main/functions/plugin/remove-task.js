const TokenValidator = require('twilio-flex-token-validator').functionValidator;

let path = Runtime.getFunctions()['plugin/utils'].path;
let assets = require(path);

exports.handler = TokenValidator( async (context, event, callback) => {

  try {

    const client = context.getTwilioClient();

    const { taskSid } = event;
      
    await client.taskrouter.workspaces(context.WORKSPACE_SID)
      .tasks(taskSid)
      .remove();

    callback(null, assets.response("json", {}));

  } catch (err) {

    callback(err);

  }
  

});