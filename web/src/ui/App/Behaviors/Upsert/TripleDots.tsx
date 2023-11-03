import * as React from 'react';
import Box from '@mui/material/Box';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {useCallback, useMemo} from "react";
import {useStore} from "../../../../data/store";
import {useNavigate} from "react-router-dom";
import {fields_list_response} from "../../../../../../schemas/fields.ts";
import {shallow} from "zustand/shallow";
import {TimerControls} from "../Track/Timer.tsx";

export function TripleDots({f}: { f: fields_list_response }) {
  if (!f?.id) {return null}
  return <TripleDots_ fid={f.id} />
}
export function TripleDots_({fid}: { fid: string }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate()
  const [timer] = useStore(s => [s.behaviors.timer], shallow)
  const [
    setView,
    destroy,
    timerActivate,
  ] = useStore(useCallback(s => [
    s.behaviors.setView,
    s.behaviors.destroy,
    s.behaviors.timerActivate,
  ], []))

  const open = Boolean(anchorEl);
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])
  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const edit = useCallback(() => {
    handleClose()
    setView({view: "edit", fid})
  }, [fid])
  const analyze = useCallback(() => {
    handleClose()
    setView({view: "view", fid})
    navigate("/b/analyze")
  }, [fid])
  const clickTimer = useCallback(() => {
    handleClose()
    setView({view: "timer", fid})
  }, [fid])
  const destroy_ = useCallback(() => {
    destroy(fid, handleClose)
  }, [])


  const timerControls = useMemo(() => {
    return <TimerControls fid={fid} />
  }, [timer, fid])

  return (
    <>
      <Box sx={{display: "flex", alignItems: "center"}}>
        {timerControls}
        <Tooltip title="Options">
          <IconButton
            onClick={handleClick}
            size="small"
            // sx={{ ml: 2 }}
            aria-controls={open ? 'behaviors-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <MoreHorizIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id={`behaviors-menu-${fid}`}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        // TODO Do I need any of this? copied/pasted from MUI docs
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            // '& .MuiAvatar-root': {
            //   width: 32,
            //   height: 32,
            //   ml: -0.5,
            //   mr: 1,
            // },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={edit}>
          Edit
        </MenuItem>
        <MenuItem onClick={analyze}>
          Analyze
        </MenuItem>
        <MenuItem onClick={clickTimer}>
          Timer
        </MenuItem>
        <CompleteDelete fid={fid} close={handleClose} />
        <MenuItem onClick={destroy_}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}

function CompleteDelete({fid, close}: {fid: string, close: () => void}) {
  const [
    send,
    dayStr,
    isToday,
    f,
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.dayStr,
    s.behaviors.isToday,
    s.res.fields_list_response?.hash?.[fid]
  ], []))
  const completeDelete = useCallback(() => {
    close()
    send("fields_entries_post_request", {
      field_id: fid,
      day: isToday ? null : dayStr,
      value: 1,
      thenDelete: true
    })
  }, [fid])
  if (!f) {return null}
  if (f.lane !== "todo" || f.score_period > 0) {return null}
  return <MenuItem onClick={completeDelete}>
    Complete + Delete
  </MenuItem>
}
