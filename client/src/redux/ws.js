import {useStoreState, useStoreActions, action} from 'easy-peasy'
import {API_URL} from './server'
import { useState, useEffect } from 'react';
import io, {Manager} from "socket.io-client";
import _ from 'lodash'

const host = API_URL.replace(/^https?/, 'ws')

export const store = {
  ws: null,
  setWs: action((state, payload) => {
    state.ws = payload
  })
}

let ws;
export function useSockets() {
  const setWs = useStoreActions(actions => actions.ws.setWs)
  const setAi = useStoreActions(actions => actions.server.setAi)
  const jwt = useStoreState(state => state.user.jwt)
  const onAnyGroups = useStoreActions(actions => actions.groups.onAny)

  useEffect(() => {
    // don't initialize for browsing home page
    if (!jwt) {return _.noop}
    if (ws) {return _.noop}
    ws = true

    console.log("-----Setup Socket.io-----")
    ws = io(host, {
      path: `/ws/socket.io`,
      upgrade: true,
      transports: ["websocket", "polling"],
      rejectUnauthorized: false,
      query: {token: jwt}
    });

    ws.on("AI_STATUS", data => {
      setAi(data.status)
    })

    ws.onAny((event, ...args) => {
      const nsp = event.split('/')
      if (nsp[0] !== 'client') {return}
      if (nsp[1] == 'groups') {
        onAnyGroups([nsp[2], args])
      }
    })

    // will need it in other locations
    setWs(ws)

    return () => {
      ws.close()
      ws = null
      setWs(ws)
    }
  }, [jwt])

  return ws;
}
