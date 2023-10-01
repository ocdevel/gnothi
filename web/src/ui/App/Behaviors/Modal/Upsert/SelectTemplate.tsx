import React, {useMemo} from "react";
import {Select2} from "../../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import {useUpsertStore} from "./upsertStore.ts";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {Stack2} from "../../../../Components/Misc.tsx";
import Typography from "@mui/material/Typography";

export function SelectTemplate({form, field}: UpsertProps) {
  const type = form.watch('type')

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
  const help = useMemo(() => <>
    <Typography>Behaviors can be used for data-tracking, habit-tracking, or both. The 3 core types are <code>number</code>, <code>fivestar</code>, and <code>check</code>. Everything else is a "template" which combines these core types with advanced attributes.
      <ul>
        <li><code>Number</code>: track <em>quantities</em>; like hours slept or glasses of water.</li>
        <li><code>Five-Star</code>: track <em>qualities</em>. Eg, rate aspects of your life like mood or productivity.</li>
        <li><code>Check</code>: track <em>yes/no</em>; like taking medication, menstrual cycles, etc.</li>
      </ul>
    </Typography>
    <Typography>You'll use the above to track raw data for analysis. If you also want to gamify habit-tracking - using a points-based system (rewards and punishment) - then you can select from additional templates. These templates are nothing more than the above types, but with certain advanced attributes set (eg enabling points and reset periods).
      <ul>
        <li><code>Habit</code>: based on <code>number</code>, track habits which count multiple times per day (either good or bad). Cigarettes, glasses of water, pushups, pomodoros, etc.</li>
        <li><code>Daily</code>: based on <code>check</code>, track things you want to do once per day (or a specific number per day); like going to the gym, taking your medication, etc.</li>
        <li><code>Todo</code>: based on <code>check</code>, track things you want to do once ever.</li>
        <li><code>Reward</code>: based on <code>number</code>: track when you cash out on rewards, which you earned from points above.</li>
      </ul>
    </Typography>
  </>, [])

  return <WithHelp field={select} help={help} helpTitle="Behavior Type" />
}