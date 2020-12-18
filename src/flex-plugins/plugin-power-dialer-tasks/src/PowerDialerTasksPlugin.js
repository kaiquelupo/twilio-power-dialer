import React from 'react';
import { FlexPlugin } from 'flex-plugin';

import TasksView from './components/TasksView';

const PLUGIN_NAME = 'PowerDialerTasksPlugin';

export default class PowerDialerTasksPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {

    flex.ViewCollection.Content.add(
      <flex.View name="power-dialer-tasks" key="power-dialer-tasks-key" >
        <TasksView manager={manager} />
      </flex.View>
    );

    flex.SideNav.Content.add(
      <flex.SideLink
        showLabel={ true }
        icon="Directory"
        isActive={true}
        onClick={() => { 
          flex.Actions.invokeAction("HistoryPush", `/power-dialer-tasks/`); 
        }}
        key="PowerDialerTasksLink"
      >
        Power Dialer Tasks
      </flex.SideLink>
    );

  }

}
