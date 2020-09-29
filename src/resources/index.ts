import { CheckServerless, Resource, Serverless } from 'twilio-pulumi-provider';
import * as pulumi from '@pulumi/pulumi';
import { getTaskRouterStructure } from './taskrouter';
import * as fs from 'fs';

const { queues } = getTaskRouterStructure();

const stack = pulumi.getStack();

const serviceName = 'power-dialer-serverless';
const domain = CheckServerless.getDomainName(serviceName, stack);

const flexWorkspace = new Resource("flex-workspace", {
    resource: ["taskrouter", "workspaces"],
    attributes: {
        sid: process.env.FLEX_WORKSPACE_SID,
        eventCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/event-handler`)
    }
});

const allQueuesResources:any[] = [];  
const filters:any[] = [];
const queueMap = {};

for(let i = 0; i < queues.length; i++){

    const { name } = queues[i];
    
    const automatedWorker = new Resource(`power-dialer-${name}-worker`, {
        resource: ["taskrouter", { "workspaces" : flexWorkspace.sid }, "workers"],
        attributes: {
            friendlyName: `power_dialer_${name}`,
            attributes: JSON.stringify({ 
                bot: true, 
                queue: name
            })
        }
    });

    const automatedQueue =  new Resource(`power-dialer-${name}-taskQueue`, {
        resource: ["taskrouter", { "workspaces" : flexWorkspace.sid }, "taskQueues"],
        attributes: {
            targetWorkers: `bot == true AND queue == "${name}"`,
            friendlyName: `To Call - ${name}`
        }
    });

    
    const commonQueue = new Resource(`${name}-taskQueue`, {
        resource: ["taskrouter", { "workspaces" : flexWorkspace.sid }, "taskQueues"],
        attributes: {
            targetWorkers: `bot != true AND queues HAS "${name}"`,
            friendlyName: name
        }
    });

    allQueuesResources.push(automatedQueue);
    allQueuesResources.push(commonQueue);

    //Workflow Filters

    filters.push({
        friendlyName: `To Call - ${queues[i].name}`,
        expression: `dialer == true AND queue == "${queues[i].name}"`,
        targets: [
            {
                queue: automatedQueue.sid,
                expression: "taskrouter.currentTime > task.callAfterTime"
            }   
        ]
    });

    filters.push({
        friendlyName: queues[i].name,
        expression: `dialer == false AND queue == "${queues[i].name}"`,
        targets: [
            {
                queue: commonQueue.sid
            }   
        ]
    })

    //Mapping between Automated Worker and Common Queue

    queueMap[queues[i].name] = {
        sid: commonQueue.sid,
        dialer: automatedWorker.sid
    }

}

const heartbeatQueue = new Resource(`heartbeat-taskQueue`, {
    resource: ["taskrouter", { "workspaces" : flexWorkspace.sid }, "taskQueues"],
    attributes: {
        targetWorkers: "1=0",
        friendlyName: "Heartbeat Queue"
    }
});

filters.push({
    friendlyName: "Heartbeat Filter",
    expression: `heartbeat == true`,
    targets: [
        {
            queue: heartbeatQueue.sid,
            timeout: 60
        }   
    ]
});


const workflow = new Resource("power-dialer-workflow", {
    resource: ["taskrouter", { "workspaces" : flexWorkspace.sid }, "workflows"],
    attributes: {
        assignmentCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/make-call`),
        friendlyName: 'Power Dialer Workflow',
        configuration: pulumi.all([filters])
            .apply(([filters]) => JSON.stringify(
                {
                    task_routing: {
                        filters
                    }
                }
            ))
    }
});

pulumi.all([queueMap]).apply(
    ([queueMap]) => fs.writeFile("../serverless/main/assets/queueMap.private.json", JSON.stringify(queueMap), () => {})
);

const serverless = new Serverless("power-dialer-functions-assets", {
    attributes: {
        cwd: `../serverless/main`,
        serviceName,          
        envPath: `.${stack}.env`,
        env: {
            DOMAIN: domain,
            WORKSPACE_SID: flexWorkspace.sid,
            WORKFLOW_SID: workflow.sid,
            TWILIO_NUMBER: process.env.TWILIO_NUMBER,
            RETRY_TIME_IN_MINUTES: process.env.RETRY_TIME_IN_MINUTES
        },
        functionsEnv: stack,
        pkgJson: require("../serverless/main/package.json")
    }
});
 
export let output =  {
    flexWorkspaceSid: flexWorkspace.sid,
    workflowSid: workflow.sid,
    serverlessSid: serverless.sid
}
