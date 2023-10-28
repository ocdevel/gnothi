import {UpsertProps, WithHelp} from "./Utils.tsx";
import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DayPickerHelp from './Help/DayPicker.mdx'
import ResetPeriodHelp from './Help/ResetEvery.mdx'
import {useMemo} from "react";
import {Select2, TextField2} from "../../../Components/Form.tsx";
import ResetQuotaHelp from './Help/ResetQuota.mdx'
import ResetEveryHelp from './Help/ResetEvery.mdx'
import Accordions from "../../../Components/Accordions.tsx";
import {Stack2} from "../../../Components/Misc.tsx";

export function ResetPeriods(props: UpsertProps) {
  const {form} = props
  const [score_enabled] = form.watch(["score_enabled"])
  if (!score_enabled) {return null}

  const content = <Stack2>
    <ResetPeriod {...props} />
    <DayPicker {...props} />
    <PeriodNumber {...props} />
  </Stack2>

  return <Accordions
    defaultExpanded={0}
    accordions={[{title: "Scoring Periods", content}]}
  />
}

function ResetPeriod({form, field, isNew}: UpsertProps) {
  const help = useMemo(() => <ResetPeriodHelp />, [])
  const select2 = <Select2
    name="reset_period"
    label="Reset Period"
    form={form}
    options={[
      {value: "daily", label: "Daily"},
      {value: "weekly", label: "Weekly"},
      {value: "monthly", label: "Monthly"},
      // maybe later. Removing for, eg taxes should be a ToDo
      // {value: "yearly", label: "Yearly"},
      {value: "never", label: "Never"},
    ]}
  />
  return <WithHelp field={select2} help={help} />
}

function PeriodNumber({form, field, isNew}: UpsertProps) {
  const [reset_period, reset_every] = form.watch(["reset_period", "reset_every"])
  const resetEveryHelp = useMemo(() => <ResetEveryHelp />, [])
  const resetQuotaHelp = useMemo(() => <ResetQuotaHelp />, [])
  if (reset_period === "daily") {return null}
  return <>
    <WithHelp
      field={<TextField2 form={form} name="reset_every" label="Reset Every" type="number" />}
      help={resetEveryHelp}
    />
    <WithHelp
      field={<TextField2 form={form} name="reset_quota" label="Reset Quota" type="number" />}
      help={resetQuotaHelp}
    />
  </>
}

function DayPicker({field, form, isNew}: UpsertProps) {
  const [reset_period] = form.watch(["reset_period"])
  const help = useMemo(() => <DayPickerHelp />, [])
  if (reset_period !== "daily") {return null}
  const days = <Box>
    <ButtonGroup aria-label="days of the week">
      <DayButton form={form} day="monday" />
      <DayButton form={form} day="tuesday" />
      <DayButton form={form} day="wednesday" />
      <DayButton form={form} day="thursday" />
      <DayButton form={form} day="friday" />
      <DayButton form={form} day="saturday" />
      <DayButton form={form} day="sunday" />
    </ButtonGroup>
  </Box>
  return <WithHelp field={days} help={help} fieldTitle="Active Days" />
}

const dayMap = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "Th",
  friday: "F",
  saturday: "S",
  sunday: "Su",
}
interface DayButton {
  form: UpsertProps['form']
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
}
function DayButton({form, day}: DayButton) {
  const active = form.watch(day)
  return <Button
    onClick={() => form.setValue(day, !active)}
    variant={active ? 'contained' : 'outlined'}
  >
    {dayMap[day]}
  </Button>
}