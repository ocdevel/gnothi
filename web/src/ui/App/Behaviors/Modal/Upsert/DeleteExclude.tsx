import {UpsertProps} from "./Utils.tsx";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import React from "react";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../../data/store";

export function DeleteButtons({form, field, isNew}: UpsertProps) {
  const [send] = useStore(s => [s.send], shallow)
  const fid = field?.id
  if (!fid) {return null}

  const destroyField = async () => {
    if (!fid) {return}
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    send('fields_delete_request', {id: fid})
    close()
  }

  const excludeField = async (exclude=true) => {
    send('fields_exclude_request', {id: fid, exclude})
    // close(false)
  }

  return <Stack>
    <Typography mt={3} color="primary" variant={"body1"} fontWeight={500}>Delete or exclude a behavior</Typography>
    <Typography mb={3} variant="body2">Excluding a behavior temporarily removes it from showing up, optimizing machine learning with fewer fields, while <u><i>deleting permanently erases the behavior</i></u> and all associated values.</Typography>

    <Stack direction='row'>
      <Stack alignItems='center' flex={1}>
          <Button
          className="btn-delete"
          color='error'
          disabled={!!field.service}
          onClick={destroyField}
          size='small'
        >Delete</Button>
      </Stack>
      <Divider orientation='vertical' flexItem />
      <Stack alignItems='center' flex={1}>
        {field.excluded_at ? <>
          <Button
            color='info'
            onClick={() => excludeField(false)}
            size='small'
          >Include</Button>
          <Typography variant='body2'>Bring this field back</Typography>
        </> : <>
          <Button
            className='btn-remove'
            color='error'
            onClick={() => excludeField(true)}
            size='small'
          >Exclude</Button>
        </>}
      </Stack>
      </Stack>
    </Stack>
}