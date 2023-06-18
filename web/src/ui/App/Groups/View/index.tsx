import {useStore} from "../../../../data/store"
import {useParams, useMatches, Link, Routes, Route} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import Sidebar from './Sidebar'
import ReactMarkdown from "react-markdown";
import {GroupMessages} from "../../Chat/Messages";
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Entries from './Entries'
import {Loading} from "../../../Components/Routing";

export default function Group() {
  const params = useParams()
  const group = useStore(s => s.res.groups_get_response)
  const send = useStore(s => s.send);
  const gid = params.gid
  const rest = params['*'] || []

  // You need to provide the routes in descendant order. This means that if you have nested routes like:
  // users, users/new, users/edit. Then the order should be ['users/add', 'users/edit', 'users'].
  const paths = {
    entries: `/groups/${gid}/entries`,
    about: `/groups/${gid}/about`,
    chat: `/groups/${gid}/`
  }
  const path = `/groups/${gid}/${rest[0]}`

  useEffect(() => {
    send('groups_enter_request', {id: gid})
  }, [gid])

  if (!group) {
    return <Loading label="groups_get_response" />
  }

  function renderNav() {
    return <Tabs value={path}>
      <Tab label="Chat" value={paths.chat} to={paths.chat} component={Link} />
      <Tab label="Shared Entries" value={paths.entries} to={paths.entries} component={Link} />
      <Tab label="About Group" value={paths.about} to={paths.about} component={Link} />
    </Tabs>
  }

  return <div>
    <Grid container spacing={2}>
      <Grid item md={9}>
        {renderNav()}
        <Routes>
          <Route index element={
            <div className='group-chat'>
              <GroupMessages group_id={gid}/>
            </div>} />
          <Route path='entries' element={<Entries />} />
          <Route path='about'
            element={<ReactMarkdown source={group.text_long} linkTarget='_blank' />}
          />
        </Routes>
      </Grid>
      <Grid item md={3}>
        <Sidebar />
      </Grid>
    </Grid>
  </div>
}
