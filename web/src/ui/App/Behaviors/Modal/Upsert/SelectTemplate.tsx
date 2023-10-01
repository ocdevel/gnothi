import React, {useMemo} from "react";
import {Select2} from "../../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import {useUpsertStore} from "./upsertStore.ts";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {Stack2} from "../../../../Components/Misc.tsx";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import SelectTemplateHelp from './Help/SelectTemplate.mdx'


export function SelectTemplate({form, field}: UpsertProps) {
  const type = form.watch('type')

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

  return <WithHelp field={select} help={help} helpTitle="Behavior Type" />
}