let path = Runtime.getFunctions()['dialer-assets'].path;
let assets = require(path);

exports.handler = async function(context, event, callback) {
    
    const client = context.getTwilioClient();
    const { TWILIO_NUMBER, DOMAIN } = context;
    const { CallSid, AnsweredBy, taskSid, queue } = event;

    let reason;
    let twiml;
    
    if(AnsweredBy === "human") {
    
        twiml = new Twilio.twiml.VoiceResponse();
        
    	const previousTask = await assets.updateTaskToReporting(client, context, taskSid, (attrs) => ({
            ...attrs,
            conversations: {
                ...attrs.conversations,
                content: "Sent to agent"
            },
        }));

        const previousTaskAttributes = JSON.parse(previousTask.attributes);
    	
    	twiml.enqueue({
            workflowSid: context.WORKFLOW_SID,
            waitUrl: `https://${DOMAIN}/mute-wait-music`
        }).task({}, JSON.stringify({
            dialer: false,
            queue,
            conversations: {
                conversation_id: previousTaskAttributes.conversations.conversation_id,
                direction : "Outbound",
                preceded_by: "Power Dialer",
                external_contact: TWILIO_NUMBER,
                campaign: previousTaskAttributes.conversations.campaign,
                workflow: previousTaskAttributes.conversations.workflow,
                content: "Agent call"
            },
            customers: previousTaskAttributes.customers,
            optionalInfo: previousTaskAttributes.optionalInfo,
            actions: previousTaskAttributes.actions
        })); 
    
    	reason = "Call sent to Queue";
    
    	await client.taskrouter.workspaces(context.WORKSPACE_SID)
         .tasks(taskSid)
         .update({
            assignmentStatus: 'completed',
            reason
        });
        
        console.log("human");
    	
    } else {
        
       console.log("not human");
        
       await assets.changeDialerCapacity(client, context, [queue]);
        
       twiml = new Twilio.twiml.VoiceResponse();
       twiml.hangup();
       reason = "Call failed";
    }

    await client.calls(CallSid)
        .update({twiml: twiml.toString()})
    
    callback(null);
};
