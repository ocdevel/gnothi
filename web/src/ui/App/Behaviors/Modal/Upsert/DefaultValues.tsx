import _ from "lodash";
import {UpsertProps} from "./Utils.tsx";
import React from "react";
import {Select2, TextField2} from "../../../../Components/Form.tsx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function DefaultValues({form, field, isNew}: UpsertProps) {
  const fid = field?.id
  const [type, default_value] = form.watch(["type", "default_value"])
  let defValHelp = {
    value: `Recommended if you don't plan on tracking behaviors daily`,
    ffill: `Auto-populates with the value from your last entry for this field`,
    average: `Defaults to the average across all your entries for this field`
  }
  const lastEntry = fid && _.last(field.history)
  if (lastEntry) { // only show if have values to work with
    defValHelp.ffill += ` (currently ${lastEntry.value})`
    defValHelp.average += ` (currently ${field.avg})`
  }
  defValHelp = defValHelp[default_value]

  return <>
    <Typography color="primary" variant={"body1"} fontWeight={500}>Setting a default value</Typography>
    <Typography mb={3} variant="body2">Default values are automatically assigned to your fields on days you don't manually update them, based on the option you select here.</Typography>
    <Select2
      name='default_value'
      label="Default"
      form={form}
      options={[
        {value: 'value', label: "Manual Default (Recommended)"},
        {value: 'ffill', label: "Yesterday's value"},
        {value: 'average', label: "Average Value"},
      ]}
      helperText={defValHelp}
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