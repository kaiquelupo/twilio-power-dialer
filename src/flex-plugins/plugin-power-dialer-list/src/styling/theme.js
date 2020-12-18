const sharedTheme = (theme) => ({
    boxDialpad: {
      marginTop: theme.spacing.unit * 5, 
      paddingTop: theme.spacing.unit * 5, 
      borderTop: '1px solid #eeeeee' 
    },  
    titleAgentDialpad: {
      width: '100%',
      textTransform: 'uppercase',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: theme.typography.fontSize
    }, 
    buttonBoxPreviewDialer: {
        marginTop: theme.spacing.unit * 3,
        display: 'flex',
        justifyContent: 'center',
        padding: theme.spacing.unit
    },  
    previewDialerBtn: {
      borderRadius: '100px',
      padding: '10px',
      minWidth: '0px'
    },
    scheduleDialerBtn: {
        borderRadius: '100px',
        marginRight: '10px',
        minWidth: '0px',
        color: 'white'
    },
    calendarIcon: {
        fill: 'white'
    },
    csvLabel: {
        textTransform: 'uppercase',
        marginBottom: theme.spacing.unit * 2
    },
    labelBox: {
        marginTop: theme.spacing.unit * 3,
    },
    contactListInfo: {
        marginTop: theme.spacing.unit
    },
    selectInput: {
        width: '100%'
    },
    dateBox: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: theme.spacing.unit * 3
    },
    dateInputBox: {
        flex: 1
    },
    dateInput: {
        width: '60px',
        textAlign: "center",
        height: theme.spacing.unit * 3,
        fontSize: "16px"
    },
    scheduleForm: {
        marginTop: theme.spacing.unit * 5
    }, 
    alertBox: {
        padding: theme.spacing.unit,
        border: "1px solid #CCC",
        marginTop: theme.spacing.unit * 3,
        fontSize: "12px",
        color: "#333"
    }
  })
  
export default sharedTheme