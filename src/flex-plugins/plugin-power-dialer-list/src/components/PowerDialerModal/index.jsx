import React from 'react';
import sharedTheme from '../../styling/theme';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

const styles = theme => (sharedTheme(theme));

class PowerDialerModal extends React.Component {

    render() {
        const { open, onClose, message } = this.props;

        return (
            <Dialog open={open} onClose={onClose}>
                <DialogContent>
                    { message }
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={onClose}
                        color="secondary"
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        )   
    }
}

export default withStyles(styles)(PowerDialerModal);