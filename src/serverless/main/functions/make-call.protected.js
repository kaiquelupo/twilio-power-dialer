let path = Runtime.getFunctions()['dialer-assets'].path;
let assets = require(path);

const concurrencyBarrier = function(client, context, queue) {
    return assets.changeDialerCapacity(client, context, [queue], { forceCapacity: 0 });
}

exports.handler = async function(context, event, callback) {
    
    const client = context.getTwilioClient();
    
    const taskSid = event.TaskSid;
    
    const attributes = event.TaskAttributes;
    const { numbers, currentNumberIdx, queue, channel, attempts, retries, conversations } = JSON.parse(attributes);
    const { DOMAIN, TWILIO_NUMBER } = context;
    
    const workerAttributes = event.WorkerAttributes;

    const { bot } = JSON.parse(workerAttributes);
    
    let error = null
    
    if(bot) {
        
        if(channel == "voice"){
        
            try {
                
            	const call = await client.calls.create({
                    url: `https://${DOMAIN}/evaluate-call?taskSid=${taskSid}&queue=${queue}`,
                    statusCallback: `https://${DOMAIN}/evaluate-complete-call?taskSid=${taskSid}&queue=${queue}`,
                    to: numbers[currentNumberIdx],
                    from: TWILIO_NUMBER,
                    machineDetection: 'Enable'
                });
                
                console.log(call);
                
                await concurrencyBarrier(client, context, queue);
                
            } catch (err) {
                error = err;
                
                console.log(err);
            } 
            
            await assets.updateTaskToReporting(client, context, taskSid, () => ({
                ...JSON.parse(attributes),
                conversations: {
                    conversation_id: (conversations && conversations.conversation_id) || taskSid,
                    conversation_attribute_6: attempts,
                    conversation_attribute_7: retries,
                    external_contact: TWILIO_NUMBER,
                    direction: "Outbound",
                    initiated_by: "Power Dialer" 
                },
                customers: {
                    phone: numbers[currentNumberIdx]
                }
            })); 
        }
        
        callback(null, { 'instruction' : 'accept' });
        
    } else {
        callback(null);
    }
}