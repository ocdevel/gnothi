import {useStore} from "../../../../../data/store";
import {ListItem, NestedList} from "../Utils";
import Share from "@mui/icons-material/Share";
import GroupAdd from "@mui/icons-material/GroupAdd";
import React from "react";
import {Groups} from "./Groups";
import Sharing from './Sharing'

export default function Community() {
  const as = useStore(s => s.user.as)

  return <NestedList primary='Community' icon={<GroupAdd />}>
    <Sharing />
    <Groups />
    <ListItem
      to="/t"
      primary="Find Therapists"
      nested={true}
    />
  </NestedList>
}
