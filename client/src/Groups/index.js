import React, {useState, useEffect} from 'react'
import {Switch, Route, useHistory, useParams, Link, Redirect} from 'react-router-dom'
import Group from './Group'
import {useStoreActions} from "easy-peasy";

const MAIN_GROUP = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'

export default function Index() {
  const emit = useStoreActions(a => a.ws.emit)

  useEffect(() => {
    emit(['groups/groups/get',  {}])
    emit(['users/profile/get', {}])
  }, [])

  return <div className='groups'>
    <Switch>
      <Route path={"/groups/:gid"}>
        <Group />
      </Route>
      <Redirect from='/groups' to={`/groups/${MAIN_GROUP}`} />
    </Switch>
  </div>
}
