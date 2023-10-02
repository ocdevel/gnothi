import React, {useEffect, useMemo} from "react";
import {Select2} from "../../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {Stack2} from "../../../../Components/Misc.tsx";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import SelectTemplateHelp from './Help/SelectTemplate.mdx'


export function SelectTemplate(props: UpsertProps) {
  const {form, field} = props
  const help = useMemo(() => <SelectTemplateHelp />, [])
  const select = <Select2
    name='type'
    label="Type"
    form={form}
    options={[
      {value: 'number', label: "Number"},
      {value: 'fivestar', label: "Five-Star"},
      {value: 'check', label: "Check"},
      {value: 'habit', label: "Habit"},
      {value: 'daily', label: "Daily"},
      {value: 'todo', label: "Todo"},
      {value: 'reward', label: "Reward"},
    ]}
    // helperText={typeHelp}
  />
  return <>
    <TemplateWatcher {...props} />
    <WithHelp field={select} help={help} helpTitle="Behavior Type" />
  </>
}

function TemplateWatcher({form, ...field}: UpsertProps) {
  const type = form.watch("type")
  useEffect(() => {
    if (["check", "fivestar", "number"].includes(type)) {
      // these are the base types, so we're good here. The other are templates, so they revert revert to
      // underlying base-types and they set certain presets
      return
    }
    // FIXME there's no form.setValues() (multiple), and instead there's form.reset({values}); but that resets
    // things like subscriptions, dirty states, etc. Which sucks, because the below causes a ton of re-renders
    form.setValue("score_enabled", true)
    form.setValue("analyze_enabled", true)
    form.setValue("reset_every", 1)
    form.setValue("monday", true)
    form.setValue("tuesday", true)
    form.setValue("wednesday", true)
    form.setValue("thursday", true)
    form.setValue("friday", true)
    form.setValue("saturday", true)
    form.setValue("sunday", true)
    form.setValue("reset_quota", 1)
    if (type === "habit") {
      form.setValue("type", "number")
      form.setValue("reset_period", "daily")
    } else if (type === "daily") {
      form.setValue("type", "check")
      form.setValue("reset_period", "daily")
    } else if (type === "todo") {
      form.setValue("type", "check")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", true)
    } else if (type === "reward") {
      form.setValue("type", "number")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", false)
    }
  }, [type])
  return null
}