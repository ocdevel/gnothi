import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {TransitionProps} from '@mui/material/transitions'
import Grid from "@mui/material/Grid";
import DialogTitle from "@mui/material/DialogTitle";
import AppBar, {CTA} from './AppBar'
import IconButton from "@mui/material/IconButton";
import {green} from "@mui/material/colors";
import DialogContent from "@mui/material/DialogContent";

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
  onClose: () => void,
  className?: string
  children: React.ReactNode
  backButton?: boolean
}
type FullScreenDialog = Dialog & {
  ctas?: CTA[]
}

export function FullScreenDialog({
  title,
  open,
  onClose,
  ctas,
  children,
  className,
  backButton
}: FullScreenDialog) {
  return (
    <Dialog
      className={className}
      disableEnforceFocus={true /* max callstack issue when popups inside modal */}
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      // keepMounted
    >
      <DialogContent
        sx={{backgroundColor: '#fafafa', p: 0, m: 0}}
      >
        <AppBar
          onClose={onClose}
          backButton={backButton}
          title={title}
          ctas={ctas}
          clearBottom={true}
        />
        {children}
      </DialogContent>
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
  className,
  size = "xl",
}: BasicDialog) {
  return <Dialog
    disableEnforceFocus={true /* max callstack issue when popups inside modal */}
    maxWidth={size}
    open={open}
    onClose={onClose}
    className={className}
    // keepMounted
  >
    <Grid
      container
      direction='row'
      alignItems='center'
      sx={{borderRadius: 3}}
    >
      {title && <Grid item sx={{flex: 1}}>
        <DialogTitle>{title}</DialogTitle>
      </Grid>}
      <Grid item>
        <IconButton
          onClick={onClose as OnClick}
          aria-label="close"
        >
          <CloseIcon/>
        </IconButton>
      </Grid>
    </Grid>
    {children}
  </Dialog>
}
