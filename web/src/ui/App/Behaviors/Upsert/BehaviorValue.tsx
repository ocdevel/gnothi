import React, {useEffect, useMemo, useState} from "react";
import {TextField2} from "../../../Components/Form.tsx";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import ValueHelp from './Help/Value.mdx'

export function BehaviorValue(props: UpsertProps) {
  const {form, field} = props
  const help = useMemo(() => <ValueHelp />, [])
  const textfield = <TextField2
    name='points'
    label="Points"
    form={form}
    type="number"
    // helperText={typeHelp}
  />
  return <>
    <WithHelp field={textfield} help={help} />
  </>
}