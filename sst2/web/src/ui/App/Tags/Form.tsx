import {useStore} from "../../../data/store";
import React, {useCallback, useState} from "react";
import _ from "lodash";
import Paper from "@mui/material/Paper";
import Reorder from "@mui/icons-material/Reorder";
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import {FaRobot} from "react-icons/fa";
import IconButton from "@mui/material/IconButton";
import Delete from "@mui/icons-material/Delete";
import {styles} from './utils'

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from "react-hook-form";
import {Tags} from '../../../data/schemas/tags'

export default function Form({tag}) {
  const { register, handleSubmit, formState:{ errors } } = useForm({
    resolver: zodResolver(Tags.tags_put_request)
  });

  const send = useStore(s => s.send)
  // Can't use useForm() since need custom onChange (which tiggers submit)
  const [name, setName] = useState(tag.name)
  const [ai, setAi] = useState(tag.ai)
  const id = tag.id

  function submit(data) {
    send('tags_put_request', data)
  }
  const waitSubmit = useCallback(_.debounce(submit, 200), [])

  const changeName = e => {
    const name = e.target.value
    waitSubmit({id, name, ai})
    setName(e.target.value)
  }
  const changeAi = e => {
    const ai = e.target.checked
    submit({id, name, ai})
    setAi(ai)
  }

  const destroyTag = async () => {
    if (window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      send('tags_delete_request', {id})
    }
  }

  return <div>
    <Paper sx={styles.paper}>
      <Reorder />
      <InputBase
        sx={styles.inputBase}
        placeholder="Tag Name"
        value={name}
        onChange={changeName}
      />
      <Divider orientation="vertical" />
      <FormControlLabel
        control={<Switch checked={ai} onChange={changeAi} name="ai" color='primary'/>}
        label={<FaRobot />}
      />
      {tag.main ? <div /> : <IconButton onClick={destroyTag}>
        <Delete />
      </IconButton>}
    </Paper>
  </div>
}
