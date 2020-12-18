const { get } = require("lodash");

let path = Runtime.getFunctions()['dialer-assets'].path;
let assets = require(path);

const changeOutboundCallTaskToBeAcceptedByFlex = function(client, context, event, attributes){
    const { TWILIO_NUMBER,  WORKSPACE_SID } = context;

    return client.taskrouter.workspaces(WORKSPACE_SID)
        .tasks(event.TaskSid)
        .update({
            attributes: JSON.stringify({ ...attributes, to: TWILIO_NUMBER, name: attributes.to })
        });
}

exports.handler = async function(context, event, callback) {
    const client = context.getTwilioClient();

    const attributes = event.TaskAttributes && JSON.parse(event.TaskAttributes);

    //outbound call redirected to Flex 
    if(event.EventType === "task.created" && attributes.dialer == false) {
        await changeOutboundCallTaskToBeAcceptedByFlex(client, context, event, attributes);
    }
        
    //events that could change dialer behaviour
    if(
        event.EventType === "worker.activity.update" ||
        ((event.EventType === "reservation.accepted" || event.EventType === "task.completed") && attributes.dialer == false) || 
        event.EventType === "reservation.canceled"
    ) {

        const workerAttributes = event.WorkerAttributes && JSON.parse(event.WorkerAttributes)
        const queues = attributes ? [attributes.queue] : get(workerAttributes, "routing.skills", null);

        if(queues) {
            await assets.changeDialerCapacity(client, context, queues);
        }

    }

    if(event.EventType === "worker.attributes.update") {
        await assets.changeDialerCapacity(client, context);
    }
     
    callback(null);
};