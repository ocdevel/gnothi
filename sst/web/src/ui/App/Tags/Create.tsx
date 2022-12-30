import {useStore} from "../../../data/store";
import Paper from "@mui/material/Paper";
import {Controller, useForm} from "react-hook-form";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import React, {useState, useEffect, useCallback, useMemo} from "react";
import {styles} from './utils'
import {zodResolver} from "@hookform/resolvers/zod/dist/zod";
import {Tags} from "@gnothi/schemas/tags";

export default function Create() {
  const { control, register, reset, handleSubmit, formState:{ errors } } = useForm({
    resolver: zodResolver(Tags.tags_post_request)
  });
  const send = useStore(s => s.send)
  const tagsPost = useStore(s => s.res.tags_post_response?.res)
  const clearEvents = useStore(useCallback(s => s.clearEvents, []))
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (tagsPost) {
      setWaiting(false)
      reset({name: ""})
      clearEvents(['tags_post_request'])
    }
  }, [tagsPost])

  function submit(data: Tags.tags_post_request) {
    send('tags_post_request', data)
    setWaiting(true)
  }

  return <form onSubmit={handleSubmit(submit)}>
    <Paper sx={styles.paper}>
      <Controller
        name='name'
        control={control}
        render={({field}) => <InputBase
          sx={styles.inputBase}
          placeholder="New tag name"
          value={field.value}
          onChange={field.onChange}
          className="textfield-tags-post"
        />}
      />

      <Button
        size='small'
        type='submit'
        color="primary"
        variant='contained'
        className="button-tags-post"
        disabled={waiting}
      >Add</Button>
    </Paper>
  </form>
}
