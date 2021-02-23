import React, {useState, useEffect} from 'react'
import {Switch, Route, useHistory, useParams, Link, Redirect} from 'react-router-dom'
import Group from './Group'

export default function Index() {
  const MAIN_GROUP = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'

  return <div className='groups'>
    <Switch>
      <Route path={"/groups/:gid"}>
        <Group />
      </Route>
      <Redirect from='/groups' to={`/groups/${MAIN_GROUP}`} />
    </Switch>
  </div>
}
