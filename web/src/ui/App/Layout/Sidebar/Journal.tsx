import NewIcon from "@mui/icons-material/PostAdd";
import ListIcon from "@mui/icons-material/ListAlt";
import React from "react";
import {ListItem, NestedList} from './Utils'
import TimelineIcon from "@mui/icons-material/Timeline";

export function Journal() {
  return <>
    <ListItem to='/j' icon={<NewIcon />} primary='New Entry' nested={true} />
    <ListItem to='/j' icon={<ListIcon />} primary='Dashboard' nested={true} />
    <ListItem
      to="/b"
      primary="Behaviors"
      icon={<TimelineIcon />}
      nested={true}
    />
  </>
}
