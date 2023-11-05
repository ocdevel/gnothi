import {useForm} from "react-hook-form";
import {fields_list_response, fields_post_request} from "../../../../../../schemas/fields.ts";
import {useStore} from "../../../../data/store";
import React, {useCallback, useRef} from "react";
import Box from "@mui/material/Box";
import {TextField2} from "../../../Components/Form.tsx";
import { useHotkeys } from 'react-hotkeys-hook'
import {BehaviorName} from "../BehaviorName.tsx";
import {BehaviorNotes} from "./BehaviorNotes.tsx";
import Checkbox from "@mui/material/Checkbox";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from "@mui/material/IconButton";
import {shallow} from "zustand/shallow";

type F = {f: fields_list_response}
type Fid = {fid: string}
export function Subtasks({f}: F) {
  return <>
    <ListSubtasks f={f} />
    <AddSubtask f={f} />
  </>
}

function ListSubtasks({f}: F) {
  const fields = useStore(s => s.res.fields_list_response?.rows || [])
  const subtasks = fields.filter(f2 => f2.parent_id === f.id)
  return subtasks.map(f2 => <ViewSubtask k={f2.id} f={f2} />)
}

function ViewSubtask({f}: F) {
  // const [send] = useStore(useCallback(s => [s.send], []))
  // const f = useStore(s => s.res.fields_list_response?.hash?.[fid], shallow)
  const flex = {display: "flex", alignItems: "center"}
  const changeCheck = () => {
    send("fields_put_request", {
      ...f,
      score_period: f.score_period > 0 ? 0 : 1,
    })
  }
  return <Box>
    <Box sx={{...flex, justifyContent: "space-between"}}>
      <Box sx={flex}>
        <Checkbox
          defaultChecked
          className="check"
          checked={f.score_period > 0}
          onChange={changeCheck}
        />
        <BehaviorName key={f.id} name={f.name} />
      </Box>
      <Box>
        <IconButton onClick={() => {}}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
    <BehaviorNotes notes={f.notes} />
  </Box>
}

function AddSubtask({f}: F) {
  const subtaskParentId = useStore(s => s.behaviors.subtaskParentId)
  if (subtaskParentId !== f.id) {return null}
  return <AddSubtask_ f={f} />
}
function AddSubtask_({f}: F) {
  const [
    send,
    setSubtaskParentId
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.setSubtaskParentId,
  ], []))
  const form = useForm({
    defaultValues: fields_post_request.parse({ name: "", type: "check", lane: f.lane })
  })
  const submit = useCallback((data) => {
    send("fields_post_request", {...data, parent_id: f.id})
    form.setValue("name", "")
  }, [])

  const clear = useCallback(() => {
    setSubtaskParentId(null)
  }, [])
  // useHotkeys('esc', clear)

  return <form onSubmit={form.handleSubmit(submit)}>
    <TextField2
      autoFocus={true}
      onKeyUp={event => {
        if (event.key === 'Escape') {
          clear()
        }
      }}
      form={form}
      name="name"
      // FIXME I gotta figure this out. The field comes in blurred, so it immediately clears.
      // Maybe use some useRef to determine if it has a .current, before allowing clear?
      // onBlur={clear}
    />
  </form>
}

