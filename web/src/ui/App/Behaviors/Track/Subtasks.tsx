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
import produce from "immer";

type F = {f: fields_list_response}
type ParentChild = {parent: fields_list_response, child: fields_list_response}
type ParentNoChild = {parent: fields_list_response}
type ParentOptionalChild = {parent: fields_list_response, child?: fields_list_response}

export function Subtasks({f}: F) {
  return <>
    <ListSubtasks parent={f} />
    <AddSubtask parent={f} />
  </>
}

function ListSubtasks({parent}: ParentNoChild) {
  const fields = useStore(s => s.res.fields_list_response?.rows || [])
  return fields
    .filter(child => child.parent_id === parent.id)
    .map(child => <ViewSubtask
        key={child.id}
        parent={parent}
        child={child}
      />
    )
}

function ViewSubtask({parent, child}: ParentChild) {
  const [
    send,
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

  return <Box>
    <Box sx={{...flex, justifyContent: "space-between"}}>
      <Box sx={{...flex, flex: 1}}>
        <Checkbox
          defaultChecked
          className="check"
          checked={child.score_period > 0}
          onChange={changeCheck}
        />
        <SubtaskName parent={parent} child={child} />
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
function SubtaskName({parent, child}: ParentChild) {
  const [
    editingId,
  ] = useStore(s => [
    s.behaviors.subtask.editingId,
  ], shallow)
  const [setEditingId] = useStore(useCallback(s => [s.behaviors.subtask.setEditingId], []))

  if (editingId === child.id) {
    return <Upsert parent={parent} child={child} parentId={parent.id} />
  }
  return <Box
    sx={{width: "100%", cursor: "pointer"}}
    onClick={() => setEditingId(child.id)}
  >
    <BehaviorName name={child.name} />
  </Box>
}

function AddSubtask({parent}: ParentNoChild) {
  const addingTo = useStore(s => s.behaviors.subtask.addingTo)
  if (addingTo && parent.id && addingTo === parent.id) {
    return <Upsert
      // force a re-render for the useRef & other complex HTML stuff
      parentId={addingTo}
      parent={parent}
    />
  }
  return null
}

type Upsert = ParentOptionalChild & {
  parentId: string
  onSubmit?: () => void
}
function Upsert({parent, child}: Upsert) {
  const [
    send,
    setAddingTo
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.subtask.setAddingTo,
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
    setTimeout(() => {
      inputRef.current = el
      el.focus()
    }, 1)
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
      setAddingTo(null)
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
      fullWidth
      variant="standard"
      onKeyDown={textfieldKeyDown}
      inputRef={setRef}
      form={form}
      name="name"
      onBlur={clear}
    />
  </form>
}

