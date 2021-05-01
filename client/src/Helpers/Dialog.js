import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import {DialogContent} from "@material-ui/core";

import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

export function BasicDialog({
  open,
  onClose,
  title,
  children,
  size="xl"
}) {
  const classes = useStyles();

  return <Dialog
    maxWidth={size}
    open={open}
    onClose={onClose}
    aria-labelledby="dialog-title"
  >
    <DialogTitle id="dialog-title">{title}</DialogTitle>
    {children}
  </Dialog>
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function FullScreenDialog({title, children, open, handleClose}) {
  const classes = useStyles();

  return <>
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <AppBar className={classes.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title} component="div">
            {title}
          </Typography>
          {/*<Button autoFocus color="inherit" onClick={handleClose}>
            save
          </Button>*/}
        </Toolbar>
      </AppBar>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  </>
}
