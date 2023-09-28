import {useStore} from "../../data/store";
import {shallow} from "zustand/shallow";
import React, {useMemo, useState} from "react";
import {BasicDialog} from "./Dialog.tsx";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import {CREDIT_MINUTES} from "../../../../schemas/users.ts";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AlertTitle from "@mui/material/AlertTitle";
import {Stack2} from "./Misc.tsx";
import Chip from "@mui/material/Chip";
import {create} from "zustand";

const useDialogStore = create<{show: boolean, setShow: (show: boolean) => void}>((set, get) => ({
  show: false,
  setShow: (show: boolean) => set({show}),
}))

function Dialog() {
  const [show, setShow] = useDialogStore(s => [s.show, s.setShow], shallow)
  return <BasicDialog open={show} onClose={() => setShow(false)} size="sm">
    <CardContent>
      <Typography>Share Gnothi on social media, Reddit, etc. Email proof (a link or screenshot) to gnothi@gnothiai.com and we'll send you 7 free credits. One use per customer.</Typography>
    </CardContent>
  </BasicDialog>
}
const dialog = <Dialog />

export function CreditBanner() {
  const [
    creditActive,
    creditSeconds,
    me,
    setPremium
  ] = useStore(s => [
    s.creditActive,
    s.creditSeconds,
    s.user?.me,
    s.modals.setPremium
  ], shallow)
  const setShow = useDialogStore(s => s.setShow)

  if (!creditActive) { return null }
  if (!me) { return null }
  const timeLeft = CREDIT_MINUTES * 60 - creditSeconds

  return <>
    <Alert
      icon={false}
      severity="info"
      className='credit-banner'
      action={<Stack direction='column' gap={1}>
        <Button variant='outlined' color="inherit" size="small" onClick={() => setPremium(true)}>
          Upgrade for Unlimited
        </Button>
        <Button variant='text' color="inherit" size="small" onClick={() => setShow(true)}>
          Share for +7 Credits
        </Button>
      </Stack>}
      // sx={{display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "column"}}
    >
      <AlertTitle className='n-credits'>{me?.credits} / 10 credits</AlertTitle>
      <Stack2 direction='row'>
        <Typography>Credit active:</Typography>
        <Chip className='timer' variant="outlined" label={formatSecondsToMinutes(timeLeft)} />
      </Stack2>
    </Alert>

    {dialog}
  </>
}

function formatSecondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}