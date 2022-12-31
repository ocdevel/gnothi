import NewIcon from "@mui/icons-material/PostAdd";
import ListIcon from "@mui/icons-material/ListAlt";
import React from "react";
import {ListItem, NestedList} from './Utils'

export function Journal() {
  return <>
    <ListItem to='/j' icon={<NewIcon />} primary='New Entry' nested={true} />
    <ListItem to='/j/insights' icon={<ListIcon />} primary='Dashboard' nested={true} />
  </>
}
