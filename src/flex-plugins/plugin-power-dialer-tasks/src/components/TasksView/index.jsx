import React from 'react';
import { request } from '../../helpers/request';
import { withStyles } from '@material-ui/core/styles';
import { Table,TableBody, TableCell, TableHead, TableRow, Checkbox, TextField, Button} from '@material-ui/core';
import './styles.css';
import { compact, chunk, flatten } from "lodash";
import { backOff } from "exponential-backoff";

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    table: {
        minWidth: 700,
    }, 
    textField: {
        width: '50%',
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit
    },
    button: {
        margin: theme.spacing.unit,
    }
});

class TasksView extends React.Component {

    state = {
        tasks: [],
        dialer: true,
        loading: false,
        selected: [],
        searchText: ""
    }

    transformSearchText = () => {

        let finalText = `${this.state.searchText}`;

        const replaces = [
            { before: "contact_numbers", after: "numbers" },
            { before: "contact_name", after: "requiredInfo.name"},
            { before: "campaign", after: "requiredInfo.campaign"},
            { before: "next_attempt_after", after: "callAfterTime"},
            { before: "batch_code", after: "batchCode"}
        ]

        replaces.forEach(replaceItem => {
            finalText = finalText.replace(replaceItem.before, replaceItem.after)
        })

        return finalText;
    }

    getTasks = async () => {
        const { searchText } = this.state;

        try {

            this.setState({ loading: true, tasks:[] });

            const results = await request("plugin/get-power-dialer-tasks", this.props.manager, { 
                filter: 'dialer == true ' + ((searchText !== "") ? ` AND ${this.transformSearchText(searchText)}` : "")
            })

            this.setState({ tasks: results.map(result => {

                const { 
                    numbers: contactNumbers,
                    requiredInfo: {
                        name: contactName,
                        campaign,
                    },
                    attempts,
                    callAfterTime,
                    retries,
                    batchCode
                } = JSON.parse(result.attributes);

                const { sid } = result;
                
                return {
                    contactName,
                    contactNumbers: contactNumbers.join(","),
                    sid,
                    campaign,
                    attempts: `${attempts}/${retries}`,
                    nextAttemptAfter: callAfterTime,
                    batchCode
                }
            })});

        } catch(err) {

            alert(`Something went wrong! Please reload the page or contact IT. Error: ${err}`);

        }

        this.setState({ loading: false })
    }

    componentDidMount() {
        this.getTasks();  
    }

    handleRemoval = async () => {

        if(this.state.selected.length > 0) { 

            this.setState({ loading: true });

            const groupsOfRequests = chunk(this.state.selected, Math.floor((this.state.selected.length / 10) + 1));

            let requests = [];

            for(let i =0 ; i < groupsOfRequests.length; i++) {

                requests = [
                    ...requests, 
                    await Promise.all(groupsOfRequests[i].map(async taskSid => {

                        try {
                        
                            await backOff(() => {
        
                                return request("plugin/remove-task", this.props.manager, { 
                                    taskSid
                                })
        
                            }
                            , {
                                jitter: "full",
                                numOfAttempts: 3
                            });
        
                            return null
        
                        } catch (err) {
        
                            return taskSid;
        
                        }
        
                    }))
                ]

            }

            const requestsWithErrors = compact(flatten(requests));
            
            if(requestsWithErrors.length > 0) {

                const sids = requestsWithErrors.join(",");

                this.setState({ 
                    openModal: true, 
                    modalMessage: `Something is not right when removing the following tasks: ${sids}` 
                });

            } else {

                this.setState({ openModal: true, modalMessage: "All selected tasks were successfully remove from the Power Dialer" });

            }

            this.setState({ loading: false, selected: [] });

            this.getTasks();
        }
    }

    render(){
        const { classes } = this.props;

        const numberOfTasks = this.state.tasks.length;

        const allSelected = 
            (numberOfTasks === this.state.selected.length) && this.state.selected.length > 0;


        return (
            <div className="pdTableWrapper">
                <div className="header"> 
                    <TextField
                        id="outlined-name"
                        label="Query"
                        className={classes.textField}
                        value={this.state.searchText}
                        onChange={(event) => this.setState({ searchText: event.target.value })}
                        variant="outlined"
                    />
                    <div className="headerButtons">
                        <Button variant="contained" color="primary" className={classes.button} onClick={this.getTasks}>
                            Search
                        </Button>
                        <Button variant="contained" color="primary" className={classes.button} onClick={this.getTasks}>
                            Refresh
                        </Button>
                        <Button 
                            variant="contained" color="secondary" 
                            className={classes.button} 
                            onClick={this.handleRemoval}
                            disabled={this.state.selected.length === 0}
                        >
                            Remove
                        </Button>
                        {this.state.loading && "Loading"}
                    </div>
                </div>
                {!this.state.loading && <Table className={classes.table}>
                    <TableHead>
                    <TableRow>
                        <TableCell>
                            <Checkbox
                                // indeterminate={}
                                checked={allSelected}
                                onChange={() => {
                                    if(allSelected) {
                                        this.setState({ selected: []})
                                    } else {
                                        this.setState({ 
                                            selected: this.state.tasks.reduce((pr, cur) => [...pr, cur.sid], [])
                                        })
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>TaskSID</TableCell>
                        <TableCell>Contact Numbers</TableCell>
                        <TableCell>Contact Name</TableCell>
                        <TableCell>Campaign</TableCell>
                        <TableCell>Batch Code</TableCell>
                        <TableCell>Attempts</TableCell>
                        <TableCell>Next Attempt After</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {this.state.tasks.map(row => {

                        const nextAttempt = row.nextAttemptAfter === 0 ? 
                            "-" : 
                            `${row.nextAttemptAfter}`.substring(0,2) + ":" + 
                            `${row.nextAttemptAfter}`.substring(2,4) + " UTC"

                        const selected = this.state.selected.includes(row.sid);
                        
                        return (
                            <TableRow key={row.sid}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        // indeterminate={}
                                        checked={selected}
                                        onChange={() => { 
                                            if(!selected) {
                                                this.setState({ selected: [...this.state.selected, row.sid ]})
                                            } else {
                                                this.setState({ selected: this.state.selected.filter(elem => elem !== row.sid )})
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {row.sid}
                                </TableCell>
                                <TableCell>
                                    {row.contactNumbers}
                                </TableCell>
                                <TableCell>{row.contactName}</TableCell>
                                <TableCell>{row.campaign}</TableCell>
                                <TableCell>{row.batchCode}</TableCell>
                                <TableCell>{row.attempts}</TableCell>
                                <TableCell>{nextAttempt}</TableCell>
                            </TableRow>
                        )
                    })}
                    </TableBody>
                </Table>}
                {numberOfTasks === 200 && 
                    <div className="moreTasksInfo">
                        There are more than 200 tasks in this list but it is not possible to show them all. 
                        To check tasks outside the above list, please use the search bar on the top of this page.
                    </div>
                }
            </div>
        )
    }
}

export default withStyles(styles)(TasksView);