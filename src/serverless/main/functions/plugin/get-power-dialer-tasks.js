const TokenValidator = require('twilio-flex-token-validator').functionValidator;

let path = Runtime.getFunctions()['plugin/utils'].path;
let assets = require(path);

exports.handler = TokenValidator( async (context, event, callback) => {

  const client = context.getTwilioClient();

  const { filter } = event;

  console.log(filter);

  const tasks = await client.taskrouter.workspaces(context.WORKSPACE_SID)
    .tasks
    .list({
      evaluateTaskAttributes: filter,
      assignmentStatus: "pending",
      limit: 200
    });

  callback(null, assets.response("json", tasks ));

});