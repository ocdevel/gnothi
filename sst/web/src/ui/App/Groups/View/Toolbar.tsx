import {useStore} from "../../../../data/store";
// import {ToolbarHeader} from "../../../Components/Misc";
import React from "react";

export default function GroupToolbar() {
  const group = useStore(s => s.res.groups_get_response?.first)
  return <ToolbarHeader title={group?.title || "Group"}/>
}


