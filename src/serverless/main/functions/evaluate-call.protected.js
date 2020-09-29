let path = Runtime.getFunctions()['dialer-assets'].path;
let assets = require(path);

exports.handler = async function(context, event, callback) {
    
    const client = context.getTwilioClient();
    const { TWILIO_NUMBER } = context;

    let reason;
    let twiml;
    
    console.log(event); 
    
    if(event.AnsweredBy === "human") {
    
        twiml = new Twilio.twiml.VoiceResponse();
        
    	const previousTask = await assets.updateTaskToReporting(client, context, event.taskSid, (attrs) => ({
            ...attrs,
            conversations: {
                ...attrs.conversations,
            },
        }));
    	
    	twiml.enqueue({
            workflowSid: context.WORKFLOW_SID,
        }).task({}, JSON.stringify({
            dialer: false,
            queue: event.queue,
            conversations: {
                conversation_id: JSON.parse(previousTask.attributes).conversations.conversation_id,
                direction : "Outbound",
                preceded_by: "Power Dialer",
                external_contact: TWILIO_NUMBER
            },
            customers: {
                phone: JSON.parse(previousTask.attributes).customers.phone
            }
        })); 
    
    	reason = "Call sent to Queue";
    
    	await client.taskrouter.workspaces(context.WORKSPACE_SID)
         .tasks(event.taskSid)
         .update({
            assignmentStatus: 'completed',
            reason
        });
        
        console.log("human");
    	
    } else {
        
        console.log("not human");
        
       await assets.changeDialerCapacity(client, context, [event.queue]);
        
       twiml = new Twilio.twiml.VoiceResponse();
       twiml.hangup();
       reason = "Call failed";
    }
    
    callback(null, twiml);
};
