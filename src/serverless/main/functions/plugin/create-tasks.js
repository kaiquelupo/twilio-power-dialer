const TokenValidator = require('twilio-flex-token-validator').functionValidator;

let path = Runtime.getFunctions()['plugin/utils'].path;
let assets = require(path);


const capitalize = (s) => {
  
  if (typeof s !== 'string') return ''

  return s.charAt(0).toUpperCase() + s.slice(1)
}


exports.handler = TokenValidator( async (context, event, callback) => {

  try {

    const client = context.getTwilioClient();

    const contacts = (event.contacts && JSON.parse(event.contacts)) || [];

    const { campaign } = event;

    for(let i=0; i < contacts.length; i++) {
      
      const { destination, name, queue, ...info } = contacts[i];

      let optionalInfo = [];
      let actions = []; 

      Object.keys(info).forEach((key) => {

        if(key.match("action_")) {

          actions = [ ...actions, { name: capitalize(key.replace("action_", "")), value: info[key] } ];

        } else {

          optionalInfo = [ ...optionalInfo, { name: capitalize(key), value: info[key] } ];

        }

      })

      await client.taskrouter.workspaces(context.WORKSPACE_SID)
          .tasks
          .create({
              attributes: JSON.stringify({
                  name: "Trying to Call",
                  queue,
                  dialer: true,
                  attempts: 0,
                  callAfterTime: 0,
                  retries: 3,
                  numbers: destination.split("|"),
                  currentNumberIdx: 0,
                  channel: "voice",
                  requiredInfo: {
                      name,
                      campaign
                  },
                  optionalInfo,
                  actions
              }
          ), workflowSid: context.WORKFLOW_SID });

    }

    callback(null, assets.response("json", {}));

  } catch (err) {

    callback(err);

  }
  

});