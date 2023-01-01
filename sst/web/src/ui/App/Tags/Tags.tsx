import _ from "lodash"
import React, {useCallback, useEffect, useState} from "react"
import {useStore} from "../../../data/store"

import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import CheckCircle from "@mui/icons-material/CheckCircle";
import Label from "@mui/icons-material/Label";
import Pencil from "@mui/icons-material/Create";
import Modal from './Modal'
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

interface Tags {
  selected?: Record<string, boolean>
  setSelected?: (selected: Record<string, boolean>) => void
  noEdit?: boolean
  noClick?: boolean
  preSelectMain?: boolean
}
export default function Tags({
  selected,
  setSelected,
  noEdit,
  noClick,
  preSelectMain
}: Tags) {
  const [editTags, setEditTags] = useState(false)
  const as = useStore(state => state.as)
  const send = useStore(s => s.send)
  // tags sorted on server
  const tags = useStore(s => s.res.tags_list_response)
  const selectedTags = useStore(s => s.selectedTags)
  noEdit = !!as || noEdit

  const ids = tags?.ids || []
  const hash = tags?.hash || {}

  // no selected,setSelected props indicates using global tags
  const selectedTags_ = selected || selectedTags

  useEffect(() => {
    if (ids.length && preSelectMain) {
      const main = _.find(hash, t => t.main)
      if (main) {
        selectTag(main.id, true)
      }
    }
  }, [hash])


  const selectTag = async (id: string, v: boolean) => {
    if (setSelected) {
      setSelected({...selectedTags_, [id]: v})
    } else {
      send('tags_toggle_request', {id})
      // await getTags()  # fixme
    }
  }
  // const clear = async () => {
  //   _.each(tags, t => {selectTag(t.id,false)})
  // }
  const showEditTags = () => {
    if (noEdit) {return}
    setEditTags(true)
  }
  const closeEditTags = () => setEditTags(false)

  function renderTag (tid: string) {
    const selected_ = selectedTags_[tid]
    const tag = hash[tid]
    return <Box key={tid}>
      <FormControlLabel 
        control={
          <Switch
            checked={selected_}
            disabled={noClick}
            icon={selected_ ? <CheckCircle /> : undefined}
            variant={selected_ ? undefined : "outlined"}
            color= "secondary" 
            onChange={() => selectTag(tid, !selected_)}
            className="button-tags-tag"
          />
        }
        label={tag.name}
      />
    </Box>
  }

  function renderEditTags() {
    if (noEdit) {
      return <Chip
        variant="outlined"
        sx={{border: 'none'}}
        icon={<Label/>}
        label="Tags"
      />
    }
    return <Chip
      variant="outlined" color="primary"
      icon={<SettingsIcon /> }
      onClick={showEditTags}
      label="Tags"
      className="button-tags-edit"
    />
  }

  return <>
    {editTags && <Modal close={closeEditTags} />}
    <Stack
      direction="row"
      spacing={1}
      alignItems="left"
      justifyContent="left"
      flexWrap="wrap"
    >
      {ids.map(renderTag)}
      {renderEditTags()}
    </Stack>
  </>
}

export const MainTags = <Tags />
