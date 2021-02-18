import React, {useEffect} from 'react'
import {StoreProvider, useStoreActions, useStoreState} from "easy-peasy";
import store from './redux/store'
import {useHistory, useLocation} from "react-router-dom";

function App() {
  const jwt = useStoreState(state => state.jwt);
  const user = useStoreState(state => state.user);
  const as = useStoreState(state => state.as);
  const error = useStoreState(state => state.error);
	const getUser = useStoreActions(actions => actions.user.getUser)
	const getTags = useStoreActions(actions => actions.insights.getTags)
	const getEntries = useStoreActions(actions => actions.insights.getEntries)
	const getFields = useStoreActions(actions => actions.insights.getFields)


  useEffect(() => {
    if (!jwt) { return }
    getUser()
    getTags()
    getEntries()
    getFields()
  }, [jwt, as])

  return null
}

export default function Tmp() {
  return <StoreProvider store={store}><App /></StoreProvider>
}
