
// const useStyles = makeStyles((theme) => ({
//   root: {
//     width: '100%',
//     maxWidth: 360,
//     backgroundColor: theme.palette.background.paper,
//   },
//   nested: {
//     paddingLeft: theme.spacing(4),
//   },
// }));

import {NavLink as Link} from "react-router-dom";
import ListItem_, {ListItemProps} from "@mui/material/ListItem";
import ListItemButton, {ListItemButtonProps} from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText, {ListItemTextProps} from "@mui/material/ListItemText";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import React from "react";
import List from "@mui/material/List";
import Collapse from "@mui/material/Collapse";

type ListItem = ListItemProps & ListItemTextProps & {
  to?: string,
  nested?: boolean
  open?: boolean
  icon?: React.ReactNode
}
export function ListItem(props: ListItem) {
  const {nested, open, icon, primary, secondary, ...rest} = props
  if (rest.to) {
    rest.component = Link
  }
  if (nested) {
    rest.sx = {pl: 4}
  }
  return <ListItemButton
    {...rest}
  >
    {icon && <ListItemIcon>{icon}</ListItemIcon>}
    <ListItemText primary={primary} secondary={secondary} />
    {open === true ? <ExpandLess /> : open === false ? <ExpandMore /> : null}
  </ListItemButton>
}

type NestedList = ListItemProps & ListItemTextProps & {
  children: React.ReactNode
  startOpen?: boolean
  icon?: React.ReactNode
}
export function NestedList({
  primary,
  children,
  secondary=null,
  startOpen=true,
  icon=null
}: NestedList) {
  const [open, setOpen] = React.useState(startOpen);
  const toggle = () => {setOpen(!open)}

  return <List>
    <ListItem onClick={toggle} open={open} primary={primary} secondary={secondary} icon={icon} />
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </List>
}
