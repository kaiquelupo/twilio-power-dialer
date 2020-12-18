import { FlexPlugin } from 'flex-plugin';
import { get } from 'lodash';

const PLUGIN_NAME = 'PowerDialerAutoAcceptPlugin';

export default class PowerDialerAutoAcceptPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {

    manager.workerClient.on("reservationCreated", reservation => {

      if(get(reservation, "task.attributes.conversations.preceded_by", null) === "Power Dialer") {
          
        flex.Actions.invokeAction("AcceptTask", {sid: reservation.sid});

      }

    })
 
  }

}
