import NewIcon from "@mui/icons-material/PostAdd";
import InsightsIcon from "@mui/icons-material/Highlight";
import ResourcesIcon from "@mui/icons-material/MenuBook";
import ListIcon from "@mui/icons-material/ListAlt";
import React from "react";
import {ListItem, NestedList} from './Utils'

export function Journal() {
  return <NestedList primary='Journal'>
    <ListItem to='/j' icon={<NewIcon />} primary='New Entry' nested={true} />
    <ListItem to='/j/list' icon={<ListIcon />} primary='Entries' nested={true} />
    <ListItem to='/insights' icon={<InsightsIcon />} primary='Insights' nested={true} />
    <ListItem to='/resources' icon={<ResourcesIcon />} primary='Books' nested={true} />
  </NestedList>
}
