import React, {useState, useEffect} from 'react'
import {Switch, Route, useHistory, useParams, Link, Redirect} from 'react-router-dom'
import Group from './Group'
import {useStoreActions} from "easy-peasy";
import AllGroups from "./AllGroups";

export default function Index() {
  const emit = useStoreActions(a => a.ws.emit)

  useEffect(() => {
    emit(['groups/groups/get', {}])
  }, [])

  return <div className='groups'>
    <Switch>
      <Route path={"/groups"} exact>
        <AllGroups />
      </Route>
      <Route path={"/groups/:gid"}>
        <Group />
      </Route>
    </Switch>
  </div>
}
