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

export function TimerModal() {
  const view = useStore(s => s.behaviors.view)
  const [
    setView,
    timerActivate
  ] = useStore(useCallback(s => [
    s.behaviors.setView,
    s.behaviors.timerActivate
  ], []))
  const form = useForm({
    resolver: zodResolver(z.object({timer: z.coerce.number()})),
    defaultValues: {timer: 25}
  })

  const close = useCallback(() => setView({view: null, fid: null}), [])
  const submit = useCallback((data) => {
    timerActivate({fid: view.fid, status: "work", minutesDesired: data.timer})
    setView({view: null, fid: null})
  }, [view.fid])

  // having trouble with autoFocus in TextField. Doing it manually.
  function setRef(element) {
    if (!element) {return}
    setTimeout(() => element.focus(), 1)
  }

  const textField = <TextField2
    autoFocus
    label="Minutes"
    form={form}
    name="timer"
    inputRef={setRef}
  />

  return <BasicDialog
    open={view.view === 'timer'}
    onClose={close}
    size="xl"
    title="Timer"
  >
    <form onSubmit={form.handleSubmit(submit)}>
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
  </BasicDialog>
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