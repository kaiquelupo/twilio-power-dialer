const fs = require('fs');

const path = Runtime.getAssets()['/queueMap.json'].path;
const queueMap = JSON.parse(fs.readFileSync(path));

const getAvailableWorkersFromQueue = async function (client, context, sid) {
    
    const { 
        totalAvailableWorkers, 
        tasksByStatus: { 
            assigned,
            wrapping,
            reserved
        } 
    } = await client.taskrouter.workspaces(context.WORKSPACE_SID)
      .taskQueues(sid)
      .realTimeStatistics()
      .fetch();
                
    return totalAvailableWorkers - (assigned + wrapping + reserved);
}

exports.changeDialerCapacity = async function (client, context, queues, params ) {
    try {
        
        if(!queues) {
            queues = Object.keys(queueMap).map(key => key);
        } 
        
        return await Promise.all(queues.map(async (currentQueue) => {

            const queue = queueMap[currentQueue];

            if(queue){
            
                const { sid, dialer } = queue;
                
                let capacity = (params && params.forceCapacity);
            
                if(capacity == null) {
                    capacity = await getAvailableWorkersFromQueue(client, context, sid);
                }
        
                return await client.taskrouter.workspaces(context.WORKSPACE_SID)
                    .workers(dialer)
                    .workerChannels("default")
                    .update({ capacity: (capacity > 0) ? capacity : 0 });
            }
            
        }));
        
    } catch(ex) {
        console.log(ex);
    }
}; 

exports.updateTaskToReporting  = async function (client, context, taskSid, get_attributes, configs) {
    
    const task = await client.taskrouter.workspaces(context.WORKSPACE_SID)
                     .tasks(taskSid)
                     .fetch();
                 
    return client.taskrouter.workspaces(context.WORKSPACE_SID)
        .tasks(taskSid)
        .update({ 
           attributes: JSON.stringify(get_attributes(JSON.parse(task.attributes))),
           ...(configs || {})
        });
}