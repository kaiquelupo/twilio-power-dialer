import React from 'react';
import { FlexPlugin } from 'flex-plugin';

import PowerDialer from "./components/PowerDialer";

const PLUGIN_NAME = 'PowerDialerListPlugin';

export default class PowerDialerListPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {

    flex.OutboundDialerPanel.Content.add(<PowerDialer key="power-dialer-dialpad" flex={flex} manager={manager} />)

    manager.strings.TaskInfoPanelContent = ` 
      <h1>TASK CONTEXT</h1>
      <h2>Task type</h2>
      <p>{{task.attributes.direction}}</p>
      <h2>Task created on</h2>
      <p>{{task.dateCreated}}</p>
      <h2>Task priority</h2>
      <p>{{task.priority}}</p>
      <h2>Task queue</h2>
      <p>{{task.taskQueueName}}</p>
      <hr />
      <h1>CUSTOMER CONTEXT</h1>
      <h2>Customer Name</h2>
      <p>{{task.attributes.customers.name}}</p>
      <h2>Phone number</h2>
      <p>{{task.attributes.customers.phone}}</p>
      <h2>Campaign</h2>
      <p>{{task.attributes.conversations.campaign}}</p>
      {{#each task.attributes.optionalInfo}}
        <h2>{{name}}</h2>
        <p>{{value}}</p> 
      {{/each}}
      <h2>Actions</h2>
      {{#each task.attributes.actions}}
        <p><a href='{{value}}' target="_blank">{{name}}</a></p> 
      {{/each}}
    `;

  }

}
