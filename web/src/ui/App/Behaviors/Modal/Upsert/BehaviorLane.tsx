import {UpsertProps, WithHelp} from "./Utils.tsx";
import React, {useEffect, useMemo} from "react";
import TemplateHelp from "./Help/Lane.mdx";
import {Select2} from "../../../../Components/Form.tsx";

export function BehaviorLane(props: UpsertProps) {
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