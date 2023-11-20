import {useForm} from "react-hook-form";
import {fields_list_response, fields_post_request} from "../../../../../../schemas/fields.ts";
import {useStore} from "../../../../data/store";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
  return subtasks.map(child => <ViewSubtask key={child.id} parent={f} child={child} />)
}

type ViewSubtask = {parent: fields_list_response, child: fields_list_response}
function ViewSubtask({parent, child}: ViewSubtask) {
  const [editingId] = useStore(s => [s.behaviors.subtask.editingId], shallow)
  const [
    send,
    setEditingId,
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.subtask.setEditingId
  ], []))
  // const f = useStore(s => s.res.fields_list_response?.hash?.[fid], shallow)
  const flex = {display: "flex", alignItems: "center"}
  const changeCheck = () => {
    send("fields_put_request", {
      ...child,
      score_period: child.score_period > 0 ? 0 : 1,
    })
  }

  const childName = useMemo(() => {
    if (editingId === child.id) {
      return <Upsert parent={parent} child={child} />
    }
    if (editingId !== child.id) {
      return <Box sx={{flex:1, width: "100%"}} onClick={() => setEditingId(child.id)}>
        <BehaviorName name={child.name} />
      </Box>
    }
  }, [editingId, child])

  return <Box>
    <Box sx={{...flex, justifyContent: "space-between"}}>
      <Box sx={flex}>
        <Checkbox
          defaultChecked
          className="check"
          checked={child.score_period > 0}
          onChange={changeCheck}
        />
        {childName}
      </Box>
      <Box>
        <IconButton onClick={() => {}}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
    <BehaviorNotes notes={child.notes} />
  </Box>
}

function AddSubtask({f}: F) {
  const subtaskParentId = useStore(s => s.behaviors.subtask.parentId)
  if (subtaskParentId !== f.id) {return null}
  return <Upsert parent={f} />
}


interface Upsert {
  parent: fields_list_response
  child?: fields_list_response
  onSubmit?: () => void
}
function Upsert({parent, child}: Upsert) {
  const [
    send,
    setParentId
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.subtask.setParentId,
  ], []))

  const form = useForm({
    defaultValues: fields_post_request.parse({
      name: child?.name || "",
      type: "check",
      lane: parent.lane
    })
  })

  const inputRef = useRef(null)
  function setRef(el: any) {
    if (!el) {return}
    inputRef.current = el
    setTimeout(() => el.focus(), 1)
  }

  const submit = useCallback((data) => {
    if (child) {
      send("fields_put_request", {...data, id: child.id})
    }
    else {
      send("fields_post_request", {...data, parent_id: parent.id})
      form.setValue("name", "")
    }
  }, [])

  const clear = useCallback(() => {
    if (inputRef.current) {
      setParentId(null)
    }
  }, [inputRef.current])

  // useHotkeys('esc', clear)

  const textfieldKeyDown = useCallback((e: any) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // Prevent the default escape key behavior
      clear(); // Your clear function
      e.stopPropagation(); // Stop the event from bubbling up
    }
  }, [])

  return <form onSubmit={form.handleSubmit(submit)}>
    <TextField2
      variant="standard"
      onKeyDown={textfieldKeyDown}
      inputRef={setRef}
      form={form}
      name="name"
      onBlur={clear}
    />
  </form>
}

