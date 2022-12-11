import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import {ToolbarHeader} from "./Misc";
import Grid from "@mui/material/Grid";
import DialogTitle from "@mui/material/DialogTitle";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});


type OnClick = () => void
type Dialog = {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}
type FullScreenDialog = Dialog & {
  buttons?: React.ReactNode[]
}

export function FullScreenDialog({
  title, open, onClose, buttons, children
}: FullScreenDialog) {
  return (
    <Dialog
      disableEnforceFocus={true /* max callstack issue when popups inside modal */}
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose as OnClick}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          {/*<Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">*/}
          {/*  Sound*/}
          {/*</Typography>*/}
          <ToolbarHeader title={title} buttons={buttons} />
          {/*<Button autoFocus color="inherit" onClick={handleClose}>
            save
          </Button>*/}
        </Toolbar>
      </AppBar>
      {children}
    </Dialog>
  );
}

type BasicDialog = Omit<Dialog, 'title'> & {
  size: DialogProps["maxWidth"]
  title?: string
}
export function BasicDialog({
  open,
  onClose,
  title,
  children,
  size="xl"
}: BasicDialog) {
  return <Dialog
    disableEnforceFocus={true /* max callstack issue when popups inside modal */}
    maxWidth={size}
    open={open}
    onClose={onClose}
  >
    <Grid container direction='row' alignItems='center'>
      {title && <Grid item sx={{flex: 1}}>
        <DialogTitle>{title}</DialogTitle>
      </Grid>}
      <Grid item>
        <IconButton
          onClick={onClose as OnClick}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </Grid>
    </Grid>
    {children}
  </Dialog>
}
