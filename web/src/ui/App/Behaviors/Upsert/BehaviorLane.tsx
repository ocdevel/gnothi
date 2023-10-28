import {UpsertProps, WithHelp} from "./Utils.tsx";
import React, {useEffect, useMemo} from "react";
import TemplateHelp from "./Help/Lane.mdx";
import {Select2} from "../../../Components/Form.tsx";
import {Alert2} from "../../../Components/Misc.tsx";

export function BehaviorLane(props: UpsertProps) {
  const {form, field} = props
  const help = useMemo(() => <TemplateHelp />, [])
  const select = <Select2
    name='lane'
    label="Column"
    form={form}
    options={[
      {value: 'habit', label: "Habit"},
      {value: 'daily', label: "Daily"},
      {value: 'todo', label: "Todo"},
      {value: 'custom', label: "Custom"},
      {value: 'reward', label: "Reward"},
    ]}
    // helperText="Start here"
  />
  const habiticaNote = useMemo(() => {
    if (field?.service !== "habitica") {
      return null
    }
    return <Alert2 severity="warning" title="Habitica Dicsonnected">
      Due to Habitica instability, we can no longer sync Habitica tasks. We've converted your Habitica tasks into Gnothi Behaviors and moved them to the Data column. We recommend assigning their correct column now (Habit, Daily, To-Do, Reward, or Data) and tracking here instead, as we have big plans for habit-tracking natively in Gnothi.
    </Alert2>
  }, [field?.service])
  return <>
    <WithHelp field={select} help={help} />
    {habiticaNote}
  </>
}