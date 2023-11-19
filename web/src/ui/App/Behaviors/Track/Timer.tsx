import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {useStore} from "../../../../data/store";
import {Select2, TextField2} from "../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import Box from "@mui/material/Box";
import {BasicDialog} from "../../../Components/Dialog.tsx";
import {useCallback, useEffect, useRef} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from 'zod'
import {WithHelp} from "../Upsert/Utils.tsx";
import ReactMarkdown from "react-markdown";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import IconButton from "@mui/material/IconButton";
import {fields_list_response} from "../../../../../../schemas/fields.ts";

export function TimerModal() {
  const view = useStore(s => s.behaviors.view)
  const field = useStore(s => view.fid && s.res.fields_list_response?.hash?.[view.fid])
  const [
    setView,
  ] = useStore(useCallback(s => [
    s.behaviors.setView,
  ], []))

  const close = useCallback(() => setView({view: null, fid: null}), [])
  return <BasicDialog
    open={view.view === 'timer'}
    onClose={close}
    size="xl"
    title="Timer"
  >
    {field && <TimerForm field={field} close={close} />}
  </BasicDialog>
}

// Separate form from the modal due to useForm data caching issues
type TimerForm = { field: fields_list_response, close: () => void }
function TimerForm({field, close}: TimerForm) {
  const form = useForm({
    resolver: zodResolver(z.object({timer: z.coerce.number()})),
    defaultValues: {timer: field?.timer || 25}
  })
  const [
    send,
    timerActivate
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.timerActivate
  ], []))

  const submit = useCallback((data) => {
    timerActivate({
      fid: field.id,
      status: "work",
      minutesDesired: data.timer
    })
    close()
    // save the time they use for future quick-start
    send("fields_put_request", {...field, timer: data.timer})
  }, [])

  const textField = <TextField2
    label="Minutes"
    form={form}
    name="timer"
    autoFocus
  />
  return <form onSubmit={form.handleSubmit(submit)}>
    <CardContent>
      <WithHelp
        field={textField}
        help={<ReactMarkdown>After the timer is up, if this task is scoreable, you'll get a point (and it will be checked off if applicable</ReactMarkdown>}
      />
    </CardContent>
    <CardActions>
      <Button
        type="submit"
      >
        Start
      </Button>
    </CardActions>
  </form>
}

export function TimerControls({fid}: {fid: string}) {
  const [
    timer,
    timerActivate
  ] = useStore(s => [
    s.behaviors.timer,
    s.behaviors.timerActivate
  ], shallow)

  const timerChange = useCallback(
    (status: "work" | "pause" | "stop") => () => timerActivate({fid, status}),
    [fid]
  )

  if (timer.fid !== fid) {return null}
  return <>
    <TimerSeconds />
    {
      timer.status === "work" ? <IconButton onClick={timerChange("pause")}>
        <PauseCircleIcon />
      </IconButton>
      : timer.status === "pause" ? <IconButton onClick={timerChange("start")}>
        <PlayCircleIcon />
      </IconButton>
      : <div>??</div>
    }
    <IconButton onClick={timerChange("stop")}>
      <StopCircleIcon />
    </IconButton>
  </>
}

// as a separate function to silo re-rendering on just the seconds variable
function TimerSeconds() {
  const [
    seconds,
    timer
  ] = useStore(s => [
    s.behaviors.timer.seconds,
    s.behaviors.timer
  ], shallow)
  const timeLeft = timer.minutesDesired * 60 - seconds
  return <Chip label={formatSecondsToMinutes(timeLeft)} />
}

// TODO this is copy/pasted from CreditsBanner; refactor
function formatSecondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}