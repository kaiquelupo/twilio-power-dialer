const moment = require("moment");

let path = Runtime.getFunctions()['dialer-assets'].path;
let assets = require(path); 

const recalculateCallAfterTime = function () {
    const { RETRY_TIME_IN_MINUTES } = process.env;

    return moment().add(parseInt(RETRY_TIME_IN_MINUTES), "minutes").format("HHmm");
}

const finishDialerTask = async function (client, workspaceSid, taskSid) {
   return client.taskrouter.workspaces(workspaceSid) 
     .tasks(taskSid)
     .update({
        assignmentStatus: 'completed',
      });
}

const getDialerTask = async function (client, workspaceSid, taskSid) {
    return client.taskrouter.workspaces(workspaceSid)
        .tasks(taskSid)
        .fetch()
 }

const updateCurrentNumberIdx = async function(client, workspaceSid, task, newValue) {
    
    const { sid, attributes } = task;
    const parsedAttributes = JSON.parse(attributes);
    const newAttributes = {
        ...parsedAttributes, 
        currentNumberIdx: newValue, 
        customers: {
            phone: parsedAttributes.numbers[newValue] 
        }
    };
    
    return client.taskrouter.workspaces(workspaceSid)
     .tasks(sid)
     .update({
         attributes: JSON.stringify(newAttributes)
      });
}

const makeCall = async function(client, task, currentNumberIdx) {
    
    const { sid, attributes } = task;
    const { queue, numbers } = JSON.parse(attributes);
    const { DOMAIN, TWILIO_NUMBER } = process.env;

	await client.calls.create({
        url: `https://${DOMAIN}/evaluate-call?taskSid=${sid}&queue=${queue}`,
        statusCallback: `https://${DOMAIN}/evaluate-complete-call?taskSid=${sid}`,
        to: numbers[currentNumberIdx],
        from: TWILIO_NUMBER,
        machineDetection: 'Enable'
    });
}

exports.handler = async function(context, event, callback) {
    
    const client = context.getTwilioClient();

    const task = await getDialerTask(client, context.WORKSPACE_SID, event.taskSid);
    
    if(task.assignmentStatus !== "completed") {
        
        await assets.changeDialerCapacity(client, context, [event.queue]);
        
       await assets.updateTaskToReporting(client, context, event.taskSid, (attrs) => ({
            ...attrs,
            conversations: {
                ...attrs.conversations,
                content: "Tried to call"
            }
        }));

        const attributes = JSON.parse(task.attributes);
        
        if(attributes.retries > (attributes.attempts + 1)) {
            
            if(attributes.numbers.length > (attributes.currentNumberIdx + 1)) {
        
                await updateCurrentNumberIdx(client, context.WORKSPACE_SID, task, attributes.currentNumberIdx + 1);
                await makeCall(client, task, attributes.currentNumberIdx + 1);
                
            } else {
                
                await finishDialerTask(client, context.WORKSPACE_SID, event.taskSid)
          
                await client.taskrouter.workspaces(context.WORKSPACE_SID)
                 .tasks
                 .create({ attributes: JSON.stringify({
                     ...attributes,
                     conversations: {
                       ...attributes.conversations,
                        conversation_attribute_6: attributes.attempts + 1,
                        content: "Retrying"
                     },
                     attempts: attributes.attempts + 1,
                     callAfterTime: parseInt(recalculateCallAfterTime()),
                     currentNumberIdx: 0
                }), workflowSid: process.env.WORKFLOW_SID });
                
            }
        } else {
            await finishDialerTask(client, context.WORKSPACE_SID, event.taskSid);
        }
          
    }
 
    callback(null);
};
