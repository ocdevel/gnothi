import React, {useEffect, useMemo, useState} from "react";
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
import {useStore} from "../../../../../data/store";

export function BehaviorTemplate(props: UpsertProps) {
  const {form} = props
  const help = useMemo(() => <TemplateHelp />, [])
  const select = <Select2
    name='lane'
    label="Column"
    form={form}
    options={[
      {value: 'habit', label: "Habit"},
      {value: 'daily', label: "Daily"},
      {value: 'todo', label: "Todo"},
      {value: 'reward', label: "Reward"},
      {value: 'custom', label: "Custom"},
    ]}
    // helperText="Start here"
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