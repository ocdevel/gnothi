import shallow from "zustand/shallow";
import React, {useCallback} from "react";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import {FieldName} from "../utils";
import SortIcon from '@mui/icons-material/DragIndicatorOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import ViewIcon from '@mui/icons-material/BarChartOutlined';
import {useStore} from '../../../../data/store'

export default function Behavior({fid}: {fid: string}) {
  const [fields, setView] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.setView
  ], shallow)
  const field = fields?.hash?.[fid]

  const handleSort = useCallback(() => {
    alert("Not implemented")
  }, [fid])

  const handleEdit = useCallback(() => {
    setView({view: "edit", fid})
  }, [fid])

  const handleView = useCallback(() => {
    setView({view: "view", fid})
  }, [fid])

  if (!field) {return null}
  return <Stack
    className="behavior"
    direction="row"
    spacing={2}
    alignItems="center"
  >
    <Stack direction="row" alignItems="center">
      <IconButton
        sx={{cursor: "grab"}}
        onClick={handleSort}
      >
        <SortIcon />
      </IconButton>
      <IconButton onClick={handleEdit} className='btn-edit'>
        <EditIcon />
      </IconButton>
      <IconButton onClick={handleView} className='btn-view'>
        <ViewIcon />
      </IconButton>
    </Stack>
    <Box
      sx={{flex: 1}}
      onClick={() => setView({view: "edit", fid})}
    >
      <FieldName name={field.name} />
    </Box>
  </Stack>
}
