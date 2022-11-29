import NewIcon from "@mui/icons-material/PostAdd";
import ListIcon from "@mui/icons-material/ListAlt";
import React from "react";
import {ListItem, NestedList} from './Utils'

export function Journal() {
  return <NestedList primary='Journal'>
    <ListItem to='/j' icon={<NewIcon />} primary='New Entry' nested={true} />
    <ListItem to='/j/analyze' icon={<ListIcon />} primary='Analyze' nested={true} />
  </NestedList>
}
