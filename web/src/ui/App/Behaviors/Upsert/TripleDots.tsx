import * as React from 'react';
import Box from '@mui/material/Box';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {useCallback} from "react";
import {useStore} from "../../../../data/store";
import {useNavigate} from "react-router-dom";
import {fields_list_response} from "../../../../../../schemas/fields.ts";

export function TripleDots({f}: { f: fields_list_response }) {
  const fid = f.id
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate()
  const [
    setView,
    destroy,
  ] = useStore(useCallback(s => [
    s.behaviors.setView,
    s.behaviors.destroy,
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
    navigate("/behaviors/analyze")
  }, [fid])
  const destroy_ = useCallback(() => {
    destroy(fid, handleClose)
  }, [])

  if (!fid) {return null}

  return (
    <>
      <Box>
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
        <MenuItem onClick={destroy_}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
