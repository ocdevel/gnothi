import {useStore} from "../../../data/store";
import React, {useCallback, useMemo, useState} from "react";
import Paper from "@mui/material/Paper";
import Reorder from '@mui/icons-material/DragIndicatorOutlined';
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import {FaRobot} from "react-icons/fa";
import IconButton from "@mui/material/IconButton";
import Delete from "@mui/icons-material/Delete";
import {styles} from './utils'

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm, Controller} from "react-hook-form";
import {Tags} from '@gnothi/schemas/tags'
import {debounce} from 'lodash'
import Box from "@mui/material/Box";

interface Form {
  tag: Tags.tags_list_response
}
export default function Form({tag}: Form) {
  const { getValues, register, handleSubmit, control, formState:{ errors } } = useForm({
    resolver: zodResolver(Tags.tags_put_request),
    defaultValues: tag
  });

  const send = useStore(s => s.send)

  function submit() {
    const data = getValues()
    send('tags_put_request', data)
  }
  const waitSubmit = useMemo(() => debounce(submit, 300), [])

  const destroyTag = async () => {
    if (window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      send('tags_delete_request', {id: tag.id})
    }
  }

  return <Box className="form-tags-put">
    <Paper sx={styles.paper}>
      {/*<Reorder />*/}
      <Controller
        name="name"
        control={control}
        render={({field}) => (
          <InputBase
            className="textfield-tags-name"
            sx={styles.inputBase}
            placeholder="Tag Name"
            {...field}
            onChange={e => {field.onChange(e); waitSubmit()}}
          />
        )}
      />
      <Divider orientation="vertical" />
      <Controller
        name="ai_index"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch
              {...field}
              className="checkbox-tags-ai-index"
              checked={!!field.value}
              onChange={e => {field.onChange(e); submit()}}
              color='primary'
            />}
            label={<><FaRobot /> Index</>}
          />
        )}
      />
      <Controller
        name="ai_summarize"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch
              {...field}
              className="checkbox-tags-ai-summarize"
              checked={!!field.value}
              color='primary'
              onChange={e => {field.onChange(e); submit()}}
            />}
            label={<><FaRobot /> Summarize</>}
          />
        )}
      />
      {tag.main ? <IconButton sx={{color: 'white'}}>
        <Delete />
      </IconButton> : <IconButton onClick={destroyTag}>
        <Delete />
      </IconButton>}
    </Paper>
  </Box>
}
