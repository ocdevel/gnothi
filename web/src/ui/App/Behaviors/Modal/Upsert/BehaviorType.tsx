import React, {useEffect, useMemo} from "react";
import {Select2} from "../../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {Stack2} from "../../../../Components/Misc.tsx";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import TypeHelp from './Help/Type.mdx'
import TemplateHelp from './Help/Template.mdx'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod"


export function BehaviorTemplate(props: UpsertProps) {
  const form = useForm({
    resolver: zodResolver(z.object({
      template: z.enum(["data", "habit", "daily", "todo", "reward"]).default("data"),
    })),
  })
  const template = form.watch("template")
  useEffect(() => {
    const {form} = props
    // FIXME there's no form.setValues() (multiple), and instead there's form.reset({values}); but that resets
    // things like subscriptions, dirty states, etc. Which sucks, because the below causes a ton of re-renders
    if (template === "data") {
      form.setValue("score_enabled", false)
      form.setValue("analyze_enabled", true)
      form.setValue("type", "fivestar")
      return
    }

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
    if (template === "habit") {
      form.setValue("type", "number")
      form.setValue("reset_period", "daily")
      return
    }
    if (template === "daily") {
      form.setValue("type", "check")
      form.setValue("reset_period", "daily")
      form.setValue("default_value", "value")
      form.setValue("default_value_value", 0)
      return
    }
    if (template === "todo") {
      form.setValue("type", "check")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", true)
      return
    }
    if (template === "reward") {
      form.setValue("type", "number")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", false)
      return
    }
  }, [template])
  const help = useMemo(() => <TemplateHelp />, [])
  const select = <Select2
    name='template'
    label="Template"
    form={form}
    options={[
      {value: 'habit', label: "Habit"},
      {value: 'daily', label: "Daily"},
      {value: 'todo', label: "Todo"},
      {value: 'reward', label: "Reward"},
      {value: 'data', label: "Data"},
    ]}
    // helperText={typeHelp}
  />
  return <WithHelp field={select} help={help} />
}

export function BehaviorType(props: UpsertProps) {
  const {form, field} = props
  const help = useMemo(() => <TypeHelp />, [])
  const select = <Select2
    name='type'
    label="Type"
    form={form}
    options={[
      {value: 'number', label: "Number"},
      {value: 'fivestar', label: "Five-Star"},
      {value: 'check', label: "Check"},
    ]}
    // helperText={typeHelp}
  />
  return <>
    <WithHelp field={select} help={help} />
  </>
}