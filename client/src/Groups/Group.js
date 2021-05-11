import {useStoreActions, useStoreState} from "easy-peasy";
import {useParams, useRouteMatch, Link, Switch, Route} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import Sidebar from './Sidebar'
import Teaser from "../Entries/Teaser";
import {Entry} from "../Entries/Entry";
import ReactMarkdown from "react-markdown";
import {GroupMessages} from "../Chat/Messages";
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

function Entries() {
  const entries = useStoreState(s => s.ws.data['groups/entries/get'])
  const [eid, setEid] = useState(null)

  const {arr, obj} = entries
  if (!arr?.length) {return null}

  function onOpen(id) {
    setEid(id)
  }

  function close() {
    setEid(null)
  }

  // return <Card className='group-entries'>
  return <>
    {eid && <Entry entry={obj[eid]} close={close} />}
    {arr.map(eid => <Teaser eid={eid} gotoForm={onOpen} key={eid}/> )}
  </>
}

export default function Group() {
  const {gid} = useParams()
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const emit = useStoreActions(actions => actions.ws.emit);

  const {url} = useRouteMatch() // no value gets first match
  // You need to provide the routes in descendant order. This means that if you have nested routes like:
  // users, users/new, users/edit. Then the order should be ['users/add', 'users/edit', 'users'].
  const paths = [`/groups/:gid/entries`, `/groups/:gid/about`, '/groups/:gid']
  const {path} = useRouteMatch(paths);

  useEffect(() => {
    emit(['groups/group/enter', {id: gid}])
  }, [gid])

  function renderNav() {
    return <Tabs value={path}>
      <Tab label="Chat" value={paths[2]} to={url} component={Link} />
      <Tab label="Shared Entries" value={paths[0]} to={`${url}/entries`} component={Link} />
      <Tab label="About Group" value={paths[1]} to={`${url}/about`} component={Link} />
    </Tabs>
  }

  return <div>
    <Grid container spacing={2}>
      <Grid item md={9}>
        {renderNav()}
        <Switch>
          <Route path={url} exact>
            <div className='group-chat'>
              <GroupMessages group_id={gid}/>
            </div>
          </Route>
          <Route path={`${url}/entries`}>
            <Entries />
          </Route>
          <Route path={`${url}/about`}>
            <ReactMarkdown source={group.text_long} linkTarget='_blank' />
          </Route>
        </Switch>
      </Grid>
      <Grid item md={3}>
        <Sidebar />
      </Grid>
    </Grid>
  </div>
}
