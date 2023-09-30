import React from "react";
import {Select2} from "../../../../Components/Form.tsx";
import {shallow} from "zustand/shallow";
import {useUpsertStore} from "./upsertStore.ts";

export function SelectTemplate() {
  const [form] = useUpsertStore(s => [s.form], shallow)
  const type = form?.watch('type')

  if (!form) {return null}

  const typeHelp = {
    number: "Track quantities, like hours slept or glasses of water",
    fivestar: "Rate aspects of your life. Perfect for things like mood, productivity, etc",
    check: "Simple yes or no for daily habits, like exercise or meditation",
    option: "NOT YET BUILT"
  }[type || "number"]

  return <Select2
    name='type'
    label="Type"
    form={form}
    options={[
      {value: 'number', label: "Number"},
      {value: 'fivestar', label: "Five-Star"},
      {value: 'check', label: "Check"},
    ]}
    helperText={typeHelp}
  />
}