import _ from "lodash"
import React, {useCallback, useEffect, useState} from "react"
import {useStore} from "../../../data/store"

import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import CheckCircle from "@mui/icons-material/CheckCircle";
import CheckIcon from '@mui/icons-material/Check';
import Label from "@mui/icons-material/Label";
import Pencil from "@mui/icons-material/Create";
import Modal from './Modal'
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import {Loading} from '../../Components/Routing.tsx'


const colors = [
  // "#002B49",
  "#003962",
  "#00477B",
  "#005594",
  "#0066AD",
  "#0077C2",
  "#1B8BCB",
  "#4BA0D4",
  "#7CB6DD",
  // "#ACCCE6"
]

 // '#1A3E59',
 //  '#3B5C80',
 //  '#4C6B90',
 //  '#5E7A9F',
 //  '#718BAF',
 //  '#839ABE',
 //  '#94A9CD',

interface Tags {
  selected?: Record<string, boolean>
  setSelected?: (selected: Record<string, boolean>) => void
  noEdit?: boolean
  noClick?: boolean
  preSelectMain?: boolean
  hideUnselected?: boolean
}
export default function Tags({
  selected,
  setSelected,
  noEdit,
  noClick,
  preSelectMain,
  hideUnselected
}: Tags) {
  const [editTags, setEditTags] = useState(false)
  const as = useStore(state => state.user.as)
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

  if (!tags?.ids) {
    return <Loading label="tags"/>
  }


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

  function renderTag (tid: string, i: number) {
    const selected_ = selectedTags_[tid]
    if (!selected_ && hideUnselected) { return null }
    const tag = hash[tid]
    // used for tests, not CSS

    const color = colors[i]

    const sx = selected_ ? {
      border: 'none',
      color: "white",
      fontWeight: 500,
      backgroundColor: colors[i % colors.length] 
    } : {
      borderColor: colors[i % colors.length],
      borderWidth: 2
    }


    const className = `btn-select ${selected_ ? "selected" : "unselected"}`
    return <Chip
      key={tid}
      variant={selected_? "filled" : "outlined"}
      disabled={noClick}
      sx={sx}
      size= "small" 
      onClick={() => selectTag(tid, !selected_)}
      className={className}
      color={/*"primary"*/ undefined}
      label={tag.name}
    />
  }

  function renderEditTags() {
    if (noEdit) {
      return null
    }
    return <Chip
      variant="outlined" 
      color="primary"
      sx={{border: "none", fontWeight:500}}
      icon={<SettingsIcon /> }
      onClick={showEditTags}
      label="Manage tags"
      size="small"
      className="btn-edit"
    />
  }

  return <div className="tags">
    {editTags && <Modal close={closeEditTags} />}
    <Stack
      direction="row"
      spacing={1}
      alignItems="left"
      justifyContent="left"
      flexWrap="wrap"
      rowGap={1}
    >
      {ids.map(renderTag)}
      {renderEditTags()}
    </Stack>
  </div>
}

export const MainTags = <Tags />
