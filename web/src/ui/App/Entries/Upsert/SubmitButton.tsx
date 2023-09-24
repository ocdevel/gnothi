import * as React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import {useStore} from "../../../../data/store";
import Typography from "@mui/material/Typography";
import {Stack2} from "../../../Components/Misc.tsx";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {shallow} from "zustand/shallow";


interface SubmitButton {
  form: any
  submit: any
  submitting: boolean
}
export default function SubmitButton({form, submit, submitting}: SubmitButton) {
  const [me, creditActive] = useStore(s => [
    s.user?.me, // TODO viewer?
    s.creditActive
  ], shallow)
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const options = [
    `AI Submit${creditActive ? "" : " (1 credit)"}`,
    'Submit'
  ];

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
    form.setValue("generative", index === 0)
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  if (me?.premium) {
    return <Button
      onClick={submit}
      className="btn-submit"
      disabled={submitting}
    >
      AI Submit
    </Button>
  }

  return <Stack spacing={1} direction='column' alignItems='center'>
    <Box>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="split button"
        disableElevation
      >
        <Button
          onClick={submit}
          className="btn-submit"
          disabled={submitting}
        >
          {options[selectedIndex]}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="submit via AI or as-is"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      // disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
    {selectedIndex === 0 && <>
      <Typography variant='body2'>{me?.credits ?? 10} / 10 Credits{creditActive ? " (credit currently active)" : ""}</Typography>
      <Typography variant="caption" sx={{textDecoration: "underline"}}>What's this?</Typography>
    </>}
  </Stack>
}
