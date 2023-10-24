import _ from "lodash";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import React, {useMemo} from "react";
import {Select2, TextField2} from "../../../Components/Form.tsx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DefaultValuesHelp from './Help/DefaultValues.mdx'

export function AnalyzeAdvanced({form, field, isNew}: UpsertProps) {
  const fid = field?.id
  const [type, default_value, analyze_enabled] = form.watch(["type", "default_value", "analyze_enabled"])
  const defaultValuesHelp = useMemo(() => <DefaultValuesHelp />, [])
  if (!analyze_enabled) {return null}

  const lastEntry = fid && _.last(field.history)
  const options = lastEntry ? [
    {value: 'value', label: "Value (recommended)"},
    {value: 'ffill', label: `Yesterday's value (currently ${lastEntry.value})`},
    {value: 'average', label: `Average value (currently ${field.avg})`},
  ] : [
    {value: 'value', label: "Value (Recommended)"},
    {value: 'ffill', label: `Yesterday's value`},
    {value: 'average', label: `Average value`},
  ]

  const select2 = <Select2
    name='default_value'
    label="Default Value"
    form={form}
    options={options}
  />

  return <>
    <WithHelp
      field={select2}
      help={defaultValuesHelp}
    />
    <Box mt={2}>
      {default_value === 'value' && <>
        <TextField2
          name='default_value_value'
          className="input-default_value_value"
          label="Default Value"
          type="number"
          form={form}
          min={type === 'check' ? 0 : null}
          max={type === 'check' ? 1 : null}
          // helperText="Fill in the value which will be populated if you don't track for this day. Alternatively, you can leave it blank. If youdon't know, it's recommended alkfejkalseu rdfoiuase "
        />
      </>}
    </Box>
  </>
}