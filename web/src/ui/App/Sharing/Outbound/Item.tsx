import _ from "lodash";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {FaRegComments, FaTags, FaUser} from "react-icons/fa";
import React, {useCallback, useMemo} from "react";
import * as S from "@gnothi/schemas"
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import {useShallow} from "zustand/react/shallow";

export default function Item({sid}: { sid: string }) {
  const [
    myGroups,
    s,
    tags,
  ] = useStore(useShallow(s => [
    s.res.groups_mine_list_response?.hash,
    s.res.shares_egress_list_response?.hash?.[sid],
    s.res.tags_list_response?.hash
  ]))
  const [
    setView
  ] = useStore(useCallback(s => [
    () => s.sharing.setView({tab: "egress", egress: "edit", sid})
  ], []))

  const renderedTags = useMemo(() => {
    const tagsKeys = s?.tags ? Object.keys(s.tags) : []
    if (!tagsKeys?.length) {return null}
    const tagsList = tagsKeys.map((id) => tags?.[id].name).join(', ')
    return <div><FaTags /> {tagsList}</div>
  }, [s?.tags, tags])

  const renderedEmails = useMemo(() => {
    const emails = s?.users ? Object.keys(s.users) : []
    if (!emails?.length) {return null}
    return <div><FaUser /> {emails.join(', ')}</div>
  }, [s?.users])

  const renderedGroups = useMemo(() => {
    const groups = s?.groups ? Object.keys(s.groups) : []
    if (!groups?.length) {return null}
    return <div><FaRegComments /> {groups.map((id) => myGroups?.[id].title).join(', ')}</div>
  }, [s?.groups, myGroups])

  return <Card
    sx={{mb: 2, cursor: 'pointer'}}
    onClick={setView}
  >
    <CardContent>
      {renderedEmails}
      {renderedTags}
      {renderedGroups}
    </CardContent>
  </Card>
}

