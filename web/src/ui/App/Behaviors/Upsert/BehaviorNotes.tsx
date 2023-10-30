import {UpsertProps, WithHelp} from "./Utils.tsx";
import {useMemo} from "react";
import {TextField2} from "../../../Components/Form.tsx";
import ReactMarkdown from "react-markdown";

export function BehaviorNotes({form, field, isNew}: UpsertProps) {
  const help = useMemo(() => <ReactMarkdown>Just some notes for yourself about this behavior</ReactMarkdown>, [])
  return <>
    <WithHelp
      field={<TextField2 form={form} name="notes" label="Notes" multiline minRows={3} />}
      help={help}
    />
  </>
}