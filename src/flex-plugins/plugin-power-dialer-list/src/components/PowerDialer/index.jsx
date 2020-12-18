import React from 'react';
import sharedTheme from '../../styling/theme';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { Icon } from '@twilio/flex-ui';
import { request } from '../../helpers/request';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { getAttributes } from '../../helpers/configuration';
import Tooltip from '@material-ui/core/Tooltip';
import PowerDialerModal from '../PowerDialerModal';
import { compact, flatten, chunk } from "lodash";
import { backOff } from "exponential-backoff";
import { CSVReader } from 'react-papaparse'
import { ID } from '../../helpers/utils';

const styles = theme => (sharedTheme(theme));

class PreviewDialer extends React.Component {

    state = { 
        contacts: [],
        campaign: { name: "Default"},
        openModal: false,
        schedule: null,
        modalMessage: "",
        loading: false
    };

    handleOnDrop = (data) => {
        if(data) {
            this.setState({ 
                contacts: 
                    data.reduce((pr, cur) => [...pr, cur.data], []) 
            });
        }
    }
    
    handleOnError = (err, file, inputElem, reason) => {
        console.log(err)
    }

    handleOnRemoveFile = (data) => {
        this.setState({ 
            contacts: [] 
        });
    }

    handleCall = async () => {

        this.setState({ loading: true });

        const groupsOfRequests = chunk(this.state.contacts, Math.floor((this.state.contacts.length / 10) + 1));

        let requests = [];

        const batchCode = ID();

        for(let i =0 ; i < groupsOfRequests.length; i++) {

            requests = [
                ...requests, 
                await Promise.all(groupsOfRequests[i].map(async contact => {

                try {
                
                    await backOff(() => {

                        return request("plugin/create-task", this.props.manager, { 
                            contact: JSON.stringify(contact),
                            campaign: this.state.campaign.name, 
                            batchCode
                        })

                    }
                    , {
                        jitter: "full",
                        numOfAttempts: 3
                    });

                    return null

                } catch (err) {

                    return contact;

                }

                }))
            ]
        }

        const requestsWithErrors = compact(flatten(requests));
        
        if(requestsWithErrors.length > 0) {
            
            const names = requestsWithErrors.reduce((pr, cur) => [...pr, cur.name], []).join(",");

            this.setState({ 
                openModal: true, 
                modalMessage: `Something is not right when sending the following contacts to the Power Dialer: ${names}` 
            });

        } else {

            this.setState({ openModal: true, modalMessage: "All contacts were sent successfully to the Power Dialer" });

        }

        this.setState({ loading: false });
    }

    handleChange = event => {
        const campaignName = event.target.value;
        const { campaigns } = getAttributes(this.props.manager); 

        const campaign = campaigns.find(({ name }) => campaignName === name ) || {};

        this.setState({ schedule: campaign.schedule });
        this.setState({ campaign });
    }

    render() {
        const { classes, manager } = this.props;
        const disabled = this.state.contacts.length === 0;
        const numberOfContacts = this.state.contacts.length;

        const { campaigns } = getAttributes(manager); 

        return (
            <div className={classes.boxDialpad}>

                <div className={classes.titleAgentDialpad}>Power Dialer</div>

                <FormControl className={classes.formControl}>
                    
                    <div className={classes.labelBox}>
                        <div className={classes.csvLabel}>Campaign</div>
                        <Select
                            value={this.state.campaign.name}
                            onChange={this.handleChange}
                            style={{
                                width: '100%'
                            }}
                        >
                             <MenuItem value="" key="label" disabled>
                                Select a campaign (optional)
                            </MenuItem>

                            {
                                campaigns && campaigns.map(({ name }) => (
                                    <MenuItem value={name} key={`select_${name}`}>
                                        {name}
                                    </MenuItem>
                                ))
                            }
                                    
                        </Select>
                    </div>

                    <div className={classes.labelBox}>
                        <div className={classes.csvLabel}>Select CSV file</div>
                         <CSVReader
                            onDrop={this.handleOnDrop}
                            onError={this.handleOnError}
                            addRemoveButton
                            onRemoveFile={this.handleOnRemoveFile}
                            config={{
                                header: true
                            }}
                        >
                            <span>Drop CSV file here or click to upload.</span>
                        </CSVReader>
                        {!disabled && <div className={classes.contactListInfo}>There {numberOfContacts === 1 ? `is ${numberOfContacts} contact` : `are ${numberOfContacts} contacts`} in this list</div>}
                        <div className={classes.buttonBoxPreviewDialer}>

                            <Tooltip title="Call now">
                                <div>
                                    {!this.state.loading ? 
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            disabled={disabled}
                                            onClick={this.handleCall}
                                            className={classes.previewDialerBtn}
                                        >
                                            <Icon icon="Call"/>
                                        </Button>
                                        :
                                        <div>Loading...</div>
                                    }
                                </div>
                            </Tooltip>
                        
                        </div>
                    </div>
   
                </FormControl>

                <PowerDialerModal 
                    open={this.state.openModal} 
                    message={this.state.modalMessage}
                    onClose={() => this.setState({ openModal: false })}
               />
            
            </div>
        )   
    }
}

export default withStyles(styles)(PreviewDialer);